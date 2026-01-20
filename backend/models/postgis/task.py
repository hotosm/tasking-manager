import datetime
import json
from datetime import timezone
from enum import Enum
from typing import Any, Dict, List, Optional

import bleach
import geojson
from databases import Database
from geoalchemy2 import Geometry
from shapely.geometry import shape

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Unicode,
    desc,
    select,
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm.exc import MultipleResultsFound

from backend.config import settings
from backend.db import Base
from backend.exceptions import NotFound
from backend.models.dtos.mapping_dto import TaskDTO, TaskHistoryDTO
from backend.models.dtos.mapping_issues_dto import TaskMappingIssueDTO
from backend.models.dtos.project_dto import (
    LockedTasksForUser,
    ProjectComment,
    ProjectCommentsDTO,
)
from backend.models.dtos.task_annotation_dto import TaskAnnotationDTO
from backend.models.dtos.validator_dto import MappedTasks, MappedTasksByUser
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.task_annotation import TaskAnnotation
from backend.models.postgis.user import User
from backend.models.postgis.utils import (
    InvalidData,
    InvalidGeoJson,
    parse_duration,
    timestamp,
)


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

    @staticmethod
    async def get_open_for_task(project_id: int, task_id: int, db: Database):
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
            # Fetch open entry
            query = """
                SELECT * FROM task_invalidation_history
                WHERE task_id = :task_id
                AND project_id = :project_id
                AND is_closed = FALSE
            """
            entry = await db.fetch_one(
                query=query, values={"task_id": task_id, "project_id": project_id}
            )
            return entry

        except MultipleResultsFound:
            await TaskInvalidationHistory.close_duplicate_invalidation_history_rows(
                project_id, task_id, db
            )
            return await TaskInvalidationHistory.get_open_for_task(
                project_id, task_id, db
            )

    @staticmethod
    async def close_duplicate_invalidation_history_rows(
        project_id: int, task_id: int, db: Database
    ):
        """
        Closes duplicate TaskInvalidationHistory entries except for the latest one for the given project and task.
        """

        # Fetch the oldest duplicate
        query = """
            SELECT id FROM task_invalidation_history
            WHERE task_id = :task_id
            AND project_id = :project_id
            AND is_closed = FALSE
            ORDER BY id ASC
            LIMIT 1
        """
        oldest_dupe = await db.fetch_one(
            query=query, values={"task_id": task_id, "project_id": project_id}
        )

        if oldest_dupe:
            update_query = """
                UPDATE task_invalidation_history
                SET is_closed = TRUE
                WHERE id = :id
            """
            await db.execute(query=update_query, values={"id": oldest_dupe["id"]})

    @staticmethod
    async def close_all_for_task(project_id: int, task_id: int, db: Database):
        """
        Closes all open invalidation history entries for the specified task.
        """
        update_query = """
            UPDATE task_invalidation_history
            SET is_closed = TRUE, updated_date = :updated_date
            WHERE project_id = :project_id AND task_id = :task_id AND is_closed = FALSE
        """
        values = {
            "project_id": project_id,
            "task_id": task_id,
            "updated_date": datetime.datetime.utcnow(),
        }

        await db.execute(query=update_query, values=values)

    @staticmethod
    async def record_invalidation(
        project_id: int, task_id: int, invalidator_id: int, history, db: Database
    ):
        # Invalidation always kicks off a new entry for a task, so close any existing ones.
        await TaskInvalidationHistory.close_all_for_task(project_id, task_id, db)

        last_mapped = await TaskHistory.get_last_mapped_action(project_id, task_id, db)
        if not last_mapped:
            return

        # Insert a new TaskInvalidationHistory entry
        insert_query = """
            INSERT INTO task_invalidation_history (
                project_id, task_id, invalidation_history_id, mapper_id, mapped_date,
                invalidator_id, invalidated_date, updated_date
            )
            VALUES (
                :project_id, :task_id, :invalidation_history_id, :mapper_id, :mapped_date,
                :invalidator_id, :invalidated_date, :updated_date
            )
        """
        values = {
            "project_id": project_id,
            "task_id": task_id,
            "invalidation_history_id": history.id,
            "mapper_id": last_mapped["user_id"],
            "mapped_date": last_mapped["action_date"],
            "invalidator_id": invalidator_id,
            "invalidated_date": history.action_date,
            "updated_date": datetime.datetime.utcnow(),
        }

        await db.execute(query=insert_query, values=values)

    @staticmethod
    async def record_validation(
        project_id: int,
        task_id: int,
        validator_id: int,
        history: TaskHistoryDTO,
        db: Database,
    ):
        entry = await TaskInvalidationHistory.get_open_for_task(project_id, task_id, db)

        # If no open invalidation to update, then nothing to do
        if entry is None:
            return

        last_mapped = await TaskHistory.get_last_mapped_action(project_id, task_id, db)

        # Update entry with validation details
        update_query = """
            UPDATE task_invalidation_history
            SET mapper_id = :mapper_id,
                mapped_date = :mapped_date,
                validator_id = :validator_id,
                validated_date = :validated_date,
                is_closed = TRUE,
                updated_date = :updated_date
            WHERE id = :entry_id
        """
        await db.execute(
            query=update_query,
            values={
                "mapper_id": last_mapped["user_id"],
                "mapped_date": last_mapped["action_date"],
                "validator_id": validator_id,
                "validated_date": history.action_date,
                "updated_date": timestamp(),
                "entry_id": entry["id"],
            },
        )


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
        return task_action.name, None

    def set_task_locked_action(task_action: TaskAction) -> str:
        if task_action not in [
            TaskAction.LOCKED_FOR_MAPPING,
            TaskAction.LOCKED_FOR_VALIDATION,
        ]:
            raise ValueError("Invalid Action")
        return task_action.name, None

    def set_comment_action(comment: str) -> str:
        clean_comment = bleach.clean(comment)  # Ensure no harmful scripts or tags
        return TaskAction.COMMENT.name, clean_comment

    def set_state_change_action(new_state: TaskStatus) -> str:
        return TaskAction.STATE_CHANGE.name, new_state.name

    def set_auto_unlock_action(task_action: TaskAction) -> str:
        return task_action.name, None

    async def update_task_locked_with_duration(
        task_id: int,
        project_id: int,
        lock_action: TaskAction,
        user_id: int,
        db: Database,
    ):
        """
        Calculates the duration a task was locked for and sets it on the history record.
        :param task_id: Task in scope
        :param project_id: Project ID in scope
        :param lock_action: The lock action, either Mapping or Validation
        :param user_id: Logged-in user updating the task.
        """
        try:
            # Fetch the last locked task history entry with raw SQL
            query = """
                SELECT id, action_date
                FROM task_history
                WHERE task_id = :task_id
                AND project_id = :project_id
                AND action = :action
                AND action_text IS NULL
                AND user_id = :user_id
                ORDER BY action_date DESC
                LIMIT 1
            """
            values = {
                "task_id": task_id,
                "project_id": project_id,
                "action": lock_action.name,
                "user_id": user_id,
            }

            last_locked = await db.fetch_one(query=query, values=values)

            if last_locked is None:
                # We suspect there's some kind or race condition that is occasionally deleting history records
                # prior to user unlocking task. Most likely stemming from auto-unlock feature. However, given that
                # we're trying to update a row that doesn't exist, it's better to return without doing anything
                # rather than showing the user an error that they can't fix.
                # No record found, possibly a race condition or auto-unlock scenario.
                return

            # Calculate the duration the task was locked for
            duration_task_locked = (
                datetime.datetime.utcnow() - last_locked["action_date"]
            )

            # Cast duration to ISO format
            action_text = (
                (datetime.datetime.min + duration_task_locked).time().isoformat()
            )

            # Update the task history with the duration
            update_query = """
                UPDATE task_history
                SET action_text = :action_text
                WHERE id = :id
            """
            update_values = {
                "action_text": action_text,
                "id": last_locked["id"],
            }
            await db.execute(query=update_query, values=update_values)

        except MultipleResultsFound:
            # Again race conditions may mean we have multiple rows within the Task History.  Here we attempt to
            # remove the oldest duplicate rows, and update the newest on the basis that this was the last action
            # the user was attempting to make.
            # Handle race conditions by removing duplicates.
            await TaskHistory.remove_duplicate_task_history_rows(
                task_id, project_id, lock_action, user_id, db
            )

            # Recursively call the method to update the remaining row
            await TaskHistory.update_task_locked_with_duration(
                task_id, project_id, lock_action, user_id, db
            )

    async def remove_duplicate_task_history_rows(
        task_id: int,
        project_id: int,
        lock_action: TaskAction,
        user_id: int,
        db: Database,
    ):
        """
        Removes duplicate task history rows for the specified task, project, and action.
        Keeps the most recent entry and deletes the older ones.
        """
        duplicate_query = """
            DELETE FROM task_history
            WHERE id IN (
                SELECT id
                FROM task_history
                WHERE task_id = :task_id
                AND project_id = :project_id
                AND action = :action
                AND user_id = :user_id
                ORDER BY action_date ASC
                OFFSET 1
            )
        """
        values = {
            "task_id": task_id,
            "project_id": project_id,
            "action": lock_action.name,
            "user_id": user_id,
        }

        await db.execute(query=duplicate_query, values=values)

    @staticmethod
    async def update_expired_and_locked_actions(
        task_id: int,
        project_id: int,
        expiry_date: datetime,
        action_text: str,
        db: Database,
    ):
        """Update expired actions with an auto-unlock state."""
        query = """
            UPDATE task_history
            SET action = CASE
                WHEN action IN ('LOCKED_FOR_MAPPING', 'EXTENDED_FOR_MAPPING')
                    THEN 'AUTO_UNLOCKED_FOR_MAPPING'
                WHEN action IN ('LOCKED_FOR_VALIDATION', 'EXTENDED_FOR_VALIDATION')
                    THEN 'AUTO_UNLOCKED_FOR_VALIDATION'
            END,
            action_text = :action_text
            WHERE task_id = :task_id
            AND project_id = :project_id
            AND action_text IS NULL
            AND action IN (
                'LOCKED_FOR_MAPPING', 'LOCKED_FOR_VALIDATION',
                'EXTENDED_FOR_MAPPING', 'EXTENDED_FOR_VALIDATION'
            )
            AND action_date <= :expiry_date
        """
        values = {
            "action_text": action_text,
            "task_id": task_id,
            "project_id": project_id,
            "expiry_date": expiry_date,
        }
        await db.execute(query=query, values=values)

    @staticmethod
    async def get_all_comments(project_id: int, db: Database) -> ProjectCommentsDTO:
        """Gets all comments for the supplied project_id"""

        # Raw SQL query joining task_history and users tables
        query = """
        SELECT
            th.task_id,
            th.action_date,
            th.action_text,
            u.username
        FROM
            task_history th
        JOIN
            users u ON th.user_id = u.id
        WHERE
            th.project_id = :project_id
            AND th.action = :action
        """

        # Execute the query with parameters
        comments = await db.fetch_all(
            query=query,
            values={
                "project_id": project_id,
                "action": "COMMENT",  # Assuming TaskAction.COMMENT.name is "COMMENT"
            },
        )

        # Transform database results into DTOs
        comments_dto = ProjectCommentsDTO()
        for comment in comments:
            dto = ProjectComment(
                comment=comment["action_text"],
                comment_date=comment["action_date"],
                user_name=comment["username"],
                task_id=comment["task_id"],
            )
            comments_dto.comments.append(dto)

        return comments_dto

    @staticmethod
    async def get_last_status(
        project_id: int, task_id: int, db: Database, for_undo: bool = False
    ) -> TaskStatus:
        """Get the status the task was set to the last time the task had a STATUS_CHANGE."""

        query = """
            SELECT action_text
            FROM task_history
            WHERE project_id = :project_id
              AND task_id = :task_id
              AND action = 'STATE_CHANGE'
            ORDER BY action_date DESC
        """
        result = await db.fetch_all(
            query, values={"project_id": project_id, "task_id": task_id}
        )

        # If no results, return READY status
        if not result:
            return TaskStatus.READY

        # If we only have one result and for_undo is True, return READY
        if len(result) == 1 and for_undo:
            return TaskStatus.READY

        # If the last status was MAPPED or BADIMAGERY and for_undo is True, return READY
        if for_undo and result[0]["action_text"] in [
            TaskStatus.MAPPED.name,
            TaskStatus.BADIMAGERY.name,
        ]:
            return TaskStatus.READY

        # If for_undo is True, return the second last status
        if for_undo:
            return TaskStatus[result[1]["action_text"]]
        # Otherwise, return the last status
        return TaskStatus[result[0]["action_text"]]

    @staticmethod
    async def get_last_action(project_id: int, task_id: int, db: Database):
        """Gets the most recent task history record for the task"""
        query = """
            SELECT * FROM task_history
            WHERE project_id = :project_id AND task_id = :task_id
            ORDER BY action_date DESC
            LIMIT 1
        """
        return await db.fetch_one(query, {"project_id": project_id, "task_id": task_id})

    @staticmethod
    async def get_last_action_of_type(
        project_id: int, task_id: int, allowed_task_actions: list, db: Database
    ):
        """Gets the most recent task history record having provided TaskAction"""
        query = """
            SELECT id, action, action_date
            FROM task_history
            WHERE project_id = :project_id
            AND task_id = :task_id
            AND action = ANY(:allowed_actions)
            ORDER BY action_date DESC
            LIMIT 1
        """
        values = {
            "project_id": project_id,
            "task_id": task_id,
            "allowed_actions": tuple(allowed_task_actions),
        }
        result = await db.fetch_one(query=query, values=values)
        return result

    @staticmethod
    async def get_last_locked_action(project_id: int, task_id: int, db: Database):
        """Gets the most recent task history record with locked action for the task"""
        return await TaskHistory.get_last_action_of_type(
            project_id,
            task_id,
            [
                TaskAction.LOCKED_FOR_MAPPING.name,
                TaskAction.LOCKED_FOR_VALIDATION.name,
            ],
            db,
        )

    @staticmethod
    async def get_last_locked_or_auto_unlocked_action(
        task_id: int, project_id: int, db: Database
    ):
        """Fetch the last locked or auto-unlocked action for a task."""
        query = """
            SELECT action
            FROM task_history
            WHERE task_id = :task_id
              AND project_id = :project_id
              AND action IN (
                  'LOCKED_FOR_MAPPING',
                  'LOCKED_FOR_VALIDATION',
                  'AUTO_UNLOCKED_FOR_MAPPING',
                  'AUTO_UNLOCKED_FOR_VALIDATION'
              )
            ORDER BY action_date DESC
            LIMIT 1
        """
        row = await db.fetch_one(
            query=query, values={"task_id": task_id, "project_id": project_id}
        )
        return row["action"] if row else None

    @staticmethod
    async def get_last_mapped_action(project_id: int, task_id: int, db: Database):
        """
        Gets the most recent mapped action, if any, in the task history.
        """

        query = """
            SELECT * FROM task_history
            WHERE project_id = :project_id
            AND task_id = :task_id
            AND action = 'STATE_CHANGE'
            AND action_text IN ('BADIMAGERY', 'MAPPED')
            ORDER BY action_date DESC
            LIMIT 1
        """
        last_mapped = await db.fetch_one(
            query=query, values={"project_id": project_id, "task_id": task_id}
        )
        return last_mapped


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

    @classmethod
    def from_geojson_feature(cls, task_id, task_feature):
        """
        Constructs and validates a task from a GeoJson feature object.
        :param task_id: Unique ID for the task.
        :param task_feature: A geojson feature object.
        :raises InvalidGeoJson, InvalidData
        """
        if type(task_feature) is not geojson.Feature:
            raise InvalidGeoJson("MustBeFeature - Invalid GeoJson should be a feature")

        task_geometry = task_feature.geometry

        if type(task_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson("MustBeMultiPolygon - Geometry must be a MultiPolygon")

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
            wkt = shape(task_feature.geometry).wkt
            ewkt = f"SRID=4326;{wkt}"
            task.geometry = ewkt
        except KeyError as e:
            raise InvalidData(
                f"PropertyNotFound: Expected property not found: {str(e)}"
            )

        if "extra_properties" in task_feature.properties:
            task.extra_properties = json.dumps(
                task_feature.properties["extra_properties"]
            )
        task.id = task_id
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
    async def get_tasks(project_id: int, task_ids: List[int], db: Database):
        """
        Get all tasks that match the supplied list of task_ids for a project.
        """
        query = """
            SELECT id, geometry
            FROM tasks
            WHERE project_id = :project_id
            AND id = ANY(:task_ids)
        """
        values = {"project_id": project_id, "task_ids": task_ids}
        rows = await db.fetch_all(query=query, values=values)
        return rows

    @staticmethod
    async def get_all_tasks(project_id: int, db: Database):
        """
        Get all tasks for a given project.
        """
        query = """
            SELECT id, geometry
            FROM tasks
            WHERE project_id = :project_id
        """
        values = {"project_id": project_id}
        rows = await db.fetch_all(query=query, values=values)
        return rows

    @staticmethod
    async def get_tasks_by_status(project_id: int, status: str, db: Database):
        """
        Returns all tasks filtered by status in a project.
        :param project_id: The ID of the project.
        :param status: The status to filter tasks by.
        :param db: The database connection.
        :return: A list of tasks with the specified status in the given project.
        """
        query = """
            SELECT *
            FROM tasks
            WHERE project_id = :project_id
              AND task_status = :task_status
        """
        values = {
            "project_id": project_id,
            "task_status": TaskStatus[status].value,
        }
        tasks = await db.fetch_all(query=query, values=values)
        return tasks

    @staticmethod
    async def auto_unlock_delta():
        return parse_duration(settings.TASK_AUTOUNLOCK_AFTER)

    @staticmethod
    async def auto_unlock_tasks(project_id: int, db: Database):
        """Unlock all tasks locked for longer than the auto-unlock delta."""
        expiry_delta = await Task.auto_unlock_delta()
        expiry_date = datetime.datetime.utcnow() - expiry_delta

        # Query for task IDs to unlock
        query = """
            SELECT tasks.id
            FROM tasks
            JOIN task_history
              ON tasks.id = task_history.task_id
             AND tasks.project_id = task_history.project_id
            WHERE tasks.task_status IN (1, 3)
              AND task_history.action IN (
                  'EXTENDED_FOR_MAPPING',
                  'EXTENDED_FOR_VALIDATION',
                  'LOCKED_FOR_VALIDATION',
                  'LOCKED_FOR_MAPPING'
              )
              AND task_history.action_text IS NULL
              AND tasks.project_id = :project_id
              AND task_history.action_date <= :expiry_date
        """
        old_task_ids = await db.fetch_all(
            query=query, values={"project_id": project_id, "expiry_date": expiry_date}
        )
        old_task_ids = [row["id"] for row in old_task_ids]
        if not old_task_ids:
            return  # No tasks to unlock

        for task_id in old_task_ids:
            await Task.auto_unlock_expired_tasks(task_id, project_id, expiry_date, db)

    @staticmethod
    async def auto_unlock_expired_tasks(
        task_id: int, project_id: int, expiry_date: datetime, db: Database
    ):
        """Unlock all tasks locked before expiry date. Clears task lock if needed."""
        lock_duration = (
            (datetime.datetime.min + await Task.auto_unlock_delta()).time().isoformat()
        )

        await TaskHistory.update_expired_and_locked_actions(
            task_id, project_id, expiry_date, lock_duration, db
        )
        last_action = await TaskHistory.get_last_locked_or_auto_unlocked_action(
            task_id, project_id, db
        )

        if last_action in ["AUTO_UNLOCKED_FOR_MAPPING", "AUTO_UNLOCKED_FOR_VALIDATION"]:
            await Task.clear_lock(task_id, project_id, db)

    @staticmethod
    def is_mappable(task: dict) -> bool:
        """Determines if task in scope is in a suitable state for mapping."""
        if TaskStatus(task.task_status) not in [
            TaskStatus.READY,
            TaskStatus.INVALIDATED,
        ]:
            return False
        return True

    @staticmethod
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
        if action in [TaskAction.LOCKED_FOR_MAPPING, TaskAction.LOCKED_FOR_VALIDATION]:
            action_name, action_text = TaskHistory.set_task_locked_action(action)
        elif action in [
            TaskAction.EXTENDED_FOR_MAPPING,
            TaskAction.EXTENDED_FOR_VALIDATION,
        ]:
            action_name, action_text = TaskHistory.set_task_extend_action(action)
        elif action == TaskAction.COMMENT:
            action_name, action_text = TaskHistory.set_comment_action(comment)
        elif action == TaskAction.STATE_CHANGE and new_state:
            action_name, action_text = TaskHistory.set_state_change_action(new_state)
        elif action in [
            TaskAction.AUTO_UNLOCKED_FOR_MAPPING,
            TaskAction.AUTO_UNLOCKED_FOR_VALIDATION,
        ]:
            action_name, action_text = TaskHistory.set_auto_unlock_action(action)
        else:
            raise ValueError("Invalid Action")

        # Insert the task history into the task_history table
        query = """
            INSERT INTO task_history (task_id, user_id, project_id, action, action_text, action_date)
            VALUES (:task_id, :user_id, :project_id, :action, :action_text, :action_date)
            RETURNING id, action, action_text, action_date
        """
        values = {
            "task_id": task_id,
            "user_id": user_id,
            "project_id": project_id,
            "action": action_name,
            "action_text": action_text,
            "action_date": timestamp(),
        }
        task_history = await db.fetch_one(query=query, values=values)

        # TODO Verify this.
        # Insert any mapping issues into the task_mapping_issues table, building the query dynamically
        if mapping_issues:
            for issue in mapping_issues:
                fields = {"task_history_id": task_history["id"]}
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

        return task_history

    @staticmethod
    async def lock_task_for_mapping(
        task_id: int, project_id: int, user_id: int, db: Database
    ):
        """Locks a task for mapping by a user."""
        # Insert a task history record for the action
        await Task.set_task_history(
            task_id, project_id, user_id, TaskAction.LOCKED_FOR_MAPPING, db
        )

        # Update the task's status and set it as locked by the user for the specific project_id
        query = """
            UPDATE tasks
            SET task_status = :task_status, locked_by = :user_id
            WHERE id = :task_id AND project_id = :project_id
        """
        values = {
            "task_status": TaskStatus.LOCKED_FOR_MAPPING.value,
            "user_id": user_id,
            "task_id": task_id,
            "project_id": project_id,
        }
        await db.execute(query=query, values=values)

    @staticmethod
    async def lock_task_for_validating(
        task_id: int, project_id: int, user_id: int, db: Database
    ):
        """Lock the task for validation."""
        # Insert a task history record for the action
        await Task.set_task_history(
            task_id, project_id, user_id, TaskAction.LOCKED_FOR_VALIDATION, db
        )
        query = """
            UPDATE tasks
            SET task_status = :status, locked_by = :user_id
            WHERE id = :task_id AND project_id = :project_id
        """
        values = {
            "status": TaskStatus.LOCKED_FOR_VALIDATION.value,
            "user_id": user_id,
            "task_id": task_id,
            "project_id": project_id,
        }
        await db.execute(query=query, values=values)

    @staticmethod
    async def reset_task(task_id: int, project_id: int, user_id: int, db: Database):
        """Resets the task with the provided task_id and updates its status"""

        # Fetch the auto-unlock duration
        expiry_delta = await Task.auto_unlock_delta()
        lock_duration = (datetime.datetime.min + expiry_delta).time().isoformat()

        query = """
            SELECT task_status, mapped_by, validated_by, locked_by
            FROM tasks
            WHERE id = :task_id AND project_id = :project_id
        """
        task = await db.fetch_one(
            query=query, values={"task_id": task_id, "project_id": project_id}
        )

        if TaskStatus(task["task_status"]) in [
            TaskStatus.LOCKED_FOR_MAPPING,
            TaskStatus.LOCKED_FOR_VALIDATION,
        ]:
            await Task.record_auto_unlock(task_id, project_id, lock_duration, db)

        update_task_query = """
            UPDATE tasks
            SET task_status = :ready_status,
                mapped_by = NULL,
                validated_by = NULL,
                locked_by = NULL
            WHERE id = :task_id AND project_id = :project_id
        """
        await db.execute(
            query=update_task_query,
            values={
                "task_id": task_id,
                "ready_status": TaskStatus.READY.value,
                "project_id": project_id,
            },
        )

        # Log the state change in the task history
        await Task.set_task_history(
            task_id=task_id,
            project_id=project_id,
            user_id=user_id,
            action=TaskAction.STATE_CHANGE,
            db=db,
            new_state=TaskStatus.READY,
        )

    @staticmethod
    async def unlock_task(
        task_id: int,
        project_id: int,
        user_id: int,
        new_state: TaskStatus,
        db: Database,
        comment: Optional[str] = None,
        undo: bool = False,
        issues: Optional[List[Dict[str, Any]]] = None,
    ):
        """Unlock task and ensure duration task locked is saved in History"""
        #  If not undo, update the duration of the lock
        if not undo:
            last_history = await TaskHistory.get_last_action(project_id, task_id, db)
            # To unlock a task the last action must have been either lock or extension
            last_action = TaskAction[last_history["result"][0]["action"]]
            await TaskHistory.update_task_locked_with_duration(
                task_id, project_id, last_action, user_id, db
            )

        # Only create new history after updating the duration since we need the last action to update the duration.
        if comment:
            await Task.set_task_history(
                task_id,
                project_id,
                user_id,
                TaskAction.COMMENT,
                db,
                comment=comment,
                mapping_issues=issues,
            )

        # Record state change in history
        history = await Task.set_task_history(
            task_id,
            project_id,
            user_id,
            TaskAction.STATE_CHANGE,
            db,
            comment=comment,
            new_state=new_state,
            mapping_issues=issues,
        )
        # If undo, clear the mapped_by and validated_by fields
        if undo:
            if new_state == TaskStatus.MAPPED:
                update_query = """
                    UPDATE tasks
                    SET validated_by = NULL
                    WHERE id = :task_id AND project_id = :project_id
                """
                await db.execute(
                    query=update_query,
                    values={"task_id": task_id, "project_id": project_id},
                )
            elif new_state == TaskStatus.READY:
                update_query = """
                    UPDATE tasks
                    SET mapped_by = NULL
                    WHERE id = :task_id AND project_id = :project_id
                """
                await db.execute(
                    query=update_query,
                    values={"task_id": task_id, "project_id": project_id},
                )
        else:
            current_status_query = """
                SELECT task_status FROM tasks WHERE id = :task_id AND project_id = :project_id
            """
            current_status_result = await db.fetch_one(
                query=current_status_query,
                values={"task_id": task_id, "project_id": project_id},
            )
            current_status = TaskStatus(current_status_result["task_status"])
            # Handle specific state changes
            if new_state == TaskStatus.VALIDATED:
                await TaskInvalidationHistory.record_validation(
                    project_id, task_id, user_id, history, db
                )
                update_query = """
                    UPDATE tasks
                    SET validated_by = :user_id
                    WHERE id = :task_id AND project_id = :project_id
                """
                await db.execute(
                    query=update_query,
                    values={
                        "user_id": user_id,
                        "task_id": task_id,
                        "project_id": project_id,
                    },
                )

            elif new_state == TaskStatus.INVALIDATED:
                await TaskInvalidationHistory.record_invalidation(
                    project_id, task_id, user_id, history, db
                )
                update_query = """
                    UPDATE tasks
                    SET mapped_by = NULL, validated_by = NULL
                    WHERE id = :task_id AND project_id = :project_id
                """
                await db.execute(
                    query=update_query,
                    values={"task_id": task_id, "project_id": project_id},
                )

            # Set `mapped_by` for MAPPED or BADIMAGERY states when not locked for validation
            elif new_state in [TaskStatus.MAPPED, TaskStatus.BADIMAGERY]:
                if current_status != TaskStatus.LOCKED_FOR_VALIDATION:
                    update_query = """
                        UPDATE tasks
                        SET mapped_by = :user_id
                        WHERE id = :task_id AND project_id = :project_id
                    """
                    await db.execute(
                        query=update_query,
                        values={
                            "user_id": user_id,
                            "task_id": task_id,
                            "project_id": project_id,
                        },
                    )

        # Final query for updating task status
        final_update_query = """
            UPDATE tasks
            SET task_status = :new_status, locked_by = NULL
            WHERE id = :task_id AND project_id = :project_id
        """
        await db.execute(
            query=final_update_query,
            values={
                "new_status": new_state.value,
                "task_id": task_id,
                "project_id": project_id,
            },
        )

    @staticmethod
    async def clear_task_lock(task_id: int, project_id: int, db: Database):
        """Unlocks task in scope, clears the lock as though it never happened."""

        # Get the last locked action and delete it from the task history
        last_action = await TaskHistory.get_last_locked_action(project_id, task_id, db)
        if last_action:
            delete_action_query = """
                DELETE FROM task_history
                WHERE id = :history_id
            """
            await db.execute(
                query=delete_action_query, values={"history_id": last_action["id"]}
            )

        # Clear the lock from the task itself
        await Task.clear_lock(task_id=task_id, project_id=project_id, db=db)

    @staticmethod
    async def record_auto_unlock(
        task_id: int, project_id: int, lock_duration: str, db: Database
    ):
        """Automatically unlocks the task and records the auto-unlock action in task history"""

        # Fetch the locked user and last locked action for the task
        locked_user_query = """
            SELECT locked_by
            FROM tasks
            WHERE id = :task_id AND project_id = :project_id
        """
        locked_user = await db.fetch_one(
            query=locked_user_query,
            values={"task_id": task_id, "project_id": project_id},
        )

        last_action = await TaskHistory.get_last_locked_action(project_id, task_id, db)

        if last_action and last_action["action"] == "LOCKED_FOR_MAPPING":
            next_action = TaskAction.AUTO_UNLOCKED_FOR_MAPPING
        else:
            next_action = TaskAction.AUTO_UNLOCKED_FOR_VALIDATION

        # Clear the task lock (clear the lock and delete the last locked action)
        await Task.clear_task_lock(task_id, project_id, db)

        # Add AUTO_UNLOCKED action in the task history
        auto_unlocked = await Task.set_task_history(
            task_id=task_id,
            project_id=project_id,
            user_id=locked_user["locked_by"],
            action=next_action,
            db=db,
        )

        # Update the action_text with the lock duration
        update_history_query = """
            UPDATE task_history
            SET action_text = :lock_duration
            WHERE id = :history_id
        """
        await db.execute(
            query=update_history_query,
            values={"lock_duration": lock_duration, "history_id": auto_unlocked["id"]},
        )

    @staticmethod
    async def reset_lock(
        task_id: int,
        project_id: int,
        task_status: TaskStatus,
        user_id: int,
        comment: Optional[str],
        db: Database,
    ):
        """
        Removes a current lock from a task, resets to the last status, and updates history with the lock duration.
        :param task_id: The ID of the task to reset the lock for.
        :param project_id: The project ID the task belongs to.
        :param task_status: The current task status.
        :param user_id: The ID of the user resetting the lock.
        :param comment: Optional comment provided during the reset.
        :param db: The database connection.
        """

        last_history = TaskHistory.get_last_action(project_id, task_id, db)
        # To reset a lock the last action must have been either lock or extension
        last_action = TaskAction[last_history["result"][0]["action"]]
        await TaskHistory.update_task_locked_with_duration(
            task_id, project_id, last_action, user_id, db
        )

        # Only set task history after updating the duration since we need the last action to update the duration.
        # If a comment is provided, set the task history with a comment action
        if comment:
            await Task.set_task_history(
                task_id=task_id,
                project_id=project_id,
                user_id=user_id,
                action=TaskAction.COMMENT,
                comment=comment,
                db=db,
            )

        # Clear the lock on the task
        await Task.clear_lock(task_id=task_id, project_id=project_id, db=db)

    @staticmethod
    async def clear_lock(task_id: int, project_id: int, db: Database):
        """
        Resets the task to its last status and removes the current lock from the task.
        :param task_id: The ID of the task to clear the lock for.
        :param project_id: The project ID the task belongs to.
        :param db: The database connection.
        """
        last_status = await TaskHistory.get_last_status(project_id, task_id, db)
        # Clear the lock by updating the task's status and lock status
        update_query = """
            UPDATE tasks
            SET task_status = :task_status, locked_by = NULL
            WHERE id = :task_id AND project_id = :project_id
        """
        update_values = {
            "task_status": last_status.value,
            "task_id": task_id,
            "project_id": project_id,
        }
        await db.execute(query=update_query, values=update_values)

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
                t.mapped_by,
                t.validated_by
            FROM tasks t
            WHERE t.project_id = :project_id
        """

        # Initialize query parameters
        filters = {"project_id": project_id}

        # Add task_id filter
        if task_ids_str:
            task_ids = [int(task_id) for task_id in task_ids_str.split(",")]
            query += " AND t.id = ANY(:task_ids)"
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
                validatedBy=row["validated_by"],
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

        rows = await db.fetch_all(query, values={"project_id": project_id})

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
    async def get_mapped_tasks_by_user(project_id: int, db: Database) -> MappedTasks:
        """Gets all mapped tasks for supplied project grouped by user"""

        # Modified query to return the JSON as text to handle manually
        query = """
        SELECT
            u.username,
            u.mapping_level,
            COUNT(DISTINCT t.id) as mapped_task_count,
            JSONB_AGG(DISTINCT t.id)::text as tasks_mapped,
            MAX(th.action_date) as last_seen,
            u.date_registered,
            u.last_validation_date
        FROM
            tasks t
        JOIN
            task_history th ON t.project_id = th.project_id AND t.id = th.task_id
        JOIN
            users u ON t.mapped_by = u.id
        WHERE
            t.project_id = :project_id
            AND t.task_status = 2
            AND th.action_text = 'MAPPED'
        GROUP BY
            u.username,
            u.mapping_level,
            u.date_registered,
            u.last_validation_date
        """

        results = await db.fetch_all(query=query, values={"project_id": project_id})

        mapped_tasks_dto = MappedTasks()

        for row in results:
            tasks_mapped_str = row["tasks_mapped"]
            tasks_mapped = json.loads(tasks_mapped_str) if tasks_mapped_str else []
            mapping_level = await MappingLevel.get_by_id(row["mapping_level"], db)
            mapping_level_name = mapping_level.name

            user_mapped = MappedTasksByUser(
                username=row["username"],
                mapped_task_count=row["mapped_task_count"],
                tasks_mapped=tasks_mapped,
                last_seen=row["last_seen"],
                mapping_level=mapping_level_name,
                date_registered=row["date_registered"],
                last_validation_date=row["last_validation_date"],
            )

            mapped_tasks_dto.mapped_tasks.append(user_mapped)

        return mapped_tasks_dto

    @staticmethod
    async def get_max_task_id_for_project(project_id: int, db: Database):
        """
        Gets the highest task id currently in use on a project using raw SQL with async db.
        """
        query = """
            SELECT MAX(id)
            FROM tasks
            WHERE project_id = :project_id
            GROUP BY project_id
        """

        result = await db.fetch_val(query, values={"project_id": project_id})
        if not result:
            raise NotFound(sub_code="TASKS_NOT_FOUND", project_id=project_id)
        return result

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

    async def task_as_dto(
        self,
        task_history: List[TaskHistoryDTO] = [],
        last_updated: datetime.datetime = None,
        comments: int = None,
        db: Database = None,
    ):
        from backend.services.users.user_service import UserService

        """Just converts to a TaskDTO"""
        task_dto = TaskDTO()
        task_dto.task_id = self.id
        task_dto.project_id = self.project_id
        task_dto.task_status = TaskStatus(self.task_status).name
        user = (
            await UserService.get_user_by_id(self.locked_by, db)
            if self.locked_by
            else None
        )
        task_dto.lock_holder = user.username if user else None
        task_dto.task_history = task_history
        task_dto.last_updated = last_updated if last_updated else None
        unlock_delta = await Task.auto_unlock_delta()
        task_dto.auto_unlock_seconds = (
            unlock_delta.total_seconds() if unlock_delta else None
        )
        task_dto.comments_number = comments if isinstance(comments, int) else None
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

        last_updated = (
            task_history[0].action_date.replace(tzinfo=timezone.utc).isoformat()
            if task_history
            else None
        )
        task_dto = await Task.as_dto(task_id, project_id, db, last_updated)
        per_task_instructions = await Task.get_per_task_instructions(
            task_id, project_id, preferred_locale, db
        )
        if not per_task_instructions:
            query_locale = """
                SELECT
                    p.default_locale
                FROM
                    projects p
                WHERE
                    p.id = :project_id
            """
            default_locale_row = await db.fetch_one(
                query=query_locale, values={"project_id": project_id}
            )
            default_locale = (
                default_locale_row["default_locale"] if default_locale_row else None
            )

            per_task_instructions = (
                await Task.get_per_task_instructions(
                    task_id, project_id, default_locale, db
                )
                if default_locale
                else None
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

    @staticmethod
    async def copy_task_history(
        original_task_id: int, new_task_id: int, project_id: int, db: Database
    ) -> None:
        """
        Copy all task history records from the original task to a new task.

        :param original_task_id: ID of the task whose history is to be copied.
        :param new_task_id: ID of the new task to which the history will be copied.
        :param project_id: ID of the project associated with the task history.
        :param db: Database connection instance.
        """
        # Insert the task history with the new_task_id and provided project_id
        insert_query = """
            INSERT INTO task_history (project_id, task_id, action, action_text, action_date, user_id)
            SELECT :project_id, :new_task_id, action, action_text, action_date, user_id
            FROM task_history
            WHERE task_id = :original_task_id AND project_id = :project_id
        """

        await db.execute(
            insert_query,
            values={
                "project_id": project_id,
                "new_task_id": new_task_id,
                "original_task_id": original_task_id,
            },
        )

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
