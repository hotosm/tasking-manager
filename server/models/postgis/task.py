import bleach
import datetime
import geojson
import json
from enum import Enum
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
from sqlalchemy.orm.session import make_transient
from geoalchemy2 import Geometry
from server import db
from typing import List
from server.models.dtos.mapping_dto import TaskDTO, TaskHistoryDTO
from server.models.dtos.validator_dto import MappedTasksByUser, MappedTasks
from server.models.dtos.project_dto import ProjectComment, ProjectCommentsDTO
from server.models.postgis.statuses import TaskStatus, MappingLevel
from server.models.postgis.user import User
from server.models.postgis.utils import InvalidData, InvalidGeoJson, ST_GeomFromGeoJSON, ST_SetSRID, timestamp, NotFound


class TaskAction(Enum):
    """ Describes the possible actions that can happen to to a task, that we'll record history for """
    LOCKED_FOR_MAPPING = 1
    LOCKED_FOR_VALIDATION = 2
    STATE_CHANGE = 3
    COMMENT = 4
    AUTO_UNLOCKED_FOR_MAPPING = 5
    AUTO_UNLOCKED_FOR_VALIDATION = 6


class TaskHistory(db.Model):
    """ Describes the history associated with a task """
    __tablename__ = "task_history"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True)
    task_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String, nullable=False)
    action_text = db.Column(db.String)
    action_date = db.Column(db.DateTime, nullable=False, default=timestamp)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users'), nullable=False)

    actioned_by = db.relationship(User)

    __table_args__ = (db.ForeignKeyConstraint([task_id, project_id], ['tasks.id', 'tasks.project_id'], name='fk_tasks'),
                      db.Index('idx_task_history_composite', 'task_id', 'project_id'), {})

    def __init__(self, task_id, project_id, user_id):
        self.task_id = task_id
        self.project_id = project_id
        self.user_id = user_id

    def set_task_locked_action(self, task_action: TaskAction):
        if task_action not in [TaskAction.LOCKED_FOR_MAPPING, TaskAction.LOCKED_FOR_VALIDATION]:
            raise ValueError('Invalid Action')

        self.action = task_action.name

    def set_comment_action(self, comment):
        self.action = TaskAction.COMMENT.name
        clean_comment = bleach.clean(comment)  # Bleach input to ensure no nefarious script tags etc
        self.action_text = clean_comment

    def set_state_change_action(self, new_state):
        self.action = TaskAction.STATE_CHANGE.name
        self.action_text = new_state.name

    def set_auto_unlock_action(self, task_action: TaskAction):
        self.action = task_action.name

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def update_task_locked_with_duration(task_id: int, project_id: int, lock_action: TaskStatus, user_id: int):
        """
        Calculates the duration a task was locked for and sets it on the history record
        :param task_id: Task in scope
        :param project_id: Project ID in scope
        :param lock_action: The lock action, either Mapping or Validation
        :param user_id: Logged in user updating the task
        :return:
        """
        try:
            last_locked = TaskHistory.query.filter_by(task_id=task_id, project_id=project_id, action=lock_action.name,
                                                      action_text=None, user_id=user_id).one()
        except NoResultFound:
            # We suspect there's some kind or race condition that is occasionally deleting history records
            # prior to user unlocking task. Most likely stemming from auto-unlock feature. However, given that
            # we're trying to update a row that doesn't exist, it's better to return without doing anything
            # rather than showing the user an error that they can't fix
            return
        except MultipleResultsFound:
            # Again race conditions may mean we have multiple rows within the Task History.  Here we attempt to
            # remove the oldest duplicate rows, and update the newest on the basis that this was the last action
            # the user was attempting to make.
            TaskHistory.remove_duplicate_task_history_rows(task_id, project_id, lock_action, user_id)

            # Now duplicate is removed, we recursively call ourself to update the duration on the remaining row
            TaskHistory.update_task_locked_with_duration(task_id, project_id, lock_action, user_id)
            return

        duration_task_locked = datetime.datetime.utcnow() - last_locked.action_date
        # Cast duration to isoformat for later transmission via api
        last_locked.action_text = (datetime.datetime.min + duration_task_locked).time().isoformat()
        db.session.commit()

    @staticmethod
    def remove_duplicate_task_history_rows(task_id: int, project_id: int, lock_action: TaskStatus, user_id: int):
        """ Method used in rare cases where we have duplicate task history records for a given action by a user
            This method will remove the oldest duplicate record, on the basis that the newest record was the
            last action the user was attempting to perform
        """
        dupe = TaskHistory.query.filter(TaskHistory.project_id == project_id,
                                        TaskHistory.task_id == task_id,
                                        TaskHistory.action == lock_action.name,
                                        TaskHistory.user_id == user_id).order_by(TaskHistory.id.asc()).first()

        dupe.delete()

    @staticmethod
    def update_expired_and_locked_actions(project_id: int, task_id: int, expiry_date: datetime, action_text: str):
        """
        Sets auto unlock state to all not finished actions, that are older then the expiry date.
        Action is considered as a not finished, when it is in locked state and doesn't have action text
        :param project_id: Project ID in scope
        :param task_id: Task in scope
        :param expiry_date: Action created before this date is treated as expired
        :param action_text: Text which will be set for all changed actions
        :return:
        """
        all_expired = TaskHistory.query.filter(
            TaskHistory.task_id == task_id,
            TaskHistory.project_id == project_id,
            TaskHistory.action_text.is_(None),
            TaskHistory.action.in_([TaskAction.LOCKED_FOR_VALIDATION.name, TaskAction.LOCKED_FOR_MAPPING.name]),
            TaskHistory.action_date <= expiry_date).all()

        for task_history in all_expired:
            unlock_action = TaskAction.AUTO_UNLOCKED_FOR_MAPPING if task_history.action == 'LOCKED_FOR_MAPPING' \
                else TaskAction.AUTO_UNLOCKED_FOR_VALIDATION

            task_history.set_auto_unlock_action(unlock_action)
            task_history.action_text = action_text

        db.session.commit()

    @staticmethod
    def get_all_comments(project_id: int) -> ProjectCommentsDTO:
        """ Gets all comments for the supplied project_id"""

        comments = db.session.query(TaskHistory.task_id,
                                    TaskHistory.action_date,
                                    TaskHistory.action_text,
                                    User.username) \
            .join(User) \
            .filter(TaskHistory.project_id == project_id, TaskHistory.action == TaskAction.COMMENT.name).all()

        comments_dto = ProjectCommentsDTO()
        for comment in comments:
            dto = ProjectComment()
            dto.comment = comment.action_text
            dto.comment_date = comment.action_date
            dto.user_name = comment.username
            dto.task_id = comment.task_id
            comments_dto.comments.append(dto)

        return comments_dto

    @staticmethod
    def get_last_status(project_id: int, task_id: int, for_undo: bool = False):
        """ Get the status the task was set to the last time the task had a STATUS_CHANGE"""
        result = db.session.query(TaskHistory.action_text) \
            .filter(TaskHistory.project_id == project_id,
                    TaskHistory.task_id == task_id,
                    TaskHistory.action == TaskAction.STATE_CHANGE.name) \
            .order_by(TaskHistory.action_date.desc()).all()

        if not result:
            return TaskStatus.READY  # No result so default to ready status

        if len(result) == 1 and for_undo:
            # We're looking for the previous status, however, there isn't any so we'll return Ready
            return TaskStatus.READY

        if for_undo:
            # Return the second last status which was status the task was previously set to
            return TaskStatus[result[1][0]]
        else:
            return TaskStatus[result[0][0]]

    @staticmethod
    def get_last_action(project_id: int, task_id: int):
        """Gets the most recent task history record for the task"""
        return TaskHistory.query.filter(TaskHistory.project_id == project_id,
                                        TaskHistory.task_id == task_id) \
            .order_by(TaskHistory.action_date.desc()).first()

    @staticmethod
    def get_last_action_of_type(project_id: int, task_id: int, allowed_task_actions: list):
        """Gets the most recent task history record having provided TaskAction"""
        return TaskHistory.query.filter(TaskHistory.project_id == project_id,
                                        TaskHistory.task_id == task_id,
                                        TaskHistory.action.in_(allowed_task_actions)) \
            .order_by(TaskHistory.action_date.desc()).first()

    @staticmethod
    def get_last_locked_action(project_id: int, task_id: int):
        """Gets the most recent task history record with locked action for the task"""
        return TaskHistory.get_last_action_of_type(
            project_id, task_id,
            [TaskAction.LOCKED_FOR_MAPPING.name, TaskAction.LOCKED_FOR_VALIDATION.name])

    @staticmethod
    def get_last_locked_or_auto_unlocked_action(project_id: int, task_id: int):
        """Gets the most recent task history record with locked or auto unlocked action for the task"""
        return TaskHistory.get_last_action_of_type(
            project_id, task_id,
            [TaskAction.LOCKED_FOR_MAPPING.name, TaskAction.LOCKED_FOR_VALIDATION.name,
             TaskAction.AUTO_UNLOCKED_FOR_MAPPING.name, TaskAction.AUTO_UNLOCKED_FOR_VALIDATION.name])


class Task(db.Model):
    """ Describes an individual mapping Task """
    __tablename__ = "tasks"

    # Table has composite PK on (id and project_id)
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True, primary_key=True)
    x = db.Column(db.Integer)
    y = db.Column(db.Integer)
    zoom = db.Column(db.Integer)
    extra_properties = db.Column(db.Unicode)
    # Tasks are not splittable if created from an arbitrary grid or were clipped to the edge of the AOI
    splittable = db.Column(db.Boolean, default=True)
    geometry = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    task_status = db.Column(db.Integer, default=TaskStatus.READY.value)
    priority = db.Column(db.Integer, default=0)
    locked_by = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users_locked'))
    mapped_by = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users_mapper'))
    validated_by = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users_validator'))

    # Mapped objects
    task_history = db.relationship(TaskHistory, cascade="all")
    lock_holder = db.relationship(User, foreign_keys=[locked_by])
    mapper = db.relationship(User, foreign_keys=[mapped_by])

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def update(self):
        """ Updates the DB with the current state of the Task """
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def from_geojson_feature(cls, task_id, task_feature):
        """
        Constructs and validates a task from a GeoJson feature object
        :param task_id: Unique ID for the task
        :param task_feature: A geoJSON feature object
        :raises InvalidGeoJson, InvalidData
        """
        if type(task_feature) is not geojson.Feature:
            raise InvalidGeoJson('Task: Invalid GeoJson should be a feature')

        task_geometry = task_feature.geometry

        if type(task_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Task: Geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(task_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Task: Invalid MultiPolygon - {is_valid_geojson['message']}")

        task = cls()
        try:
            task.x = task_feature.properties['x']
            task.y = task_feature.properties['y']
            task.zoom = task_feature.properties['zoom']
            task.splittable = task_feature.properties['splittable']
        except KeyError as e:
            raise InvalidData(f'Task: Expected property not found: {str(e)}')

        if 'extra_properties' in task_feature.properties:
            task.extra_properties = json.dumps(
                task_feature.properties['extra_properties'])

        task.id = task_id
        task_geojson = geojson.dumps(task_geometry)
        task.geometry = ST_SetSRID(ST_GeomFromGeoJSON(task_geojson), 4326)

        return task

    @staticmethod
    def get(task_id: int, project_id: int):
        """
        Gets specified task
        :param task_id: task ID in scope
        :param project_id: project ID in scope
        :return: Task if found otherwise None
        """
        # LIKELY PROBLEM AREA

        return Task.query.filter_by(id=task_id, project_id=project_id).one_or_none()

    @staticmethod
    def get_tasks(project_id: int, task_ids: List[int]):
        """ Get all tasks that match supplied list """
        return Task.query.filter(Task.project_id == project_id, Task.id.in_(task_ids))

    @staticmethod
    def get_all_tasks(project_id: int):
        """ Get all tasks for a given project """
        return Task.query.filter(Task.project_id == project_id).all()

    @staticmethod
    def auto_unlock_tasks(project_id: int):
        """Unlock all tasks locked more than 2 hours ago"""
        expiry_delta = datetime.timedelta(hours=2)
        lock_duration = (datetime.datetime.min + expiry_delta).time().isoformat()
        expiry_date = datetime.datetime.utcnow() - expiry_delta
        old_locks_query = '''SELECT t.id
            FROM tasks t, task_history th
            WHERE t.id = th.task_id
            AND t.project_id = th.project_id
            AND t.task_status IN (1,3)
            AND th.action IN ( 'LOCKED_FOR_VALIDATION','LOCKED_FOR_MAPPING' )
            AND th.action_text IS NULL
            AND t.project_id = {0}
            AND th.action_date <= '{1}'
            '''.format(project_id, str(expiry_date))

        old_tasks = db.engine.execute(old_locks_query)

        if old_tasks.rowcount == 0:
            # no tasks older than 2 hours found, return without further processing
            return

        for old_task in old_tasks:
            task = Task.get(old_task[0], project_id)
            task.auto_unlock_expired_tasks(expiry_date, lock_duration)

    def auto_unlock_expired_tasks(self, expiry_date, lock_duration):
        """Unlock all tasks locked before expiry date. Clears task lock if needed"""
        TaskHistory.update_expired_and_locked_actions(self.project_id, self.id, expiry_date, lock_duration)

        last_action = TaskHistory.get_last_locked_or_auto_unlocked_action(self.project_id, self.id)
        if last_action.action in ['AUTO_UNLOCKED_FOR_MAPPING', 'AUTO_UNLOCKED_FOR_VALIDATION']:
            self.clear_lock()

    def is_mappable(self):
        """ Determines if task in scope is in suitable state for mapping """
        if TaskStatus(self.task_status) not in [TaskStatus.READY, TaskStatus.INVALIDATED]:
            return False

        return True

    def set_task_history(self, action, user_id, comment=None, new_state=None):
        """
        Sets the task history for the action that the user has just performed
        :param task: Task in scope
        :param user_id: ID of user performing the action
        :param action: Action the user has performed
        :param comment: Comment user has added
        :param new_state: New state of the task
        """
        history = TaskHistory(self.id, self.project_id, user_id)

        if action in [TaskAction.LOCKED_FOR_MAPPING, TaskAction.LOCKED_FOR_VALIDATION]:
            history.set_task_locked_action(action)
        elif action == TaskAction.COMMENT:
            history.set_comment_action(comment)
        elif action == TaskAction.STATE_CHANGE:
            history.set_state_change_action(new_state)
        elif action in [TaskAction.AUTO_UNLOCKED_FOR_MAPPING, TaskAction.AUTO_UNLOCKED_FOR_VALIDATION]:
            history.set_auto_unlock_action(action)

        self.task_history.append(history)
        return history

    def lock_task_for_mapping(self, user_id: int):
        self.set_task_history(TaskAction.LOCKED_FOR_MAPPING, user_id)
        self.task_status = TaskStatus.LOCKED_FOR_MAPPING.value
        self.locked_by = user_id
        self.update()

    def lock_task_for_validating(self, user_id: int):
        self.set_task_history(TaskAction.LOCKED_FOR_VALIDATION, user_id)
        self.task_status = TaskStatus.LOCKED_FOR_VALIDATION.value
        self.locked_by = user_id
        self.update()

    def reset_task(self, user_id: int):
        if TaskStatus(self.task_status) in [TaskStatus.LOCKED_FOR_MAPPING, TaskStatus.LOCKED_FOR_VALIDATION]:
            self.record_auto_unlock()

        self.set_task_history(TaskAction.STATE_CHANGE, user_id, None, TaskStatus.READY)
        self.mapped_by = None
        self.validated_by = None
        self.locked_by = None
        self.task_status = TaskStatus.READY.value
        self.update()

    def clear_task_lock(self):
        """
        Unlocks task in scope in the database.  Clears the lock as though it never happened.
        No history of the unlock is recorded.
        :return:
        """
        # clear the lock action for the task in the task history
        last_action = TaskHistory.get_last_locked_action(self.project_id, self.id)
        last_action.delete()

        # Set locked_by to null and status to last status on task
        self.clear_lock()

    def record_auto_unlock(self, lock_duration):
        locked_user = self.locked_by
        last_action = TaskHistory.get_last_locked_action(self.project_id, self.id)
        next_action = TaskAction.AUTO_UNLOCKED_FOR_MAPPING if last_action.action == 'LOCKED_FOR_MAPPING' \
            else TaskAction.AUTO_UNLOCKED_FOR_VALIDATION

        self.clear_task_lock()

        # Add AUTO_UNLOCKED action in the task history
        auto_unlocked = self.set_task_history(action=next_action, user_id=locked_user)
        auto_unlocked.action_text = lock_duration
        self.update()

    def unlock_task(self, user_id, new_state=None, comment=None, undo=False):
        """ Unlock task and ensure duration task locked is saved in History """
        if comment:
            self.set_task_history(action=TaskAction.COMMENT, comment=comment, user_id=user_id)

        self.set_task_history(action=TaskAction.STATE_CHANGE, new_state=new_state, user_id=user_id)

        if new_state in [TaskStatus.MAPPED, TaskStatus.BADIMAGERY] and TaskStatus(self.task_status) != TaskStatus.LOCKED_FOR_VALIDATION:
            # Don't set mapped if state being set back to mapped after validation
            self.mapped_by = user_id
        elif new_state == TaskStatus.VALIDATED:
            self.validated_by = user_id
        elif new_state == TaskStatus.INVALIDATED:
            self.mapped_by = None
            self.validated_by = None

        if not undo:
            # Using a slightly evil side effect of Actions and Statuses having the same name here :)
            TaskHistory.update_task_locked_with_duration(self.id, self.project_id, TaskStatus(self.task_status), user_id)

        self.task_status = new_state.value
        self.locked_by = None
        self.update()

    def reset_lock(self, user_id, comment=None):
        """ Removes a current lock from a task, resets to last status and updates history with duration of lock """
        if comment:
            self.set_task_history(action=TaskAction.COMMENT, comment=comment, user_id=user_id)

        # Using a slightly evil side effect of Actions and Statuses having the same name here :)
        TaskHistory.update_task_locked_with_duration(self.id, self.project_id, TaskStatus(self.task_status), user_id)
        self.clear_lock()

    def clear_lock(self):
        """ Resets to last status and removes current lock from a task """
        self.task_status = TaskHistory.get_last_status(self.project_id, self.id).value
        self.locked_by = None
        self.update()

    @staticmethod
    def get_tasks_as_geojson_feature_collection(project_id):
        """
        Creates a geoJson.FeatureCollection object for all tasks related to the supplied project ID
        :param project_id: Owning project ID
        :return: geojson.FeatureCollection
        """
        project_tasks = \
            db.session.query(Task.id, Task.x, Task.y, Task.zoom, Task.splittable, Task.task_status, Task.priority,
                             Task.geometry.ST_AsGeoJSON().label('geojson')).filter(Task.project_id == project_id).all()

        tasks_features = []
        for task in project_tasks:
            task_geometry = geojson.loads(task.geojson)
            task_properties = dict(taskId=task.id, taskX=task.x, taskY=task.y, taskZoom=task.zoom,
                                   taskSplittable=task.splittable, taskStatus=TaskStatus(task.task_status).name,
                                   taskPriority=task.priority)
            feature = geojson.Feature(geometry=task_geometry, properties=task_properties)
            tasks_features.append(feature)

        return geojson.FeatureCollection(tasks_features)

    @staticmethod
    def get_mapped_tasks_by_user(project_id: int):
        """ Gets all mapped tasks for supplied project grouped by user"""

        # Raw SQL is easier to understand that SQL alchemy here :)
        sql = """select u.username, u.mapping_level, count(distinct(t.id)), json_agg(distinct(t.id)),
                            max(th.action_date) last_seen, u.date_registered, u.last_validation_date
                      from tasks t,
                           task_history th,
                           users u
                     where t.project_id = th.project_id
                       and t.id = th.task_id
                       and t.mapped_by = u.id
                       and t.project_id = {0}
                       and t.task_status = 2
                       and th.action_text = 'MAPPED'
                     group by u.username, u.mapping_level, u.date_registered, u.last_validation_date""".format(project_id)

        results = db.engine.execute(sql)
        if results.rowcount == 0:
            raise NotFound()

        mapped_tasks_dto = MappedTasks()
        for row in results:
            user_mapped = MappedTasksByUser()
            user_mapped.username = row[0]
            user_mapped.mapping_level = MappingLevel(row[1]).name
            user_mapped.mapped_task_count = row[2]
            user_mapped.tasks_mapped = row[3]
            user_mapped.last_seen = row[4]
            user_mapped.date_registered = row[5]
            user_mapped.last_validation_date = row[6]

            mapped_tasks_dto.mapped_tasks.append(user_mapped)

        return mapped_tasks_dto

    @staticmethod
    def get_max_task_id_for_project(project_id: int):
        """Gets the nights task id currently in use on a project"""
        sql = """select max(id) from tasks where project_id = {0} GROUP BY project_id""".format(project_id)
        result = db.engine.execute(sql)
        if result.rowcount == 0:
            raise NotFound()
        for row in result:
            return row[0]

    def as_dto_with_instructions(self, preferred_locale: str = 'en') -> TaskDTO:
        """ Get dto with any task instructions """
        task_history = []
        for action in self.task_history:
            history = TaskHistoryDTO()
            history.action = action.action
            history.action_text = action.action_text
            history.action_date = action.action_date
            history.action_by = action.actioned_by.username if action.actioned_by else None

            task_history.append(history)

        task_dto = TaskDTO()
        task_dto.task_id = self.id
        task_dto.project_id = self.project_id
        task_dto.task_status = TaskStatus(self.task_status).name
        task_dto.lock_holder = self.lock_holder.username if self.lock_holder else None
        task_dto.priority = self.priority
        task_dto.task_history = task_history

        per_task_instructions = self.get_per_task_instructions(preferred_locale)

        # If we don't have instructions in preferred locale try again for default locale
        task_dto.per_task_instructions = per_task_instructions if per_task_instructions else self.get_per_task_instructions(
            self.projects.default_locale)

        return task_dto

    def get_per_task_instructions(self, search_locale: str) -> str:
        """ Gets any per task instructions attached to the project """
        project_info = self.projects.project_info.all()

        for info in project_info:
            if info.locale == search_locale:
                return self.format_per_task_instructions(info.per_task_instructions)

    def format_per_task_instructions(self, instructions) -> str:
        """ Format instructions by looking for X, Y, Z tokens and replacing them with the task values """
        if not instructions:
            return ''  # No instructions so return empty string

        properties = {}

        if self.x:
            properties['x'] = str(self.x)
        if self.y:
            properties['y'] = str(self.y)
        if self.zoom:
            properties['z'] = str(self.zoom)
        if self.extra_properties:
            properties.update(json.loads(self.extra_properties))

        try:
            instructions = instructions.format(**properties)
        except KeyError:
            pass
        return instructions

    @staticmethod
    def set_task_priorities(project_id: int, selected_priorities, task_id: int = None):
        """ Calculates task priorities from selected priority datasets """
        priority_ids = list(map(lambda x: x[0], selected_priorities))

        cases = ""
        cases_priority = ""
        for priority in selected_priorities:
            cases += 'WHEN id = {0} THEN {1} \n'.format(priority[0], priority[1])
            cases_priority += 'WHEN priorities.id = {0} THEN {1} \n'.format(priority[0], priority[1])

        tasks_id = ""
        if task_id:
            tasks_id = ' AND tasks.id=' + str(task_id)

        ## Some helpful resources https://stackoverflow.com/q/17972020
        ## Run raw SQL since it is easier to understand in this case
        sql = """
            BEGIN;
            WITH calculated_weights AS (
                WITH d AS (
                    WITH a AS (
                            SELECT id, (st_dump(geometry)).geom AS geom,
                                CASE {2} ELSE 0 END AS weight
                            FROM priorities
                            WHERE id IN {1}
                        ), b AS (
                            SELECT id, (st_dump(geometry)).geom AS geom,
                                CASE {2} ELSE 0 END AS weight
                            FROM priorities
                            WHERE id IN {1}
                        ), c AS (
                            SELECT * FROM tasks
                            WHERE project_id = {0}
                        )
                        SELECT c.id AS task_id, max(a.weight + b.weight) AS weight
                        FROM a, b, c
                        WHERE ST_Intersects(a.geom, c.geometry)
                        AND a.id != b.id
                        AND ST_Intersects(a.geom, b.geom)
                        AND ST_Intersects(b.geom, c.geometry)
                        GROUP BY task_id, a.id
                )
            
                SELECT tasks.id, MAX(GREATEST(d.weight,
                                    (CASE {4} ELSE 0 END))) AS weight FROM d
                FULL JOIN tasks ON d.task_id = tasks.id
                JOIN priorities ON ST_Intersects(tasks.geometry, ST_MakeValid(priorities.geometry))
                WHERE tasks.project_id = {0}{3}
                GROUP BY tasks.id, d.weight
            ) UPDATE tasks SET priority = calculated_weights.weight FROM calculated_weights
                WHERE project_id = {0}{3} AND tasks.id = calculated_weights.id;
            COMMIT;
        """.format(project_id, '(' + ','.join((str(n) for n in priority_ids)) + ')', cases, tasks_id, cases_priority)
        result = db.engine.execute(sql)

        return result.rowcount

    def copy_task_history(self) -> list:
        copies = []
        for entry in self.task_history:
            db.session.expunge(entry)
            make_transient(entry)
            entry.id = None
            entry.task_id = None
            db.session.add(entry)
            copies.append(entry)

        return copies
