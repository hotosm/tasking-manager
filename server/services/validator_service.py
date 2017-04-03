from flask import current_app
from typing import List
from server.models.dtos.mapping_dto import TaskDTOs
from server.models.dtos.validator_dto import LockForValidationDTO, UnlockAfterValidationDTO
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.utils import NotFound
from server.services.project_service import ProjectService


class ValidatatorServiceError(Exception):
    """ Custom exception to notify callers that error has occurred """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ValidatorService:

    tasks_for_validating = []
    tasks_to_unlock = []
    project_service = None

    @classmethod
    def for_validating(cls, task_ids: List[int], project_id: int, project_service=None):
        """
        Constructs service for tasks user wants to validate
        :param task_ids: Task Ids selected for validation
        :param project_id: Project in scope
        :param project_service: Injectable projectService for unit testing
        :raises NotFound it task doesn't exist on project
        """
        for task_id in task_ids:
            task = Task.get(task_id, project_id)

            if task is None:
                raise NotFound(f'Task {task_id} not found')

            cls.tasks_for_validating.append(task)

            if project_service is None:
                cls.project_service = ProjectService.from_project_id(project_id)
            else:
                cls.project_service = project_service

            return cls()

    @classmethod
    def for_unlocking(cls, dto: UnlockAfterValidationDTO):
        for validated_task in dto.validated_tasks:
            task = Task.get(validated_task.task_id, dto.project_id)

            if task is None:
                raise NotFound(f'Task {validated_task.task_id} not found')

            service = cls()
            cls.tasks_to_unlock.append(dict(task=task, new_state=TaskStatus[validated_task.status],
                                            comment=validated_task.comment))

        return service

    def lock_tasks_for_validation(self, validation_dto: LockForValidationDTO) -> TaskDTOs:
        """
        Lock supplied tasks for validation
        :raises ValidatatorServiceError
        """
        # Loop supplied tasks to check they can all be locked for validation
        for task in self.tasks_for_validating:
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

    def unlock_tasks_after_validation(self, validated_dto: UnlockAfterValidationDTO) -> TaskDTOs:
        """
        Unlocks supplied tasks after validation
        :raises ValidatatorServiceError
        """
        # Loop supplied tasks to check they can all be unlocked after validation
        for validated_task in self.tasks_to_unlock:
            if TaskStatus(validated_task.task_status) not in [TaskStatus.DONE, TaskStatus.VALIDATED]:
                raise ValidatatorServiceError(f'Task {validated_task.id} is not DONE or VALIDATED')

            if not validated_task.task_locked:
                raise ValidatatorServiceError(f'Task: {validated_task.id} is not locked')

            if validated_task.lock_holder_id != validated_dto.user_id:
                raise ValidatatorServiceError('Attempting to unlock a task owned by another user')

        # Unlock all tasks
        dtos = []
        for task_to_unlock in self.tasks_to_unlock:
            task = task_to_unlock['task']
            task.unlock_task(validated_dto.user_id, task_to_unlock['new_state'], task_to_unlock['comment'])
            dtos.append(task.as_dto())

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos
