import asyncio
import datetime
from typing import Set

from databases import Database
from fastapi import BackgroundTasks
from loguru import logger
from sqlalchemy import text

from backend.db import db_connection
from backend.exceptions import NotFound
from backend.models.dtos.mapping_dto import TaskDTOs
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.validator_dto import (
    InvalidatedTask,
    InvalidatedTasks,
    LockForValidationDTO,
    MappedTasks,
    RevertUserTasksDTO,
    StopValidationDTO,
    UnlockAfterValidationDTO,
)
from backend.models.postgis.project_info import ProjectInfo
from backend.models.postgis.statuses import ValidatingNotAllowed
from backend.models.postgis.task import (
    Task,
    TaskHistory,
    TaskInvalidationHistory,
    TaskMappingIssue,
    TaskStatus,
)
from backend.models.postgis.utils import UserLicenseError
from backend.services.mapping_service import MappingService
from backend.services.messaging.message_service import MessageService
from backend.services.project_service import ProjectAdminService, ProjectService
from backend.services.stats_service import StatsService
from backend.services.users.user_service import UserService


class ValidatorServiceError(Exception):
    """Custom exception to notify callers that error has occurred"""

    def __init__(self, message):
        logger.debug(message)


class ValidatorService:
    @staticmethod
    async def lock_tasks_for_validation(
        validation_dto: LockForValidationDTO, db: Database
    ) -> TaskDTOs:
        """
        Lock supplied tasks for validation
        :raises ValidatorServiceError
        """
        # Loop supplied tasks to check they can all be locked for validation
        tasks_to_lock = []
        for task_id in validation_dto.task_ids:
            task = await Task.get(task_id, validation_dto.project_id, db)

            if task is None:
                raise NotFound(
                    sub_code="TASK_NOT_FOUND",
                    task_id=task_id,
                    project_id=validation_dto.project_id,
                )
            if not (
                task.locked_by == validation_dto.user_id
                and TaskStatus(task.task_status) == TaskStatus.LOCKED_FOR_VALIDATION
            ):
                if TaskStatus(task.task_status) not in [
                    TaskStatus.MAPPED,
                    TaskStatus.INVALIDATED,
                    TaskStatus.BADIMAGERY,
                ]:
                    raise ValidatorServiceError(
                        f"NotReadyForValidation- Task {task_id} is not MAPPED, BADIMAGERY or INVALIDATED"
                    )
                user_can_validate = await ValidatorService._user_can_validate_task(
                    validation_dto.user_id, task.mapped_by, db
                )
                if not user_can_validate:
                    raise ValidatorServiceError(
                        "CannotValidateMappedTask-"
                        + "Tasks cannot be validated by the same user who marked task as mapped or badimagery"
                    )

            tasks_to_lock.append(task)

        (
            user_can_validate,
            error_reason,
        ) = await ProjectService.is_user_permitted_to_validate(
            validation_dto.project_id, validation_dto.user_id, db
        )

        if not user_can_validate:
            if error_reason == ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE:
                raise UserLicenseError("User must accept license to map this task")
            elif error_reason == ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST:
                raise ValidatorServiceError(
                    "UserNotAllowed- Validation not allowed because: User not on allowed list"
                )
            elif error_reason == ValidatingNotAllowed.PROJECT_NOT_PUBLISHED:
                raise ValidatorServiceError(
                    "ProjectNotPublished- Validation not allowed because: Project not published"
                )
            elif error_reason == ValidatingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED:
                user_tasks = await Task.get_locked_tasks_for_user(
                    validation_dto.user_id, db
                )
                if set(user_tasks.locked_tasks) != set(validation_dto.task_ids):
                    raise ValidatorServiceError(
                        "UserAlreadyHasTaskLocked- User already has a task locked"
                    )
            else:
                raise ValidatorServiceError(
                    f"ValidtionNotAllowed- Validation not allowed because: {error_reason}"
                )

        # Lock all tasks for validation
        dtos = []
        for task in tasks_to_lock:
            await Task.lock_task_for_validating(
                task.id, validation_dto.project_id, validation_dto.user_id, db
            )
            dtos.append(
                await Task.as_dto_with_instructions(
                    task.id,
                    validation_dto.project_id,
                    db,
                    validation_dto.preferred_locale,
                )
            )
        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    async def _user_can_validate_task(
        user_id: int, mapped_by: int, db: Database
    ) -> bool:
        """
        check whether a user is able to validate a task.  Users cannot validate their own tasks unless they are a PM
        (admin counts as project manager too)
        :param user_id: id of user attempting to validate
        :param mapped_by: id of user who mapped the task
        :return: Boolean
        """
        is_admin = await UserService.is_user_an_admin(user_id, db)
        if is_admin:
            return True
        else:
            mapped_by_me = mapped_by == user_id
            if not mapped_by_me:
                return True
            return False

    async def process_task(
        project_id,
        task_to_unlock,
        validated_dto,
        message_sent_to: Set[int],
        message_lock: asyncio.Lock,
    ):
        async with db_connection.database.connection() as db:
            task = task_to_unlock["task"]
            if task_to_unlock["comment"]:
                await MessageService.send_message_after_comment(
                    validated_dto.user_id,
                    task_to_unlock["comment"],
                    task.id,
                    validated_dto.project_id,
                    db,
                )
            if (
                task_to_unlock["new_state"] == TaskStatus.VALIDATED
                or task_to_unlock["new_state"] == TaskStatus.INVALIDATED
            ):
                mapped_by = task.mapped_by
                # acquire lock so two coros can’t both think “not yet sent”
                async with message_lock:
                    need_to_send = mapped_by not in message_sent_to
                    if need_to_send:
                        message_sent_to.add(mapped_by)

                if need_to_send:
                    await MessageService.send_message_after_validation(
                        task_to_unlock["new_state"],
                        validated_dto.user_id,
                        mapped_by,
                        task.id,
                        project_id,
                        db,
                    )

                # Set last_validation_date for the mapper to current date
                if task_to_unlock["new_state"] == TaskStatus.VALIDATED:
                    query = """
                    UPDATE users
                    SET last_validation_date = :timestamp
                    WHERE id = (
                        SELECT mapped_by
                        FROM tasks
                        WHERE id = :task_id
                        AND project_id = :project_id
                    );
                    """
                    values = {
                        "timestamp": datetime.datetime.utcnow(),
                        "task_id": task.id,
                        "project_id": validated_dto.project_id,
                    }
                    await db.execute(query=query, values=values)

            # Update stats if user setting task to a different state from previous state
            prev_status = await TaskHistory.get_last_status(project_id, task.id, db)
            if prev_status != task_to_unlock["new_state"]:
                await StatsService.update_stats_after_task_state_change(
                    validated_dto.project_id,
                    validated_dto.user_id,
                    prev_status,
                    task_to_unlock["new_state"],
                    db,
                )
            task_mapping_issues = await ValidatorService.get_task_mapping_issues(
                task_to_unlock
            )
            await Task.unlock_task(
                task_id=task.id,
                project_id=project_id,
                user_id=validated_dto.user_id,
                new_state=task_to_unlock["new_state"],
                db=db,
                comment=task_to_unlock["comment"],
                issues=task_mapping_issues,
            )

            return await Task.as_dto_with_instructions(
                task.id, project_id, db, validated_dto.preferred_locale
            )

    async def process_tasks_concurrently(project_id, tasks_to_unlock, validated_dto):
        """
        Process tasks concurrently and ensure each task gets its own DB connection.
        """
        message_sent_to: set[int] = set()
        message_lock = asyncio.Lock()
        tasks = [
            ValidatorService.process_task(
                project_id, task_to_unlock, validated_dto, message_sent_to, message_lock
            )
            for task_to_unlock in tasks_to_unlock
        ]
        return await asyncio.gather(*tasks)

    @staticmethod
    async def unlock_tasks_after_validation(
        validated_dto: UnlockAfterValidationDTO,
        db: Database,
        background_tasks: BackgroundTasks,
    ) -> TaskDTOs:
        """
        Unlocks supplied tasks after validation
        :raises ValidatorServiceError
        """
        validated_tasks = validated_dto.validated_tasks
        project_id = validated_dto.project_id
        user_id = validated_dto.user_id
        tasks_to_unlock = await ValidatorService.get_tasks_locked_by_user(
            project_id, validated_tasks, user_id, db
        )
        results = await ValidatorService.process_tasks_concurrently(
            project_id, tasks_to_unlock, validated_dto
        )
        background_tasks.add_task(
            ProjectService.send_email_on_project_progress,
            validated_dto.project_id,
        )
        task_dtos = TaskDTOs()
        task_dtos.tasks = results
        return task_dtos

    @staticmethod
    async def stop_validating_tasks(
        stop_validating_dto: StopValidationDTO, db: Database
    ) -> TaskDTOs:
        """
        Unlocks supplied tasks after validation
        :raises ValidatorServiceError
        """
        reset_tasks = stop_validating_dto.reset_tasks
        project_id = stop_validating_dto.project_id
        user_id = stop_validating_dto.user_id
        tasks_to_unlock = await ValidatorService.get_tasks_locked_by_user(
            project_id, reset_tasks, user_id, db
        )
        dtos = []
        for task_to_unlock in tasks_to_unlock:
            task = task_to_unlock["task"]
            if task_to_unlock["comment"]:
                # Parses comment to see if any users have been @'d
                await MessageService.send_message_after_comment(
                    user_id, task_to_unlock["comment"], task.id, project_id, db
                )
            await Task.reset_lock(
                task.id,
                project_id,
                task.task_status,
                user_id,
                task_to_unlock["comment"],
                db,
            )
            dtos.append(
                await Task.as_dto_with_instructions(
                    task.id, project_id, db, stop_validating_dto.preferred_locale
                )
            )
        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos
        return task_dtos

    @staticmethod
    async def get_tasks_locked_by_user(
        project_id: int, unlock_tasks: list, user_id: int, db: Database
    ):
        """
        Returns tasks specified by project id and unlock_tasks list if found and locked for validation by user,
        otherwise raises ValidatorServiceError, NotFound.

        :param project_id: ID of the project.
        :param unlock_tasks: List of tasks to be unlocked.
        :param user_id: ID of the user attempting to unlock tasks.
        :param db: Async database connection.
        :return: List of tasks to unlock with new states and comments.
        :raises ValidatorServiceError: When task is not locked for validation or owned by another user.
        :raises NotFound: When task is not found.
        """
        tasks_to_unlock = []
        for unlock_task in unlock_tasks:
            task = await Task.get(unlock_task.task_id, project_id, db)

            if task is None:
                raise NotFound(
                    sub_code="TASK_NOT_FOUND",
                    task_id=unlock_task.task_id,
                    project_id=project_id,
                )

            current_state = TaskStatus(task.task_status)
            if current_state != TaskStatus.LOCKED_FOR_VALIDATION:
                raise ValidatorServiceError(
                    f"NotLockedForValidation - Task {unlock_task.task_id} is not LOCKED_FOR_VALIDATION"
                )
            if task.locked_by != user_id:
                raise ValidatorServiceError(
                    "TaskNotOwned - Attempting to unlock a task owned by another user"
                )

            new_status = (
                TaskStatus[unlock_task.status]
                if hasattr(unlock_task, "status")
                else None
            )

            tasks_to_unlock.append(
                dict(
                    task=task,
                    new_state=new_status,
                    comment=unlock_task.comment,
                    issues=unlock_task.issues,
                )
            )

        return tasks_to_unlock

    @staticmethod
    async def get_mapped_tasks_by_user(project_id: int, db: Database) -> MappedTasks:
        """Get all mapped tasks on the project grouped by user"""
        mapped_tasks = await Task.get_mapped_tasks_by_user(project_id, db)
        return mapped_tasks

    @staticmethod
    def get_user_invalidated_tasks(
        as_validator,
        username: str,
        preferred_locale: str,
        closed=None,
        project_id=None,
        page=1,
        page_size=10,
        sort_by="updated_date",
        sort_direction="desc",
    ) -> InvalidatedTasks:
        """Get invalidated tasks either mapped or invalidated by the user"""
        user = UserService.get_user_by_username(username)
        query = (
            TaskInvalidationHistory.query.filter_by(invalidator_id=user.id)
            if as_validator
            else TaskInvalidationHistory.query.filter_by(mapper_id=user.id)
        )

        if closed is not None:
            query = query.filter_by(is_closed=closed)

        if project_id is not None:
            query = query.filter_by(project_id=project_id)

        results = query.order_by(text(sort_by + " " + sort_direction)).paginate(
            page=page, per_page=page_size, error_out=True
        )
        project_names = {}
        invalidated_tasks_dto = InvalidatedTasks()
        for entry in results.items:
            dto = InvalidatedTask()
            dto.task_id = entry.task_id
            dto.project_id = entry.project_id
            dto.history_id = entry.invalidation_history_id
            dto.closed = entry.is_closed
            dto.updated_date = entry.updated_date

            if dto.project_id not in project_names:
                project_names[dto.project_id] = ProjectInfo.get_dto_for_locale(
                    dto.project_id, preferred_locale
                ).name
            dto.project_name = project_names[dto.project_id]

            invalidated_tasks_dto.invalidated_tasks.append(dto)

        invalidated_tasks_dto.pagination = Pagination(results)
        return invalidated_tasks_dto

    @staticmethod
    async def invalidate_all_tasks(project_id: int, user_id: int, db: Database):
        """Invalidates all validated tasks on a project."""
        query = """
            SELECT id, task_status FROM tasks
            WHERE project_id = :project_id
            AND task_status = :validated_status
        """
        validated_tasks = await db.fetch_all(
            query=query,
            values={
                "project_id": project_id,
                "validated_status": TaskStatus.VALIDATED.value,
            },
        )
        for task in validated_tasks:
            await Task.lock_task_for_validating(task["id"], project_id, user_id, db)
            await Task.unlock_task(
                task["id"], project_id, user_id, TaskStatus.INVALIDATED, db
            )

        # Reset counters for the project
        project_query = """
            UPDATE projects
            SET tasks_validated = 0
            WHERE id = :project_id
        """
        await db.execute(query=project_query, values={"project_id": project_id})

    @staticmethod
    async def validate_all_tasks(project_id: int, user_id: int, db: Database):
        """Validates all mapped tasks on a project using raw SQL queries"""

        # Fetch tasks that are in the MAPPED state
        query = """
            SELECT id, task_status, mapped_by
            FROM tasks
            WHERE project_id = :project_id
            AND task_status = :mapped_status
        """
        tasks_to_validate = await db.fetch_all(
            query=query,
            values={
                "project_id": project_id,
                "mapped_status": TaskStatus.MAPPED.value,
            },
        )

        for task in tasks_to_validate:
            task_id = task["id"]
            mapped_by = (
                task["mapped_by"] or user_id
            )  # Ensure we set the 'mapped_by' value

            # Lock the task for validation if it's not already locked
            current_status = TaskStatus(task["task_status"])
            if current_status not in [
                TaskStatus.LOCKED_FOR_MAPPING,
                TaskStatus.LOCKED_FOR_VALIDATION,
            ]:
                await Task.lock_task_for_validating(task_id, project_id, user_id, db)

            # Unlock the task and set its status to VALIDATED
            await Task.unlock_task(
                task_id=task_id,
                project_id=project_id,
                user_id=user_id,
                new_state=TaskStatus.VALIDATED,
                db=db,
            )

            # Update the mapped_by field if necessary
            update_mapped_by_query = """
                UPDATE tasks
                SET mapped_by = :mapped_by
                WHERE id = :task_id
                AND project_id = :project_id
            """
            await db.execute(
                query=update_mapped_by_query,
                values={
                    "mapped_by": mapped_by,
                    "task_id": task_id,
                    "project_id": project_id,
                },
            )

        # Update the project's task counters using raw SQL
        project_update_query = """
            UPDATE projects
            SET tasks_validated = tasks_validated + tasks_mapped,
                tasks_mapped = 0
            WHERE id = :project_id
        """
        await db.execute(query=project_update_query, values={"project_id": project_id})

    @staticmethod
    async def get_task_mapping_issues(task_to_unlock: dict):
        if task_to_unlock["issues"] is None:
            return None
        # map ValidationMappingIssue DTOs to TaskMappingIssue instances for any issues
        # that have count above zero.
        return list(
            map(
                lambda issue_dto: TaskMappingIssue(
                    issue=issue_dto.issue,
                    count=issue_dto.count,
                    mapping_issue_category_id=issue_dto.mapping_issue_category_id,
                ),
                filter(lambda issue_dto: issue_dto.count > 0, task_to_unlock["issues"]),
            )
        )

    @staticmethod
    async def revert_user_tasks(revert_dto: RevertUserTasksDTO, db: Database):
        """
        Reverts tasks with the supplied action to the previous state by a specific user.
        :raises ValidatorServiceError
        """
        if await ProjectAdminService.is_user_action_permitted_on_project(
            revert_dto.action_by, revert_dto.project_id, db
        ):
            query = """
                SELECT id
                FROM tasks
                WHERE project_id = :project_id
                AND task_status = :task_status
            """
            values = {
                "project_id": revert_dto.project_id,
                "task_status": TaskStatus[revert_dto.action].value,
            }
            if TaskStatus[revert_dto.action].value == TaskStatus.BADIMAGERY.value:
                query += " AND mapped_by = :user_id"
                values["user_id"] = revert_dto.user_id
            else:
                query += " AND validated_by = :user_id"
                values["user_id"] = revert_dto.user_id
            tasks_to_revert = await db.fetch_all(query=query, values=values)
            for task in tasks_to_revert:
                await MappingService.undo_mapping(
                    revert_dto.project_id,
                    task["id"],
                    revert_dto.user_id,
                    db,
                    revert_dto.preferred_locale,
                )
        else:
            raise ValidatorServiceError(
                "UserActionNotPermitted- User not permitted to revert tasks"
            )
