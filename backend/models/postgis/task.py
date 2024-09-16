import bleach
import datetime
from backend.models.dtos.task_annotation_dto import TaskAnnotationDTO
import geojson
import json
from enum import Enum

# # from flask import current_app
from sqlalchemy import desc, func, distinct
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
from sqlalchemy.orm.session import make_transient
from geoalchemy2 import Geometry
from typing import Any, Dict, List

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

    def set_task_extend_action(task_action: TaskAction) -> str:
        if task_action not in [
            TaskAction.EXTENDED_FOR_MAPPING,
            TaskAction.EXTENDED_FOR_VALIDATION,
        ]:
            raise ValueError("Invalid Action")
        return task_action.name

    def set_task_locked_action(task_action: TaskAction) -> str:
        if task_action not in [
            TaskAction.LOCKED_FOR_MAPPING,
            TaskAction.LOCKED_FOR_VALIDATION,
        ]:
            raise ValueError("Invalid Action")
        return task_action.name

    def set_comment_action(comment: str) -> str:
        clean_comment = bleach.clean(comment)  # Ensure no harmful scripts or tags
        return clean_comment

    def set_state_change_action(new_state: TaskStatus) -> str:
        return new_state.name

    def set_auto_unlock_action(task_action: TaskAction) -> str:
        return task_action.name

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
    async def get(task_id: int, project_id: int, db: Database) -> Optional[dict]:
        """
        Gets the specified task.
        :param db: The async database connection.
        :param task_id: Task ID in scope.
        :param project_id: Project ID in scope.
        :return: A dictionary representing the Task if found, otherwise None.
        """
        query = """
            SELECT
                id, project_id, x, y, zoom, is_square, task_status, locked_by, mapped_by, geometry
            FROM
                tasks
            WHERE
                id = :task_id AND project_id = :project_id
            LIMIT 1
        """
        task = await db.fetch_one(
            query, values={"task_id": task_id, "project_id": project_id}
        )
        return task if task else None

    @staticmethod
    async def exists(task_id: int, project_id: int, db: Database) -> bool:
        """
        Checks if the specified task exists.
        :param db: The async database connection.
        :param task_id: Task ID in scope.
        :param project_id: Project ID in scope.
        :return: True if the task exists, otherwise False.
        """
        query = """
            SELECT 1
            FROM tasks
            WHERE id = :task_id AND project_id = :project_id
            LIMIT 1
        """
        task = await db.fetch_one(
            query, values={"task_id": task_id, "project_id": project_id}
        )
        return task is not None

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

    @staticmethod
    def is_mappable(task: dict) -> bool:
        """Determines if task in scope is in a suitable state for mapping."""
        if TaskStatus(task["task_status"]) not in [
            TaskStatus.READY,
            TaskStatus.INVALIDATED,
        ]:
            return False
        return True

    async def set_task_history(
        task_id: int,
        project_id: int,
        user_id: int,
        action: TaskAction,
        db: Database,
        comment: Optional[str] = None,
        new_state: Optional[TaskStatus] = None,
        mapping_issues: Optional[
            List[Dict[str, Any]]
        ] = None,  # Updated to accept a list of dictionaries
    ):
        """Sets the task history for the action that the user has just performed."""

        # Determine action and action_text based on the task action
        action_text = None
        if action in [TaskAction.LOCKED_FOR_MAPPING, TaskAction.LOCKED_FOR_VALIDATION]:
            action_name = TaskHistory.set_task_locked_action(action)
        elif action in [
            TaskAction.EXTENDED_FOR_MAPPING,
            TaskAction.EXTENDED_FOR_VALIDATION,
        ]:
            action_name = TaskHistory.set_task_extend_action(action)
        elif action == TaskAction.COMMENT:
            action_name = TaskHistory.set_comment_action(comment)
            action_text = comment
        elif action == TaskAction.STATE_CHANGE and new_state:
            action_name = TaskHistory.set_state_change_action(new_state)
            action_text = new_state.name
        elif action in [
            TaskAction.AUTO_UNLOCKED_FOR_MAPPING,
            TaskAction.AUTO_UNLOCKED_FOR_VALIDATION,
        ]:
            action_name = TaskHistory.set_auto_unlock_action(action)
        else:
            raise ValueError("Invalid Action")

        # Insert the task history into the task_history table
        query = """
            INSERT INTO task_history (task_id, user_id, project_id, action, action_text, action_date)
            VALUES (:task_id, :user_id, :project_id, :action, :action_text, :action_date)
            RETURNING id
        """
        values = {
            "task_id": task_id,
            "user_id": user_id,
            "project_id": project_id,
            "action": action_name,
            "action_text": action_text,
            "action_date": datetime.datetime.utcnow(),
        }
        task_history_id = await db.execute(query=query, values=values)
        # TODO Verify this.
        # Insert any mapping issues into the task_mapping_issues table, building the query dynamically
        if mapping_issues:
            for issue in mapping_issues:
                fields = {"task_history_id": task_history_id}
                placeholders = [":task_history_id"]

                if "issue" in issue:
                    fields["issue"] = issue["issue"]
                    placeholders.append(":issue")

                if "mapping_issue_category_id" in issue:
                    fields["mapping_issue_category_id"] = issue[
                        "mapping_issue_category_id"
                    ]
                    placeholders.append(":mapping_issue_category_id")

                if "count" in issue:
                    fields["count"] = issue["count"]
                    placeholders.append(":count")

                columns = ", ".join(fields.keys())
                values_placeholders = ", ".join(placeholders)

                mapping_issue_query = f"""
                    INSERT INTO task_mapping_issues ({columns})
                    VALUES ({values_placeholders})
                """

                await db.execute(query=mapping_issue_query, values=fields)

        return {
            "task_history_id": task_history_id,
            "action": action_name,
            "action_text": action_text,
        }

    async def lock_task_for_mapping(
        task_id: int, project_id: int, user_id: int, db: Database
    ):
        """Locks a task for mapping by a user."""
        await Task.set_task_history(
            task_id, project_id, user_id, TaskAction.LOCKED_FOR_MAPPING, db
        )
        query = """
            UPDATE tasks
            SET task_status = :task_status, locked_by = :user_id
            WHERE id = :task_id
        """
        values = {
            "task_status": TaskStatus.LOCKED_FOR_MAPPING.value,
            "user_id": user_id,
            "task_id": task_id,
        }
        await db.execute(query=query, values=values)

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

    @staticmethod
    async def as_dto(
        task_id: int, project_id: int, db: Database, last_updated: str
    ) -> TaskDTO:
        """Fetch basic TaskDTO details without history or instructions"""
        query = """
        SELECT
            t.id AS task_id,
            t.project_id,
            t.task_status,
            u.username AS lock_holder
        FROM
            tasks t
        LEFT JOIN
            users u ON t.locked_by = u.id
        WHERE
            t.id = :task_id AND t.project_id = :project_id;
        """

        task = await db.fetch_one(
            query=query, values={"task_id": task_id, "project_id": project_id}
        )
        auto_unlock_seconds = await Task.auto_unlock_delta()
        task_dto = TaskDTO(
            task_id=task["task_id"],
            project_id=task["project_id"],
            task_status=TaskStatus(task["task_status"]).name,
            lock_holder=task["lock_holder"],
            last_updated=last_updated,
            auto_unlock_seconds=auto_unlock_seconds.total_seconds(),
            comments_number=None,  # Placeholder, can be populated as needed
        )
        return task_dto

    @staticmethod
    async def get_task_history(
        task_id: int, project_id: int, db: Database
    ) -> List[TaskHistoryDTO]:
        """Get the task history"""
        query = """
            SELECT id, action, action_text, action_date, user_id
            FROM task_history
            WHERE task_id = :task_id AND project_id = :project_id
            ORDER BY action_date DESC
        """
        task_history_records = await db.fetch_all(
            query, values={"task_id": task_id, "project_id": project_id}
        )

        task_history = []
        for record in task_history_records:
            history = TaskHistoryDTO()
            history.history_id = record.id
            history.action = record.action
            history.action_text = record.action_text
            history.action_date = record.action_date
            history.action_by = (
                record.user_id
            )  # Simplified to user_id, username lookup can be done separately
            history.picture_url = (
                None  # Add a separate query to fetch user picture if needed
            )
            task_history.append(history)

        return task_history

    @staticmethod
    async def as_dto_with_instructions(
        task_id: int, project_id: int, db: Database, preferred_locale: str = "en"
    ) -> TaskDTO:
        """Get DTO with any task instructions"""

        # Query to get task history and associated data
        query = """
            SELECT
                th.id AS history_id,
                th.action,
                th.action_text,
                th.action_date,
                u.username AS action_by,
                u.picture_url,
                tmi.issue,
                tmi.count,
                mic.id AS issue_category_id,
                p.default_locale
            FROM
                task_history th
            LEFT JOIN
                users u ON th.user_id = u.id
            LEFT JOIN
                task_mapping_issues tmi ON th.id = tmi.task_history_id
            LEFT JOIN
                mapping_issue_categories mic ON tmi.mapping_issue_category_id = mic.id
            LEFT JOIN
                projects p ON th.project_id = p.id
            WHERE
                th.task_id = :task_id AND th.project_id = :project_id
            ORDER BY
                th.action_date DESC;
        """
        rows = await db.fetch_all(
            query=query, values={"task_id": task_id, "project_id": project_id}
        )
        task_history = []

        for row in rows:
            history = TaskHistoryDTO(
                history_id=row["history_id"],
                action=row["action"],
                action_text=row["action_text"],
                action_date=row["action_date"],
                action_by=row["action_by"],
                picture_url=row["picture_url"],
            )

            if row["issue"]:
                issues = []
                issue_dto = TaskMappingIssueDTO(
                    category_id=row["issue_category_id"],
                    count=row["count"],
                    name=row["issue"],
                )
                issues.append(issue_dto)
                history.issues = issues

            task_history.append(history)

        last_updated = task_history[0].action_date if task_history else None
        task_dto = await Task.as_dto(task_id, project_id, db, last_updated)
        per_task_instructions = await Task.get_per_task_instructions(
            task_id, project_id, preferred_locale, db
        )
        if not per_task_instructions:
            default_locale = rows[0]["default_locale"]
            per_task_instructions = await Task.get_per_task_instructions(
                task_id, project_id, default_locale, db
            )

        task_dto.per_task_instructions = per_task_instructions
        task_dto.task_annotations = await Task.get_task_annotations(task_id, db)
        task_dto.task_history = task_history
        return task_dto

    def get_per_task_annotations(self):
        result = [ta.get_dto() for ta in self.task_annotations]
        return result

    @staticmethod
    async def get_per_task_instructions(
        task_id: int, project_id: int, search_locale: str, db: Database
    ) -> str:
        """Gets any per task instructions attached to the project"""
        query = """
        SELECT
            pi.per_task_instructions
        FROM
            project_info pi
        WHERE
            pi.project_id = :project_id AND pi.locale = :search_locale;
        """

        result = await db.fetch_one(
            query=query,
            values={"project_id": project_id, "search_locale": search_locale},
        )
        return (
            await Task.format_per_task_instructions(
                result["per_task_instructions"], task_id, project_id, db
            )
            if result
            else ""
        )

    @staticmethod
    async def format_per_task_instructions(
        instructions: str, task_id: int, project_id: int, db: Database
    ) -> str:
        """Format instructions by looking for X, Y, Z tokens and replacing them with the task values"""
        if not instructions:
            return ""  # No instructions, return empty string
        # Query to get the necessary task details (x, y, zoom, etc.)
        query = """
        SELECT
            t.x,
            t.y,
            t.zoom,
            t.extra_properties
        FROM
            tasks t
        WHERE
            t.id = :task_id AND t.project_id = :project_id;
        """

        task = await db.fetch_one(
            query=query, values={"task_id": task_id, "project_id": project_id}
        )
        properties = {}

        if task["x"]:
            properties["x"] = str(task["x"])
        if task["y"]:
            properties["y"] = str(task["y"])
        if task["zoom"]:
            properties["z"] = str(task["zoom"])
        if task["extra_properties"]:
            properties.update(json.loads(task["extra_properties"]))

        try:
            instructions = instructions.format(**properties)
        except (KeyError, ValueError, IndexError):
            # Handle formatting errors
            pass
        return instructions

    @staticmethod
    async def get_task_annotations(
        task_id: int, db: Database
    ) -> List[TaskAnnotationDTO]:
        """Fetch annotations related to the task"""
        query = """
        SELECT
            ta.task_id,
            ta.annotation_type,
            ta.annotation_source,
            ta.annotation_markdown,
            ta.properties
        FROM
            task_annotations ta
        WHERE
            ta.task_id = :task_id;
        """
        rows = await db.fetch_all(query=query, values={"task_id": task_id})

        # Map the query results to TaskAnnotationDTO
        return [
            TaskAnnotationDTO(
                task_id=row["task_id"],
                annotation_type=row["annotation_type"],
                annotation_source=row["annotation_source"],
                annotation_markdown=row["annotation_markdown"],
                properties=row["properties"],
            )
            for row in rows
        ]

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

    async def get_locked_tasks_for_user(
        user_id: int, db: Database
    ) -> LockedTasksForUser:
        """Gets tasks on projects locked by the specified user id"""

        query = """
        SELECT id, project_id, task_status
        FROM tasks
        WHERE locked_by = :user_id
        """

        rows = await db.fetch_all(query=query, values={"user_id": user_id})
        tasks_dto = LockedTasksForUser()

        if rows:
            tasks_dto.locked_tasks = [row["id"] for row in rows]
            tasks_dto.project = rows[0][
                "project_id"
            ]  # Assuming all tasks belong to the same project
            tasks_dto.task_status = TaskStatus(rows[0]["task_status"]).name

        return tasks_dto

    async def get_locked_tasks_details_for_user(user_id: int, db: Database) -> list:
        """Gets tasks on project owned by specified user id"""
        query = select(Task).filter_by(locked_by=user_id)
        tasks = await db.fetch_all(query)
        locked_tasks = [task for task in tasks]

        return locked_tasks
