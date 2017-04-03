from flask import current_app
from typing import List
from server.models.dtos.mapping_dto import TaskDTOs
from server.models.dtos.validator_dto import LockForValidationDTO, UnlockAfterValidationDTO
from server.models.postgis.project import Project
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.utils import NotFound
from server.services.project_service import ProjectService
from server.services.user_service import UserService, UserRole


class ValidatatorServiceError(Exception):
    """ Custom exception to notify callers that error has occurred """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ValidatorService:

    tasks = []
    project_service = ProjectService

    def __init__(self, task_ids: List[int], project_id: int, project_service=None):
        for task_id in task_ids:
            task = Task.get(task_id, project_id)

            if task is None:
                raise NotFound(f'Task {task_id} not found')

            self.tasks.append(task)

            if project_service is None:
                self.project_service = ProjectService.from_project_id(project_id)
            else:
                self.project_service = project_service

    def lock_tasks_for_validation(self, validation_dto: LockForValidationDTO) -> TaskDTOs:
        """
        Lock supplied tasks for validation
        :raises ValidatatorServiceError
        """
        # Loop supplied tasks to check they can all be locked for validation
        for task in self.tasks:
            if TaskStatus(task.task_status) not in [TaskStatus.DONE, TaskStatus.VALIDATED]:
                raise ValidatatorServiceError(f'Task {task.id} is not DONE or VALIDATED')

            if task.task_locked:
                raise ValidatatorServiceError(f'Task: {task.id} is already locked')

        user_can_validate, error_message = self.project_service.is_user_permitted_to_validate(validation_dto.user_id)
        if not user_can_validate:
            raise ValidatatorServiceError(error_message)

        # Lock all tasks for validation
        dtos = []
        for task in self.tasks:
            task.lock_task(validation_dto.user_id)
            dtos.append(task.as_dto())

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def _validate_user_permissions(validation_dto: LockForValidationDTO):
        """ Check user has permission to validate on this project """
        project = Project.get(validation_dto.project_id)
        if project.enforce_validator_role and not UserService.is_user_validator(validation_dto.user_id):
            raise ValidatatorServiceError('User must be a validator to validate this project')

    def unlock_tasks_after_validation(self, validated_dto: UnlockAfterValidationDTO) -> TaskDTOs:
        """
        Unlocks supplied tasks after validation
        :raises ValidatatorServiceError
        """
        # Loop supplied tasks to check they can all be unlocked after validation
        tasks_to_unlock = []
        for validated_task in validated_dto.validated_tasks:
            task = Task.get(validated_task.task_id, validated_dto.project_id)

            if task is None:
                raise TaskNotFound(f'Task {validated_task.task_id} not found')

            if TaskStatus(task.task_status) not in [TaskStatus.DONE, TaskStatus.VALIDATED]:
                raise ValidatatorServiceError(f'Task {validated_task.task_id} is not DONE or VALIDATED')

            if not task.task_locked:
                raise ValidatatorServiceError(f'Task: {validated_task.task_id} is not locked')

            if task.lock_holder_id != validated_dto.user_id:
                raise ValidatatorServiceError('Attempting to unlock a task owned by another user')

            tasks_to_unlock.append(dict(task=task, new_state=TaskStatus[validated_task.status],
                                        comment=validated_task.comment))

        # Unlock all tasks
        dtos = []
        for task_to_unlock in tasks_to_unlock:
            task = task_to_unlock['task']
            task.unlock_task(validated_dto.user_id, task_to_unlock['new_state'], task_to_unlock['comment'])
            dtos.append(task.as_dto())

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos
