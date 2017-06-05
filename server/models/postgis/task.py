import datetime
import geojson
from enum import Enum
from geoalchemy2 import Geometry
from typing import List
from server import db
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
        self.action_text = comment

    def set_state_change_action(self, new_state):
        self.action = TaskAction.STATE_CHANGE.name
        self.action_text = new_state.name

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def update_task_locked_with_duration(task_id, project_id, lock_action):
        """
        Calculates the duration a task was locked for and sets it on the history record
        :param task_id: Task in scope
        :param project_id: Project ID in scope
        :param lock_action: The lock action, either Mapping or Validation
        :return:
        """
        last_locked = TaskHistory.query.filter_by(task_id=task_id, project_id=project_id, action=lock_action.name,
                                                  action_text=None).one()

        duration_task_locked = datetime.datetime.utcnow() - last_locked.action_date
        # Cast duration to isoformat for later transmission via api
        last_locked.action_text = (datetime.datetime.min + duration_task_locked).time().isoformat()
        db.session.commit()

    @staticmethod
    def get_all_comments(project_id: int) -> ProjectCommentsDTO:
        """ Gets all comments for the supplied project_id"""

        comments = db.session.query(TaskHistory.action_date,
                                    TaskHistory.action_text,
                                    User.username) \
            .join(User) \
            .filter(TaskHistory.project_id == project_id, TaskHistory.action == TaskAction.COMMENT.name).all()

        comment_list = []
        for comment in comments:
            dto = ProjectComment()
            dto.comment = comment.action_text
            dto.comment_date = comment.action_date
            dto.user_name = comment.username
            comment_list.append(dto)

        comments_dto = ProjectCommentsDTO()
        comments_dto.comments = comment_list

        return comments_dto

    @staticmethod
    def get_last_status(project_id: int, task_id: int):
        """ Get the status the task was set to the last time the task had a STATUS_CHANGE"""
        result = db.session.query(TaskHistory.action_text) \
            .filter(TaskHistory.project_id == project_id,
                    TaskHistory.task_id == task_id,
                    TaskHistory.action == TaskAction.STATE_CHANGE.name) \
            .order_by(TaskHistory.action_date.desc()).first()

        if result == None:
            return TaskStatus.READY

        return TaskStatus[result[0]]

    @staticmethod
    def get_last_action(project_id: int, task_id: int):
        """Gets the most recent task history record for the task"""
        return TaskHistory.query.filter(TaskHistory.project_id == project_id,
                                        TaskHistory.task_id == task_id) \
            .order_by(TaskHistory.action_date.desc()).first()


class Task(db.Model):
    """ Describes an individual mapping Task """
    __tablename__ = "tasks"

    # Table has composite PK on (id and project_id)
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True, primary_key=True)
    x = db.Column(db.Integer)
    y = db.Column(db.Integer)
    zoom = db.Column(db.Integer)
    # Tasks are not splittable if created from an arbitrary grid or were clipped to the edge of the AOI
    splittable = db.Column(db.Boolean, default=True)
    geometry = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    task_status = db.Column(db.Integer, default=TaskStatus.READY.value)
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
        return Task.query.filter_by(id=task_id, project_id=project_id).one_or_none()

    @staticmethod
    def get_tasks(project_id: int, task_ids: List[int]):
        """ Get all tasks that match supplied list """
        return Task.query.filter(Task.project_id == project_id, Task.id.in_(task_ids))

    @staticmethod
    def auto_unlock_tasks(project_id: int):
        """Unlock all tasks locked more than 2 hours ago"""
        old_locks_query = '''SELECT t.id
            FROM tasks t, task_history th
            WHERE t.id = th.task_id
            AND t.project_id = th.project_id
            AND t.task_status IN (1,3)
            AND th.action IN ( 'LOCKED_FOR_VALIDATION','LOCKED_FOR_MAPPING' )
            AND th.action_text IS NULL
            AND t.project_id = {0}
            AND AGE(TIMESTAMP '{1}', th.action_date) > '2 hours'
            '''.format(project_id, str(datetime.datetime.utcnow()))

        old_tasks = db.engine.execute(old_locks_query)

        if old_tasks.rowcount == 0:
            # no tasks older than 2 hours found, return without further processing
            return

        for old_task in old_tasks:
            task = Task.get(old_task[0], project_id)
            task.clear_task_lock()

    def is_mappable(self):
        """ Determines if task in scope is in suitable state for mapping """
        if TaskStatus(self.task_status) not in [TaskStatus.READY, TaskStatus.INVALIDATED, TaskStatus.BADIMAGERY]:
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

        self.task_history.append(history)

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

    def clear_task_lock(self):
        """
        Unlocks task in scope in the database.  Clears the lock as though it never happened.
        No history of the unlock is recorded.
        :return:
        """
        # Set locked_by to null and status to last status on task
        self.locked_by = None
        self.task_status = TaskHistory.get_last_status(self.project_id, self.id).value
        self.update()

        # clear the lock action for the task in the task history
        last_action = TaskHistory.get_last_action(self.project_id, self.id)
        last_action.delete();

    @staticmethod
    def invalidate_all(project_id: int, user_id: int):
        """ Invalidates all project tasks, except Ready and Bad Imagery """
        mapped_tasks = Task.query.filter(Task.project_id == project_id,
                                         ~Task.task_status.in_([TaskStatus.READY.value,
                                                                TaskStatus.BADIMAGERY.value])).all()
        for task in mapped_tasks:
            task.lock_task_for_validating(user_id)
            task.unlock_task(user_id, new_state=TaskStatus.INVALIDATED)

    @staticmethod
    def validate_all(project_id: int, user_id: int):
        """ Validate all project tasks, except Bad Imagery """
        tasks_to_validate = Task.query.filter(Task.project_id == project_id,
                                              Task.task_status != TaskStatus.BADIMAGERY.value).all()

        for task in tasks_to_validate:
            task.lock_task_for_validating(user_id)
            task.unlock_task(user_id, new_state=TaskStatus.VALIDATED)

    def unlock_task(self, user_id, new_state=None, comment=None):
        """ Unlock task and ensure duration task locked is saved in History """
        if comment:
            # TODO need to clean comment to avoid injection attacks, maybe just raise error if html detected
            self.set_task_history(action=TaskAction.COMMENT, comment=comment, user_id=user_id)

        self.set_task_history(action=TaskAction.STATE_CHANGE, new_state=new_state, user_id=user_id)

        if new_state == TaskStatus.MAPPED and TaskStatus(self.task_status) != TaskStatus.LOCKED_FOR_VALIDATION:
            # Don't set mapped if state being set back to mapped after validation
            self.mapped_by = user_id
        elif new_state == TaskStatus.VALIDATED:
            self.validated_by = user_id

        # Using a slightly evil side effect of Actions and Statuses having the same name here :)
        TaskHistory.update_task_locked_with_duration(self.id, self.project_id, TaskStatus(self.task_status))

        self.task_status = new_state.value
        self.locked_by = None
        self.update()

    def reset_lock(self, user_id, comment=None):
        """ Removes a current lock from a task, resets to last status and updates history with duration of lock """
        if comment:
            # TODO need to clean comment to avoid injection attacks, maybe just raise error if html detected
            # TODO send comment as message to user
            self.set_task_history(action=TaskAction.COMMENT, comment=comment, user_id=user_id)

        # Using a slightly evil side effect of Actions and Statuses having the same name here :)
        TaskHistory.update_task_locked_with_duration(self.id, self.project_id, TaskStatus(self.task_status))

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
            db.session.query(Task.id, Task.x, Task.y, Task.zoom, Task.splittable, Task.task_status,
                             Task.geometry.ST_AsGeoJSON().label('geojson')).filter(Task.project_id == project_id).all()

        tasks_features = []
        for task in project_tasks:
            task_geometry = geojson.loads(task.geojson)
            task_properties = dict(taskId=task.id, taskX=task.x, taskY=task.y, taskZoom=task.zoom,
                                   taskSplittable=task.splittable, taskStatus=TaskStatus(task.task_status).name)
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
        """Gets the nights task id currntly in use on a project"""
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
            if action.action_text is None:
                continue  # Don't return any history without action text

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

        # If there's no dynamic URL (e.g. url containing '{x}/{y}/{z}' pattern) - ALWAYS return instructions unaltered
        if not '{x}/{y}/{z}' in instructions:
            return instructions

        # If there is a dyamic URL only return instructions if task is splittable, since we have the X, Y, Z
        if not self.splittable:
            return 'No extra instructions available for this task'

        instructions = instructions.replace('{x}', str(self.x))
        instructions = instructions.replace('{y}', str(self.y))
        instructions = instructions.replace('{z}', str(self.zoom))

        return instructions
