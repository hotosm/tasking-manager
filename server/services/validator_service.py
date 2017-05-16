from flask import current_app
from server.models.dtos.mapping_dto import TaskDTOs
from server.models.dtos.validator_dto import LockForValidationDTO, UnlockAfterValidationDTO, MappedTasks
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.statuses import ValidatingNotAllowed
from server.models.postgis.utils import NotFound, UserLicenseError
from server.services.message_service import MessageService
from server.services.project_service import ProjectService
from server.services.stats_service import StatsService
from server.services.user_service import UserService


class ValidatatorServiceError(Exception):
    """ Custom exception to notify callers that error has occurred """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ValidatorService:

    @staticmethod
    def lock_tasks_for_validation(validation_dto: LockForValidationDTO) -> TaskDTOs:
        """
        Lock supplied tasks for validation
        :raises ValidatatorServiceError
        """
        # Loop supplied tasks to check they can all be locked for validation
        tasks_to_lock = []
        for task_id in validation_dto.task_ids:
            task = Task.get(task_id, validation_dto.project_id)

            if task is None:
                raise NotFound(f'Task {task_id} not found')

            if TaskStatus(task.task_status) not in [TaskStatus.MAPPED, TaskStatus.VALIDATED]:
                raise ValidatatorServiceError(f'Task {task_id} is not MAPPED or VALIDATED')

            if not ValidatorService._user_can_validate_task(validation_dto.user_id, task.mapped_by):
                raise ValidatatorServiceError(f'Tasks cannot be mapped and validated by the same user')

            tasks_to_lock.append(task)

        user_can_validate, error_reason = ProjectService.is_user_permitted_to_validate(validation_dto.project_id,
                                                                                       validation_dto.user_id)

        if not user_can_validate:
            if error_reason == ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE:
                raise UserLicenseError('User must accept license to map this task')
            else:
                raise ValidatatorServiceError(f'Mapping not allowed because: {error_reason.name}')

        # Lock all tasks for validation
        dtos = []
        for task in tasks_to_lock:
            task.lock_task_for_validating(validation_dto.user_id)
            dtos.append(task.as_dto())

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def _user_can_validate_task(user_id: int, mapped_by: int) -> bool:
        """
        check whether a user is able to validate a task.  Users cannot validate their own tasks unless they are a PM (admin counts as project manager too)
        :param user_id: id of user attempting to validate
        :param mapped_by: id of user who mapped the task
        :return: Boolean
        """
        is_project_manager = UserService.is_user_a_project_manager(user_id)
        mapped_by_me = (mapped_by == user_id)
        if is_project_manager or not mapped_by_me:
            return True
        return False


    @staticmethod
    def unlock_tasks_after_validation(validated_dto: UnlockAfterValidationDTO) -> TaskDTOs:
        """
        Unlocks supplied tasks after validation
        :raises ValidatatorServiceError
        """
        # Loop supplied tasks to check they can all be unlocked after validation
        tasks_to_unlock = []
        for validated_task in validated_dto.validated_tasks:
            task = Task.get(validated_task.task_id, validated_dto.project_id)

            if task is None:
                raise NotFound(f'Task {validated_task.task_id} not found')

            current_state = TaskStatus(task.task_status)
            if current_state != TaskStatus.LOCKED_FOR_VALIDATION:
                raise ValidatatorServiceError(f'Task {validated_task.task_id} is not LOCKED_FOR_VALIDATION')

            if task.locked_by != validated_dto.user_id:
                raise ValidatatorServiceError('Attempting to unlock a task owned by another user')

            tasks_to_unlock.append(dict(task=task, new_state=TaskStatus[validated_task.status],
                                        comment=validated_task.comment))

        # Unlock all tasks
        dtos = []
        for task_to_unlock in tasks_to_unlock:
            task = task_to_unlock['task']

            if task_to_unlock['comment']:
                # Parses comment to see if any users have been @'d
                MessageService.send_message_after_comment(validated_dto.user_id, task_to_unlock['comment'], task.id,
                                                          validated_dto.project_id)

            if task_to_unlock['new_state'] == TaskStatus.VALIDATED:
                # All mappers get a thankyou if their task has been validated :)
                MessageService.send_message_after_validation(validated_dto.user_id, task.mapped_by, task.id,
                                                             validated_dto.project_id)

            StatsService.update_stats_after_task_state_change(validated_dto.project_id, validated_dto.user_id,
                                                              task_to_unlock['new_state'], task.id)

            task.unlock_task(validated_dto.user_id, task_to_unlock['new_state'], task_to_unlock['comment'])

            dtos.append(task.as_dto())

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def get_mapped_tasks_by_user(project_id: int) -> MappedTasks:
        """ Get all mapped tasks on the project grouped by user"""
        mapped_tasks = Task.get_mapped_tasks_by_user(project_id)
        return mapped_tasks

    @staticmethod
    def invalidate_all_tasks(project_id: int, user_id: int):
        """ Invalidates all mapped tasks on a project"""
        Task.invalidate_all(project_id, user_id)

    @staticmethod
    def validate_all_tasks(project_id: int, user_id: int):
        """ Validates all mapped tasks on a project"""
        Task.validate_all(project_id, user_id)
