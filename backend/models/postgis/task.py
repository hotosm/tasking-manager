import bleach
import datetime
import geojson
import json
from enum import Enum

# # from flask import current_app
from sqlalchemy import desc, func, distinct
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
from sqlalchemy.orm.session import make_transient
from geoalchemy2 import Geometry
from typing import List

from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    DateTime,
    String,
    ForeignKey,
    Boolean,
    Index,
    ForeignKeyConstraint,
    Unicode,
)
from sqlalchemy.orm import relationship
from backend.exceptions import NotFound
from backend.models.dtos.mapping_dto import TaskDTO, TaskHistoryDTO
from backend.models.dtos.validator_dto import MappedTasksByUser, MappedTasks
from backend.models.dtos.project_dto import (
    ProjectComment,
    ProjectCommentsDTO,
    LockedTasksForUser,
)
from backend.models.dtos.mapping_issues_dto import TaskMappingIssueDTO
from backend.models.postgis.statuses import TaskStatus, MappingLevel
from backend.models.postgis.user import User
from backend.models.postgis.utils import (
    InvalidData,
    InvalidGeoJson,
    ST_GeomFromGeoJSON,
    ST_SetSRID,
    timestamp,
    parse_duration,
)
from backend.models.postgis.task_annotation import TaskAnnotation
from backend.db import Base, get_session

session = get_session()
from backend.config import settings
from sqlalchemy import select
from typing import Optional
from databases import Database


class TaskAction(Enum):
    """Describes the possible actions that can happen to to a task, that we'll record history for"""

    LOCKED_FOR_MAPPING = 1
    LOCKED_FOR_VALIDATION = 2
    STATE_CHANGE = 3
    COMMENT = 4
    AUTO_UNLOCKED_FOR_MAPPING = 5
    AUTO_UNLOCKED_FOR_VALIDATION = 6
    EXTENDED_FOR_MAPPING = 7
    EXTENDED_FOR_VALIDATION = 8


class TaskInvalidationHistory(Base):
    """Describes the most recent history of task invalidation and subsequent validation"""

    __tablename__ = "task_invalidation_history"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_id = Column(Integer, nullable=False)
    is_closed = Column(Boolean, default=False)
    mapper_id = Column(BigInteger, ForeignKey("users.id", name="fk_mappers"))
    mapped_date = Column(DateTime)
    invalidator_id = Column(BigInteger, ForeignKey("users.id", name="fk_invalidators"))
    invalidated_date = Column(DateTime)
    invalidation_history_id = Column(
        Integer, ForeignKey("task_history.id", name="fk_invalidation_history")
    )
    validator_id = Column(BigInteger, ForeignKey("users.id", name="fk_validators"))
    validated_date = Column(DateTime)
    updated_date = Column(DateTime, default=timestamp)

    __table_args__ = (
        ForeignKeyConstraint(
            [task_id, project_id], ["tasks.id", "tasks.project_id"], name="fk_tasks"
        ),
        Index("idx_task_validation_history_composite", "task_id", "project_id"),
        Index(
            "idx_task_validation_validator_status_composite",
            "invalidator_id",
            "is_closed",
        ),
        Index("idx_task_validation_mapper_status_composite", "mapper_id", "is_closed"),
        {},
    )

    def __init__(self, project_id, task_id):
        self.project_id = project_id
        self.task_id = task_id
        self.is_closed = False

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    @staticmethod
    def get_open_for_task(project_id, task_id, local_session=None):
        """
        Retrieve the open TaskInvalidationHistory entry for the given project and task.

        This method also handles a suspected concurrency issue by managing cases where multiple entries
        are created when only one should exist. If multiple entries are found, it
        recursively handles and closes duplicate entries to ensure only a single entry
        remains open.

        Args:
            project_id (int): The ID of the project.
            task_id (int): The ID of the task.
            local_session (Session, optional): The SQLAlchemy session to use for the query.
                                               If not provided, a default session is used.

        Returns:
            TaskInvalidationHistory or None: The open TaskInvalidationHistory entry, or
                                             None if no open entry is found.

        Raises:
            None: This method handles the MultipleResultsFound exception internally.
        """
        try:
            if local_session:
                return (
                    local_session.query(TaskInvalidationHistory)
                    .filter_by(task_id=task_id, project_id=project_id, is_closed=False)
                    .one_or_none()
                )
            return TaskInvalidationHistory.query.filter_by(
                task_id=task_id, project_id=project_id, is_closed=False
            ).one_or_none()

        except MultipleResultsFound:
            TaskInvalidationHistory.close_duplicate_invalidation_history_rows(
                project_id, task_id, local_session
            )

            return TaskInvalidationHistory.get_open_for_task(
                project_id, task_id, local_session
            )

    @staticmethod
    def close_duplicate_invalidation_history_rows(
        project_id: int, task_id: int, local_session=None
    ):
        """
        Closes duplicate TaskInvalidationHistory entries except for the latest one for the given project and task.

        Args:
            project_id (int): The ID of the project.
            task_id (int): The ID of the task.
            local_session (Session, optional): The SQLAlchemy session to use for the query.
                                               If not provided, a default session is used.
        """
        if local_session:
            oldest_dupe = (
                local_session.query(TaskInvalidationHistory)
                .filter_by(task_id=task_id, project_id=project_id, is_closed=False)
                .order_by(TaskInvalidationHistory.id.asc())
                .first()
            )
        else:
            oldest_dupe = (
                TaskInvalidationHistory.query.filter_by(
                    task_id=task_id, project_id=project_id, is_closed=False
                )
                .order_by(TaskInvalidationHistory.id.asc())
                .first()
            )

        if oldest_dupe:
            oldest_dupe.is_closed = True
            if local_session:
                local_session.commit()
            else:
                db.session.commit()

    @staticmethod
    def close_all_for_task(project_id, task_id):
        TaskInvalidationHistory.query.filter_by(
            task_id=task_id, project_id=project_id, is_closed=False
        ).update({"is_closed": True})

    @staticmethod
    def record_invalidation(project_id, task_id, invalidator_id, history):
        # Invalidation always kicks off a new entry for a task, so close any existing ones.
        TaskInvalidationHistory.close_all_for_task(project_id, task_id)

        last_mapped = TaskHistory.get_last_mapped_action(project_id, task_id)
        if last_mapped is None:
            return

        entry = TaskInvalidationHistory(project_id, task_id)
        entry.invalidation_history_id = history.id
        entry.mapper_id = last_mapped.user_id
        entry.mapped_date = last_mapped.action_date
        entry.invalidator_id = invalidator_id
        entry.invalidated_date = history.action_date
        entry.updated_date = timestamp()
        session.add(entry)

    @staticmethod
    def record_validation(project_id, task_id, validator_id, history):
        entry = TaskInvalidationHistory.get_open_for_task(project_id, task_id)

        # If no open invalidation to update, then nothing to do
        if entry is None:
            return

        last_mapped = TaskHistory.get_last_mapped_action(project_id, task_id)
        entry.mapper_id = last_mapped.user_id
        entry.mapped_date = last_mapped.action_date
        entry.validator_id = validator_id
        entry.validated_date = history.action_date
        entry.is_closed = True
        entry.updated_date = timestamp()


class TaskMappingIssue(Base):
    """Describes an issue (along with an occurrence count) with a
    task mapping that contributed to invalidation of the task"""

    __tablename__ = "task_mapping_issues"
    id = Column(Integer, primary_key=True)
    task_history_id = Column(
        Integer, ForeignKey("task_history.id"), nullable=False, index=True
    )
    issue = Column(String, nullable=False)
    mapping_issue_category_id = Column(
        Integer,
        ForeignKey("mapping_issue_categories.id", name="fk_issue_category"),
        nullable=False,
    )
    count = Column(Integer, nullable=False)

    def __init__(self, issue, count, mapping_issue_category_id, task_history_id=None):
        self.task_history_id = task_history_id
        self.issue = issue
        self.count = count
        self.mapping_issue_category_id = mapping_issue_category_id

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    def as_dto(self):
        issue_dto = TaskMappingIssueDTO()
        issue_dto.category_id = self.mapping_issue_category_id
        issue_dto.name = self.issue
        issue_dto.count = self.count
        return issue_dto

    def __repr__(self):
        return "{0}: {1}".format(self.issue, self.count)


class TaskHistory(Base):
    """Describes the history associated with a task"""

    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    task_id = Column(Integer, nullable=False)
    action = Column(String, nullable=False)
    action_text = Column(String)
    action_date = Column(DateTime, nullable=False, default=timestamp)
    user_id = Column(
        BigInteger,
        ForeignKey("users.id", name="fk_users"),
        index=True,
        nullable=False,
    )
    invalidation_history = relationship(
        TaskInvalidationHistory, lazy="dynamic", cascade="all"
    )

    actioned_by = relationship(User)
    task_mapping_issues = relationship(TaskMappingIssue, cascade="all")

    __table_args__ = (
        ForeignKeyConstraint(
            [task_id, project_id], ["tasks.id", "tasks.project_id"], name="fk_tasks"
        ),
        Index("idx_task_history_composite", "task_id", "project_id"),
        Index("idx_task_history_project_id_user_id", "user_id", "project_id"),
        {},
    )

    def __init__(self, task_id, project_id, user_id):
        self.task_id = task_id
        self.project_id = project_id
        self.user_id = user_id

    def set_task_extend_action(self, task_action: TaskAction):
        if task_action not in [
            TaskAction.EXTENDED_FOR_MAPPING,
            TaskAction.EXTENDED_FOR_VALIDATION,
        ]:
            raise ValueError("Invalid Action")

        self.action = task_action.name

    def set_task_locked_action(self, task_action: TaskAction):
        if task_action not in [
            TaskAction.LOCKED_FOR_MAPPING,
            TaskAction.LOCKED_FOR_VALIDATION,
        ]:
            raise ValueError("Invalid Action")

        self.action = task_action.name

    def set_comment_action(self, comment):
        self.action = TaskAction.COMMENT.name
        clean_comment = bleach.clean(
            comment
        )  # Bleach input to ensure no nefarious script tags etc
        self.action_text = clean_comment

    def set_state_change_action(self, new_state):
        self.action = TaskAction.STATE_CHANGE.name
        self.action_text = new_state.name

    def set_auto_unlock_action(self, task_action: TaskAction):
        self.action = task_action.name

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    @staticmethod
    def update_task_locked_with_duration(
        task_id: int, project_id: int, lock_action, user_id: int
    ):
        """
        Calculates the duration a task was locked for and sets it on the history record
        :param task_id: Task in scope
        :param project_id: Project ID in scope
        :param lock_action: The lock action, either Mapping or Validation
        :param user_id: Logged in user updating the task
        :return:
        """
        try:
            last_locked = TaskHistory.query.filter_by(
                task_id=task_id,
                project_id=project_id,
                action=lock_action.name,
                action_text=None,
                user_id=user_id,
            ).one()
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
            TaskHistory.remove_duplicate_task_history_rows(
                task_id, project_id, lock_action, user_id
            )

            # Now duplicate is removed, we recursively call ourself to update the duration on the remaining row
            TaskHistory.update_task_locked_with_duration(
                task_id, project_id, lock_action, user_id
            )
            return

        duration_task_locked = datetime.datetime.utcnow() - last_locked.action_date
        # Cast duration to isoformat for later transmission via api
        last_locked.action_text = (
            (datetime.datetime.min + duration_task_locked).time().isoformat()
        )
        session.commit()

    @staticmethod
    def remove_duplicate_task_history_rows(
        task_id: int, project_id: int, lock_action: TaskStatus, user_id: int
    ):
        """Method used in rare cases where we have duplicate task history records for a given action by a user
        This method will remove the oldest duplicate record, on the basis that the newest record was the
        last action the user was attempting to perform
        """
        dupe = (
            TaskHistory.query.filter(
                TaskHistory.project_id == project_id,
                TaskHistory.task_id == task_id,
                TaskHistory.action == lock_action.name,
                TaskHistory.user_id == user_id,
            )
            .order_by(TaskHistory.id.asc())
            .first()
        )

        dupe.delete()

    @staticmethod
    async def update_expired_and_locked_actions(
        project_id: int, task_id: int, expiry_date: datetime, action_text: str, session
    ):
        """
        Sets auto unlock state to all not finished actions, that are older then the expiry date.
        Action is considered as a not finished, when it is in locked state and doesn't have action text
        :param project_id: Project ID in scope
        :param task_id: Task in scope
        :param expiry_date: Action created before this date is treated as expired
        :param action_text: Text which will be set for all changed actions
        :return:
        """
        result = await session.execute(
            select(TaskHistory).filter(
                TaskHistory.task_id == task_id,
                TaskHistory.project_id == project_id,
                TaskHistory.action_text.is_(None),
                TaskHistory.action.in_(
                    [
                        TaskAction.LOCKED_FOR_VALIDATION.name,
                        TaskAction.LOCKED_FOR_MAPPING.name,
                        TaskAction.EXTENDED_FOR_MAPPING.name,
                        TaskAction.EXTENDED_FOR_VALIDATION.name,
                    ]
                ),
                TaskHistory.action_date <= expiry_date,
            )
        )
        all_expired = result.scalars().all()
        for task_history in all_expired:
            unlock_action = (
                TaskAction.AUTO_UNLOCKED_FOR_MAPPING
                if task_history.action in ["LOCKED_FOR_MAPPING", "EXTENDED_FOR_MAPPING"]
                else TaskAction.AUTO_UNLOCKED_FOR_VALIDATION
            )

            task_history.set_auto_unlock_action(unlock_action)
            task_history.action_text = action_text

        await session.commit()

    @staticmethod
    def get_all_comments(project_id: int) -> ProjectCommentsDTO:
        """Gets all comments for the supplied project_id"""

        comments = (
            session.query(
                TaskHistory.task_id,
                TaskHistory.action_date,
                TaskHistory.action_text,
                User.username,
            )
            .join(User)
            .filter(
                TaskHistory.project_id == project_id,
                TaskHistory.action == TaskAction.COMMENT.name,
            )
            .all()
        )

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
        """Get the status the task was set to the last time the task had a STATUS_CHANGE"""
        result = (
            session.query(TaskHistory.action_text)
            .filter(
                TaskHistory.project_id == project_id,
                TaskHistory.task_id == task_id,
                TaskHistory.action == TaskAction.STATE_CHANGE.name,
            )
            .order_by(TaskHistory.action_date.desc())
            .all()
        )

        if not result:
            return TaskStatus.READY  # No result so default to ready status

        if len(result) == 1 and for_undo:
            # We're looking for the previous status, however, there isn't any so we'll return Ready
            return TaskStatus.READY

        if for_undo and result[0][0] in [
            TaskStatus.MAPPED.name,
            TaskStatus.BADIMAGERY.name,
        ]:
            # We need to return a READY when last status of the task is badimagery or mapped.
            return TaskStatus.READY

        if for_undo:
            # Return the second last status which was status the task was previously set to
            return TaskStatus[result[1][0]]
        else:
            return TaskStatus[result[0][0]]

    @staticmethod
    def get_last_action(project_id: int, task_id: int):
        """Gets the most recent task history record for the task"""
        return (
            TaskHistory.query.filter(
                TaskHistory.project_id == project_id, TaskHistory.task_id == task_id
            )
            .order_by(TaskHistory.action_date.desc())
            .first()
        )

    # @staticmethod
    # def get_last_action_of_type(
    #     project_id: int, task_id: int, allowed_task_actions: list
    # ):
    #     """Gets the most recent task history record having provided TaskAction"""
    #     return (
    #         TaskHistory.query.filter(
    #             TaskHistory.project_id == project_id,
    #             TaskHistory.task_id == task_id,
    #             TaskHistory.action.in_(allowed_task_actions),
    #         )
    #         .order_by(TaskHistory.action_date.desc())
    #         .first()
    #     )

    @staticmethod
    async def get_last_action_of_type(
        project_id: int, task_id: int, allowed_task_actions: list, session
    ):
        """
        Gets the most recent task history record having provided TaskAction
        :param project_id: Project ID in scope
        :param task_id: Task ID in scope
        :param allowed_task_actions: List of allowed TaskAction
        :param session: SQLAlchemy async session
        :return: Most recent TaskHistory record of the specified type
        """
        query = (
            select(TaskHistory)
            .filter(
                TaskHistory.project_id == project_id,
                TaskHistory.task_id == task_id,
                TaskHistory.action.in_(allowed_task_actions),
            )
            .order_by(TaskHistory.action_date.desc())
            .limit(1)
        )
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    def get_last_locked_action(project_id: int, task_id: int):
        """Gets the most recent task history record with locked action for the task"""
        return TaskHistory.get_last_action_of_type(
            project_id,
            task_id,
            [
                TaskAction.LOCKED_FOR_MAPPING.name,
                TaskAction.LOCKED_FOR_VALIDATION.name,
            ],
        )

    @staticmethod
    async def get_last_locked_or_auto_unlocked_action(
        project_id: int, task_id: int, session
    ):
        """Gets the most recent task history record with locked or auto unlocked action for the task"""

        result = await TaskHistory.get_last_action_of_type(
            project_id,
            task_id,
            [
                TaskAction.LOCKED_FOR_MAPPING.name,
                TaskAction.LOCKED_FOR_VALIDATION.name,
                TaskAction.AUTO_UNLOCKED_FOR_MAPPING.name,
                TaskAction.AUTO_UNLOCKED_FOR_VALIDATION.name,
            ],
            session,
        )
        return result

    def get_last_mapped_action(project_id: int, task_id: int):
        """Gets the most recent mapped action, if any, in the task history"""
        return (
            session.query(TaskHistory)
            .filter(
                TaskHistory.project_id == project_id,
                TaskHistory.task_id == task_id,
                TaskHistory.action == TaskAction.STATE_CHANGE.name,
                TaskHistory.action_text.in_(
                    [TaskStatus.BADIMAGERY.name, TaskStatus.MAPPED.name]
                ),
            )
            .order_by(TaskHistory.action_date.desc())
            .first()
        )


class Task(Base):
    """Describes an individual mapping Task"""

    __tablename__ = "tasks"

    # Table has composite PK on (id and project_id)
    id = Column(Integer, primary_key=True)
    project_id = Column(
        Integer, ForeignKey("projects.id"), index=True, primary_key=True
    )
    x = Column(Integer)
    y = Column(Integer)
    zoom = Column(Integer)
    extra_properties = Column(Unicode)
    # Tasks need to be split differently if created from an arbitrary grid or were clipped to the edge of the AOI
    is_square = Column(Boolean, default=True)
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326))
    task_status = Column(Integer, default=TaskStatus.READY.value)
    locked_by = Column(
        BigInteger, ForeignKey("users.id", name="fk_users_locked"), index=True
    )
    mapped_by = Column(
        BigInteger, ForeignKey("users.id", name="fk_users_mapper"), index=True
    )
    validated_by = Column(
        BigInteger, ForeignKey("users.id", name="fk_users_validator"), index=True
    )

    # Mapped objects
    task_history = relationship(
        TaskHistory, cascade="all", order_by=desc(TaskHistory.action_date)
    )
    task_annotations = relationship(TaskAnnotation, cascade="all")
    lock_holder = relationship(User, foreign_keys=[locked_by])
    mapper = relationship(User, foreign_keys=[mapped_by])

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def update(self):
        """Updates the DB with the current state of the Task"""
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    @classmethod
    def from_geojson_feature(cls, task_id, task_feature):
        """
        Constructs and validates a task from a GeoJson feature object
        :param task_id: Unique ID for the task
        :param task_feature: A geojson feature object
        :raises InvalidGeoJson, InvalidData
        """
        if type(task_feature) is not geojson.Feature:
            raise InvalidGeoJson("MustBeFeature- Invalid GeoJson should be a feature")

        task_geometry = task_feature.geometry

        if type(task_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson("MustBeMultiPloygon- Geometry must be a MultiPolygon")

        if not task_geometry.is_valid:
            raise InvalidGeoJson(
                "InvalidMultiPolygon - " + ", ".join(task_geometry.errors())
            )

        task = cls()
        try:
            task.x = task_feature.properties["x"]
            task.y = task_feature.properties["y"]
            task.zoom = task_feature.properties["zoom"]
            task.is_square = task_feature.properties["isSquare"]
        except KeyError as e:
            raise InvalidData(
                f"PropertyNotFound: Expected property not found: {str(e)}"
            )

        if "extra_properties" in task_feature.properties:
            task.extra_properties = json.dumps(
                task_feature.properties["extra_properties"]
            )

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

        return (
            session.query(Task)
            .filter_by(id=task_id, project_id=project_id)
            .one_or_none()
        )

    @staticmethod
    def get_tasks(project_id: int, task_ids: List[int]):
        """Get all tasks that match supplied list"""
        return (
            session.query(Task)
            .filter(Task.project_id == project_id, Task.id.in_(task_ids))
            .all()
        )

    @staticmethod
    def get_all_tasks(project_id: int):
        """Get all tasks for a given project"""
        return session.query(Task).filter(Task.project_id == project_id).all()

    @staticmethod
    def get_tasks_by_status(project_id: int, status: str):
        "Returns all tasks filtered by status in a project"
        return (
            session.query(Task)
            .filter(
                Task.project_id == project_id,
                Task.task_status == TaskStatus[status].value,
            )
            .all()
        )

    # @staticmethod
    # def auto_unlock_delta():
    #     return parse_duration(settings.TASK_AUTOUNLOCK_AFTER)

    # @staticmethod
    # async def auto_unlock_tasks(project_id: int, session):
    #     """Unlock all tasks locked for longer than the auto-unlock delta"""
    #     expiry_delta = Task.auto_unlock_delta()
    #     lock_duration = (datetime.datetime.min + expiry_delta).time().isoformat()
    #     expiry_date = datetime.datetime.utcnow() - expiry_delta

    #     old_tasks = (
    #         session.query(Task.id)
    #         .filter(Task.id == TaskHistory.task_id)
    #         .filter(Task.project_id == TaskHistory.project_id)
    #         .filter(Task.task_status.in_([1, 3]))
    #         .filter(
    #             TaskHistory.action.in_(
    #                 [
    #                     "EXTENDED_FOR_MAPPING",
    #                     "EXTENDED_FOR_VALIDATION",
    #                     "LOCKED_FOR_VALIDATION",
    #                     "LOCKED_FOR_MAPPING",
    #                 ]
    #             )
    #         )
    #         .filter(TaskHistory.action_text.is_(None))
    #         .filter(Task.project_id == project_id)
    #         .filter(TaskHistory.action_date <= str(expiry_date))
    #     )

    #     if old_tasks.count() == 0:
    #         # no tasks older than the delta found, return without further processing
    #         return

    #     for old_task in old_tasks:
    #         task = Task.get(old_task[0], project_id)
    #         task.auto_unlock_expired_tasks(expiry_date, lock_duration)

    @staticmethod
    async def auto_unlock_delta():
        return parse_duration(settings.TASK_AUTOUNLOCK_AFTER)

    @staticmethod
    async def auto_unlock_tasks(project_id: int, session):
        """Unlock all tasks locked for longer than the auto-unlock delta"""
        expiry_delta = await Task.auto_unlock_delta()
        lock_duration = (datetime.datetime.min + expiry_delta).time().isoformat()

        expiry_date = datetime.datetime.utcnow() - expiry_delta

        old_tasks = await session.execute(
            select(Task.id)
            .join(
                TaskHistory,
                (Task.id == TaskHistory.task_id)
                & (Task.project_id == TaskHistory.project_id),
            )
            .filter(Task.task_status.in_([1, 3]))
            .filter(
                TaskHistory.action.in_(
                    [
                        "EXTENDED_FOR_MAPPING",
                        "EXTENDED_FOR_VALIDATION",
                        "LOCKED_FOR_VALIDATION",
                        "LOCKED_FOR_MAPPING",
                    ]
                )
            )
            .filter(TaskHistory.action_text.is_(None))
            .filter(Task.project_id == project_id)
            .filter(TaskHistory.action_date <= expiry_date)
        )
        old_tasks = old_tasks.scalars().all()
        if not old_tasks:
            # no tasks older than the delta found, return without further processing
            return

        for old_task_id in old_tasks:
            task = await session.get(Task, (old_task_id, project_id))
            if task:
                await task.auto_unlock_expired_tasks(
                    expiry_date, lock_duration, session
                )

    async def auto_unlock_expired_tasks(self, expiry_date, lock_duration, session):
        """Unlock all tasks locked before expiry date. Clears task lock if needed"""
        await TaskHistory.update_expired_and_locked_actions(
            self.project_id, self.id, expiry_date, lock_duration, session
        )
        last_action = await TaskHistory.get_last_locked_or_auto_unlocked_action(
            self.project_id, self.id, session
        )
        if last_action.action in [
            "AUTO_UNLOCKED_FOR_MAPPING",
            "AUTO_UNLOCKED_FOR_VALIDATION",
        ]:
            self.clear_lock()

    def is_mappable(self):
        """Determines if task in scope is in suitable state for mapping"""
        if TaskStatus(self.task_status) not in [
            TaskStatus.READY,
            TaskStatus.INVALIDATED,
        ]:
            return False
        return True

    def set_task_history(
        self, action, user_id, comment=None, new_state=None, mapping_issues=None
    ):
        """
        Sets the task history for the action that the user has just performed
        :param task: Task in scope
        :param user_id: ID of user performing the action
        :param action: Action the user has performed
        :param comment: Comment user has added
        :param new_state: New state of the task
        :param mapping_issues: Identified issues leading to invalidation
        """
        history = TaskHistory(self.id, self.project_id, user_id)

        if action in [TaskAction.LOCKED_FOR_MAPPING, TaskAction.LOCKED_FOR_VALIDATION]:
            history.set_task_locked_action(action)
        elif action in [
            TaskAction.EXTENDED_FOR_MAPPING,
            TaskAction.EXTENDED_FOR_VALIDATION,
        ]:
            history.set_task_extend_action(action)
        elif action == TaskAction.COMMENT:
            history.set_comment_action(comment)
        elif action == TaskAction.STATE_CHANGE:
            history.set_state_change_action(new_state)
        elif action in [
            TaskAction.AUTO_UNLOCKED_FOR_MAPPING,
            TaskAction.AUTO_UNLOCKED_FOR_VALIDATION,
        ]:
            history.set_auto_unlock_action(action)

        if mapping_issues is not None:
            history.task_mapping_issues = mapping_issues

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
        expiry_delta = Task.auto_unlock_delta()
        lock_duration = (datetime.datetime.min + expiry_delta).time().isoformat()
        if TaskStatus(self.task_status) in [
            TaskStatus.LOCKED_FOR_MAPPING,
            TaskStatus.LOCKED_FOR_VALIDATION,
        ]:
            self.record_auto_unlock(lock_duration)

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
        next_action = (
            TaskAction.AUTO_UNLOCKED_FOR_MAPPING
            if last_action.action == "LOCKED_FOR_MAPPING"
            else TaskAction.AUTO_UNLOCKED_FOR_VALIDATION
        )

        self.clear_task_lock()

        # Add AUTO_UNLOCKED action in the task history
        auto_unlocked = self.set_task_history(action=next_action, user_id=locked_user)
        auto_unlocked.action_text = lock_duration
        self.update()

    def unlock_task(
        self, user_id, new_state=None, comment=None, undo=False, issues=None
    ):
        """Unlock task and ensure duration task locked is saved in History"""
        if comment:
            self.set_task_history(
                action=TaskAction.COMMENT,
                comment=comment,
                user_id=user_id,
                mapping_issues=issues,
            )

        history = self.set_task_history(
            action=TaskAction.STATE_CHANGE,
            new_state=new_state,
            user_id=user_id,
            mapping_issues=issues,
        )
        # If undo, clear the mapped_by and validated_by fields
        if undo:
            if new_state == TaskStatus.MAPPED:
                self.validated_by = None
            elif new_state == TaskStatus.READY:
                self.mapped_by = None
        elif (
            new_state in [TaskStatus.MAPPED, TaskStatus.BADIMAGERY]
            and TaskStatus(self.task_status) != TaskStatus.LOCKED_FOR_VALIDATION
        ):
            # Don't set mapped if state being set back to mapped after validation
            self.mapped_by = user_id
        elif new_state == TaskStatus.VALIDATED:
            TaskInvalidationHistory.record_validation(
                self.project_id, self.id, user_id, history
            )
            self.validated_by = user_id
        elif new_state == TaskStatus.INVALIDATED:
            TaskInvalidationHistory.record_invalidation(
                self.project_id, self.id, user_id, history
            )
            self.mapped_by = None
            self.validated_by = None

        if not undo:
            # Using a slightly evil side effect of Actions and Statuses having the same name here :)
            TaskHistory.update_task_locked_with_duration(
                self.id, self.project_id, TaskStatus(self.task_status), user_id
            )

        self.task_status = new_state.value
        self.locked_by = None
        self.update()

    def reset_lock(self, user_id, comment=None):
        """Removes a current lock from a task, resets to last status and
        updates history with duration of lock"""
        if comment:
            self.set_task_history(
                action=TaskAction.COMMENT, comment=comment, user_id=user_id
            )

        # Using a slightly evil side effect of Actions and Statuses having the same name here :)
        TaskHistory.update_task_locked_with_duration(
            self.id, self.project_id, TaskStatus(self.task_status), user_id
        )
        self.clear_lock()

    def clear_lock(self):
        """Resets to last status and removes current lock from a task"""
        self.task_status = TaskHistory.get_last_status(self.project_id, self.id).value
        self.locked_by = None
        self.update()

    # @staticmethod
    # def get_tasks_as_geojson_feature_collection(
    #     project_id,
    #     task_ids_str: str = None,
    #     order_by: str = None,
    #     order_by_type: str = "ASC",
    #     status: int = None,
    # ):
    #     """
    #     Creates a geoJson.FeatureCollection object for tasks related to the supplied project ID
    #     :param project_id: Owning project ID
    #     :order_by: sorting option: available values update_date and building_area_diff
    #     :status: task status id to filter by
    #     :return: geojson.FeatureCollection
    #     """
    #     # subquery = (
    #     #     session.query(func.max(TaskHistory.action_date))
    #     #     .filter(
    #     #         Task.id == TaskHistory.task_id,
    #     #         Task.project_id == TaskHistory.project_id,
    #     #     )
    #     #     .correlate(Task)
    #     #     .group_by(Task.id)
    #     #     .label("update_date")
    #     # )
    #     query = session.query(
    #         Task.id,
    #         Task.x,
    #         Task.y,
    #         Task.zoom,
    #         Task.is_square,
    #         Task.task_status,
    #         Task.geometry.ST_AsGeoJSON().label("geojson"),
    #         Task.locked_by,
    #         Task.mapped_by,
    #         # subquery,
    #     )

    #     filters = [Task.project_id == project_id]

    #     if task_ids_str:
    #         task_ids = list(map(int, task_ids_str.split(",")))
    #         tasks = Task.get_tasks(project_id, task_ids)
    #         if not tasks or len(tasks) == 0:
    #             raise NotFound(
    #                 sub_code="TASKS_NOT_FOUND", tasks=task_ids, project_id=project_id
    #             )
    #         else:
    #             tasks_filters = [task.id for task in tasks]
    #         filters = [Task.project_id == project_id, Task.id.in_(tasks_filters)]
    #     else:
    #         tasks = Task.get_all_tasks(project_id)
    #         if not tasks or len(tasks) == 0:
    #             raise NotFound(sub_code="TASKS_NOT_FOUND", project_id=project_id)

    #     if status:
    #         filters.append(Task.task_status == status)

    #     if order_by == "effort_prediction":
    #         query = query.outerjoin(TaskAnnotation).filter(*filters)
    #         if order_by_type == "DESC":
    #             query = query.order_by(
    #                 desc(
    #                     cast(
    #                         cast(TaskAnnotation.properties["building_area_diff"], Text),
    #                         Float,
    #                     )
    #                 )
    #             )
    #         else:
    #             query = query.order_by(
    #                 cast(
    #                     cast(TaskAnnotation.properties["building_area_diff"], Text),
    #                     Float,
    #                 )
    #             )
    #     # elif order_by == "last_updated":
    #     #     if order_by_type == "DESC":
    #     #         query = query.filter(*filters).order_by(desc("update_date"))
    #     #     else:
    #     #         query = query.filter(*filters).order_by("update_date")
    #     else:
    #         query = query.filter(*filters)

    #     project_tasks = query.all()

    #     tasks_features = []
    #     for task in project_tasks:
    #         task_geometry = geojson.loads(task.geojson)
    #         task_properties = dict(
    #             taskId=task.id,
    #             taskX=task.x,
    #             taskY=task.y,
    #             taskZoom=task.zoom,
    #             taskIsSquare=task.is_square,
    #             taskStatus=TaskStatus(task.task_status).name,
    #             lockedBy=task.locked_by,
    #             mappedBy=task.mapped_by,
    #         )

    #         feature = geojson.Feature(
    #             geometry=task_geometry, properties=task_properties
    #         )
    #         tasks_features.append(feature)

    #     return geojson.FeatureCollection(tasks_features)

    @staticmethod
    async def get_tasks_as_geojson_feature_collection(
        db: Database,
        project_id: int,
        task_ids_str: Optional[str] = None,
        order_by: Optional[str] = None,
        order_by_type: str = "ASC",
        status: Optional[int] = None,
    ) -> geojson.FeatureCollection:
        """
        Creates a geoJson.FeatureCollection object for tasks related to the supplied project ID.
        :param db: The async database connection
        :param project_id: Owning project ID
        :param task_ids_str: Comma-separated task IDs to filter by
        :param order_by: Sorting option: available values are 'effort_prediction'
        :param order_by_type: Sorting order: 'ASC' or 'DESC'
        :param status: Task status ID to filter by
        :return: geojson.FeatureCollection
        """
        # Base query
        query = """
            SELECT
                t.id,
                t.x,
                t.y,
                t.zoom,
                t.is_square,
                t.task_status,
                ST_AsGeoJSON(t.geometry) AS geojson,
                t.locked_by,
                t.mapped_by
            FROM tasks t
            WHERE t.project_id = :project_id
        """

        # Initialize query parameters
        filters = {"project_id": project_id}

        # Add task_id filter
        if task_ids_str:
            task_ids = [int(task_id) for task_id in task_ids_str.split(",")]
            query += " AND t.id IN :task_ids"
            filters["task_ids"] = tuple(task_ids)

        # Add status filter
        if status is not None:
            query += " AND t.task_status = :status"
            filters["status"] = status

        # Add ordering
        if order_by == "effort_prediction":
            if order_by_type == "DESC":
                query += """
                    LEFT JOIN task_annotations ta ON ta.task_id = t.id
                    ORDER BY CAST(ta.properties->>'building_area_diff' AS FLOAT) DESC
                """
            else:
                query += """
                    LEFT JOIN task_annotations ta ON ta.task_id = t.id
                    ORDER BY CAST(ta.properties->>'building_area_diff' AS FLOAT) ASC
                """
        elif order_by:
            if order_by_type == "DESC":
                query += f" ORDER BY {order_by} DESC"
            else:
                query += f" ORDER BY {order_by} ASC"

        # Execute the query
        rows = await db.fetch_all(query, values=filters)

        # Process results into geojson.FeatureCollection
        tasks_features = []
        for row in rows:
            task_geometry = geojson.loads(row["geojson"])
            task_properties = dict(
                taskId=row["id"],
                taskX=row["x"],
                taskY=row["y"],
                taskZoom=row["zoom"],
                taskIsSquare=row["is_square"],
                taskStatus=TaskStatus(row["task_status"]).name,
                lockedBy=row["locked_by"],
                mappedBy=row["mapped_by"],
            )
            feature = geojson.Feature(
                geometry=task_geometry, properties=task_properties
            )
            tasks_features.append(feature)

        return geojson.FeatureCollection(tasks_features)

    @staticmethod
    async def get_tasks_as_geojson_feature_collection_no_geom(
        db: Database, project_id: int
    ) -> geojson.FeatureCollection:
        """
        Creates a geoJson.FeatureCollection object for all tasks related to the supplied project ID without geometry.
        :param db: The async database connection
        :param project_id: Owning project ID
        :return: geojson.FeatureCollection
        """
        # Define the SQL query
        query = """
            SELECT
                t.id,
                t.x,
                t.y,
                t.zoom,
                t.is_square,
                t.task_status
            FROM tasks t
            WHERE t.project_id = :project_id
        """

        # Execute the query
        rows = await db.fetch_all(query, values={"project_id": project_id})

        # Process results into geojson.FeatureCollection
        tasks_features = []
        for row in rows:
            task_properties = dict(
                taskId=row["id"],
                taskX=row["x"],
                taskY=row["y"],
                taskZoom=row["zoom"],
                taskIsSquare=row["is_square"],
                taskStatus=TaskStatus(row["task_status"]).name,
            )
            feature = geojson.Feature(properties=task_properties)
            tasks_features.append(feature)

        return geojson.FeatureCollection(tasks_features)

    @staticmethod
    def get_mapped_tasks_by_user(project_id: int):
        """Gets all mapped tasks for supplied project grouped by user"""
        results = (
            session.query(
                User.username,
                User.mapping_level,
                func.count(distinct(Task.id)),
                func.json_agg(distinct(Task.id)),
                func.max(TaskHistory.action_date),
                User.date_registered,
                User.last_validation_date,
            )
            .filter(Task.project_id == TaskHistory.project_id)
            .filter(Task.id == TaskHistory.task_id)
            .filter(Task.mapped_by == User.id)
            .filter(Task.project_id == project_id)
            .filter(Task.task_status == 2)
            .filter(TaskHistory.action_text == "MAPPED")
            .group_by(
                User.username,
                User.mapping_level,
                User.date_registered,
                User.last_validation_date,
            )
        )

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
        result = (
            session.query(func.max(Task.id))
            .filter(Task.project_id == project_id)
            .group_by(Task.project_id)
        )
        if result.count() == 0:
            raise NotFound(sub_code="TASKS_NOT_FOUND", project_id=project_id)
        for row in result:
            return row[0]

    def as_dto(
        self,
        task_history: List[TaskHistoryDTO] = [],
        last_updated: datetime.datetime = None,
        comments: int = None,
    ):
        """Just converts to a TaskDTO"""
        task_dto = TaskDTO()
        task_dto.task_id = self.id
        task_dto.project_id = self.project_id
        task_dto.task_status = TaskStatus(self.task_status).name
        task_dto.lock_holder = self.lock_holder.username if self.lock_holder else None
        task_dto.task_history = task_history
        task_dto.last_updated = last_updated if last_updated else None
        task_dto.auto_unlock_seconds = Task.auto_unlock_delta().total_seconds()
        task_dto.comments_number = comments if isinstance(comments, int) else None
        return task_dto

    def as_dto_with_instructions(self, preferred_locale: str = "en") -> TaskDTO:
        """Get dto with any task instructions"""
        task_history = []
        for action in self.task_history:
            history = TaskHistoryDTO()
            history.history_id = action.id
            history.action = action.action
            history.action_text = action.action_text
            history.action_date = action.action_date
            history.action_by = (
                action.actioned_by.username if action.actioned_by else None
            )
            history.picture_url = (
                action.actioned_by.picture_url if action.actioned_by else None
            )
            if action.task_mapping_issues:
                history.issues = [
                    issue.as_dto() for issue in action.task_mapping_issues
                ]

            task_history.append(history)

        last_updated = None
        if len(task_history) > 0:
            last_updated = task_history[0].action_date

        task_dto = self.as_dto(task_history, last_updated=last_updated)

        per_task_instructions = self.get_per_task_instructions(preferred_locale)

        # If we don't have instructions in preferred locale try again for default locale
        task_dto.per_task_instructions = (
            per_task_instructions
            if per_task_instructions
            else self.get_per_task_instructions(self.projects.default_locale)
        )

        annotations = self.get_per_task_annotations()
        task_dto.task_annotations = annotations if annotations else []

        return task_dto

    def get_per_task_annotations(self):
        result = [ta.get_dto() for ta in self.task_annotations]
        return result

    def get_per_task_instructions(self, search_locale: str) -> str:
        """Gets any per task instructions attached to the project"""
        project_info = self.projects.project_info.all()

        for info in project_info:
            if info.locale == search_locale:
                return self.format_per_task_instructions(info.per_task_instructions)

    def format_per_task_instructions(self, instructions) -> str:
        """Format instructions by looking for X, Y, Z tokens and replacing them with the task values"""
        if not instructions:
            return ""  # No instructions so return empty string

        properties = {}

        if self.x:
            properties["x"] = str(self.x)
        if self.y:
            properties["y"] = str(self.y)
        if self.zoom:
            properties["z"] = str(self.zoom)
        if self.extra_properties:
            properties.update(json.loads(self.extra_properties))

        try:
            instructions = instructions.format(**properties)
        except (KeyError, ValueError, IndexError):
            # KeyError is raised if a format string contains a key that is not in the dictionary, e.g. {foo}
            # ValueError is raised if a format string contains a single { or }
            # IndexError is raised if a format string contains empty braces, e.g. {}
            pass
        return instructions

    def copy_task_history(self) -> list:
        copies = []
        for entry in self.task_history:
            session.expunge(entry)
            make_transient(entry)
            entry.id = None
            entry.task_id = None
            session.add(entry)
            copies.append(entry)

        return copies

    def get_locked_tasks_for_user(user_id: int):
        """Gets tasks on project owned by specified user id"""
        tasks = session.query(Task).filter_by(locked_by=user_id)
        tasks_dto = LockedTasksForUser()
        for task in tasks:
            tasks_dto.locked_tasks.append(task.id)
            tasks_dto.project = task.project_id
            tasks_dto.task_status = TaskStatus(task.task_status).name

        return tasks_dto

    def get_locked_tasks_details_for_user(user_id: int):
        """Gets tasks on project owned by specified user id"""
        tasks = session.query(Task).filter_by(locked_by=user_id)
        locked_tasks = [task for task in tasks]

        return locked_tasks
