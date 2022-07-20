from flask import current_app
from sqlalchemy import text

from backend.models.dtos.mapping_dto import TaskDTOs
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.validator_dto import (
    LockForValidationDTO,
    UnlockAfterValidationDTO,
    MappedTasks,
    StopValidationDTO,
    InvalidatedTask,
    InvalidatedTasks,
)
from backend.models.postgis.statuses import ValidatingNotAllowed
from backend.models.postgis.task import (
    Task,
    TaskStatus,
    TaskHistory,
    TaskInvalidationHistory,
    TaskMappingIssue,
)
from backend.models.postgis.utils import NotFound, UserLicenseError, timestamp
from backend.models.postgis.project_info import ProjectInfo
from backend.services.messaging.message_service import MessageService
from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService
from backend.services.users.user_service import UserService


class ValidatorServiceError(Exception):
    """Custom exception to notify callers that error has occurred"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class ValidatorService:
    @staticmethod
    def lock_tasks_for_validation(validation_dto: LockForValidationDTO) -> TaskDTOs:
        """
        Lock supplied tasks for validation
        :raises ValidatorServiceError
        """
        # Loop supplied tasks to check they can all be locked for validation
        tasks_to_lock = []
        for task_id in validation_dto.task_ids:
            task = Task.get(task_id, validation_dto.project_id)

            if task is None:
                raise NotFound(f"Task {task_id} not found")

            if TaskStatus(task.task_status) not in [
                TaskStatus.MAPPED,
                TaskStatus.INVALIDATED,
                TaskStatus.BADIMAGERY,
            ]:
                raise ValidatorServiceError(
                    f"NotReadyForValidation- Task {task_id} is not MAPPED, BADIMAGERY or INVALIDATED"
                )
            user_can_validate = ValidatorService._user_can_validate_task(
                validation_dto.user_id, task.mapped_by
            )
            if not user_can_validate:
                raise ValidatorServiceError(
                    "CannotValidateMappedTask-"
                    + "Tasks cannot be validated by the same user who marked task as mapped or badimagery"
                )

            tasks_to_lock.append(task)

        user_can_validate, error_reason = ProjectService.is_user_permitted_to_validate(
            validation_dto.project_id, validation_dto.user_id
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
                raise ValidatorServiceError(
                    "UserAlreadyHasTaskLocked- User already has a task locked"
                )
            else:
                raise ValidatorServiceError(
                    f"Validation not allowed because: {error_reason}"
                )

        # Lock all tasks for validation
        dtos = []
        for task in tasks_to_lock:
            task.lock_task_for_validating(validation_dto.user_id)
            dtos.append(task.as_dto_with_instructions(validation_dto.preferred_locale))

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def _user_can_validate_task(user_id: int, mapped_by: int) -> bool:
        """
        check whether a user is able to validate a task.  Users cannot validate their own tasks unless they are a PM
        (admin counts as project manager too)
        :param user_id: id of user attempting to validate
        :param mapped_by: id of user who mapped the task
        :return: Boolean
        """
        is_admin = UserService.is_user_an_admin(user_id)
        if is_admin:
            return True
        else:
            mapped_by_me = mapped_by == user_id
            if not mapped_by_me:
                return True
            return False

    @staticmethod
    def unlock_tasks_after_validation(
        validated_dto: UnlockAfterValidationDTO,
    ) -> TaskDTOs:
        """
        Unlocks supplied tasks after validation
        :raises ValidatorServiceError
        """
        validated_tasks = validated_dto.validated_tasks
        project_id = validated_dto.project_id
        user_id = validated_dto.user_id
        tasks_to_unlock = ValidatorService.get_tasks_locked_by_user(
            project_id, validated_tasks, user_id
        )

        # Unlock all tasks
        dtos = []
        message_sent_to = []
        for task_to_unlock in tasks_to_unlock:
            task = task_to_unlock["task"]

            if task_to_unlock["comment"]:
                # Parses comment to see if any users have been @'d
                MessageService.send_message_after_comment(
                    validated_dto.user_id,
                    task_to_unlock["comment"],
                    task.id,
                    validated_dto.project_id,
                )
            if (
                task_to_unlock["new_state"] == TaskStatus.VALIDATED
                or task_to_unlock["new_state"] == TaskStatus.INVALIDATED
            ):
                # All mappers get a notification if their task has been validated or invalidated.
                # Only once if multiple tasks mapped
                if task.mapped_by not in message_sent_to:
                    MessageService.send_message_after_validation(
                        task_to_unlock["new_state"],
                        validated_dto.user_id,
                        task.mapped_by,
                        task.id,
                        validated_dto.project_id,
                    )
                    message_sent_to.append(task.mapped_by)

                if task_to_unlock["new_state"] == TaskStatus.VALIDATED:
                    # Set last_validation_date for the mapper to current date
                    task.mapper.last_validation_date = timestamp()

            # Update stats if user setting task to a different state from previous state
            prev_status = TaskHistory.get_last_status(project_id, task.id)
            if prev_status != task_to_unlock["new_state"]:
                StatsService.update_stats_after_task_state_change(
                    validated_dto.project_id,
                    validated_dto.user_id,
                    prev_status,
                    task_to_unlock["new_state"],
                )
            task_mapping_issues = ValidatorService.get_task_mapping_issues(
                task_to_unlock
            )
            task.unlock_task(
                validated_dto.user_id,
                task_to_unlock["new_state"],
                task_to_unlock["comment"],
                issues=task_mapping_issues,
            )
            dtos.append(task.as_dto_with_instructions(validated_dto.preferred_locale))
        ProjectService.send_email_on_project_progress(validated_dto.project_id)
        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def stop_validating_tasks(stop_validating_dto: StopValidationDTO) -> TaskDTOs:
        """
        Unlocks supplied tasks after validation
        :raises ValidatorServiceError
        """
        reset_tasks = stop_validating_dto.reset_tasks
        project_id = stop_validating_dto.project_id
        user_id = stop_validating_dto.user_id
        tasks_to_unlock = ValidatorService.get_tasks_locked_by_user(
            project_id, reset_tasks, user_id
        )

        dtos = []
        for task_to_unlock in tasks_to_unlock:
            task = task_to_unlock["task"]

            if task_to_unlock["comment"]:
                # Parses comment to see if any users have been @'d
                MessageService.send_message_after_comment(
                    user_id, task_to_unlock["comment"], task.id, project_id
                )

            task.reset_lock(user_id, task_to_unlock["comment"])
            dtos.append(
                task.as_dto_with_instructions(stop_validating_dto.preferred_locale)
            )

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def get_tasks_locked_by_user(project_id: int, unlock_tasks, user_id: int):
        """
        Returns tasks specified by project id and unlock_tasks list if found and locked for validation by user,
        otherwise raises ValidatorServiceError, NotFound
        :param project_id:
        :param unlock_tasks: List of tasks to be unlocked
        :param user_id:
        :return: List of Tasks
        :raises ValidatorServiceError
        :raises NotFound
        """
        tasks_to_unlock = []
        # Loop supplied tasks to check they can all be unlocked
        for unlock_task in unlock_tasks:
            task = Task.get(unlock_task.task_id, project_id)

            if task is None:
                raise NotFound(f"Task {unlock_task.task_id} not found")

            current_state = TaskStatus(task.task_status)
            if current_state != TaskStatus.LOCKED_FOR_VALIDATION:
                raise ValidatorServiceError(
                    f"NotLockedForValidation- Task {unlock_task.task_id} is not LOCKED_FOR_VALIDATION"
                )

            if task.locked_by != user_id:
                raise ValidatorServiceError(
                    "TaskNotOwned- Attempting to unlock a task owned by another user"
                )

            if hasattr(unlock_task, "status"):
                # we know what status we ate going to be setting to on unlock
                new_status = TaskStatus[unlock_task.status]
            else:
                new_status = None

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
    def get_mapped_tasks_by_user(project_id: int) -> MappedTasks:
        """Get all mapped tasks on the project grouped by user"""
        mapped_tasks = Task.get_mapped_tasks_by_user(project_id)
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
            page, page_size, True
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
    def invalidate_all_tasks(project_id: int, user_id: int):
        """Invalidates all mapped tasks on a project"""
        mapped_tasks = Task.query.filter(
            Task.project_id == project_id,
            ~Task.task_status.in_(
                [TaskStatus.READY.value, TaskStatus.BADIMAGERY.value]
            ),
        ).all()
        for task in mapped_tasks:
            if TaskStatus(task.task_status) not in [
                TaskStatus.LOCKED_FOR_MAPPING,
                TaskStatus.LOCKED_FOR_VALIDATION,
            ]:
                # Only lock tasks that are not already locked to avoid double lock issue.
                task.lock_task_for_validating(user_id)
            task.unlock_task(user_id, new_state=TaskStatus.INVALIDATED)

        # Reset counters
        project = ProjectService.get_project_by_id(project_id)
        project.tasks_mapped = 0
        project.tasks_validated = 0
        project.save()

    @staticmethod
    def validate_all_tasks(project_id: int, user_id: int):
        """Validates all mapped tasks on a project"""
        tasks_to_validate = Task.query.filter(
            Task.project_id == project_id,
            Task.task_status != TaskStatus.BADIMAGERY.value,
        ).all()

        for task in tasks_to_validate:
            task.mapped_by = task.mapped_by or user_id  # Ensure we set mapped by value
            if TaskStatus(task.task_status) not in [
                TaskStatus.LOCKED_FOR_MAPPING,
                TaskStatus.LOCKED_FOR_VALIDATION,
            ]:
                # Only lock tasks that are not already locked to avoid double lock issue
                task.lock_task_for_validating(user_id)

            task.unlock_task(user_id, new_state=TaskStatus.VALIDATED)

        # Set counters to fully mapped and validated
        project = ProjectService.get_project_by_id(project_id)
        project.tasks_mapped = project.total_tasks - project.tasks_bad_imagery
        project.tasks_validated = project.total_tasks
        project.save()

    @staticmethod
    def get_task_mapping_issues(task_to_unlock: dict):
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
