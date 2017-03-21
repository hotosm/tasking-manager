from flask import current_app
from server.models.dtos.task_dto import TaskDTOs
from server.models.dtos.validator_dto import LockForValidationDTO
from server.models.postgis.task import Task, TaskStatus, TaskAction


class TaskNotFound(Exception):
    """ Custom exception to notify callers that a requested mapping task was not found """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ValidatatorServiceError(Exception):
    """ Custom exception to notify callers that error has occurred """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ValidatorService:

    def lock_tasks_for_validation(self, validation_dto: LockForValidationDTO):
        """ Lock provides tasks for validation """

        # Loop supplied tasks to check they can all be locked for validation
        tasks_to_lock = []
        for task_id in validation_dto.task_ids:
            task = Task.get(task_id, validation_dto.project_id)

            if task is None:
                raise TaskNotFound(f'Task {task_id} not found')

            if TaskStatus(task.task_status) != TaskStatus.DONE:
                raise ValidatatorServiceError(f'Task {task_id} in not DONE')

            if task.task_locked:
                raise ValidatatorServiceError(f'Task: {task_id} is already locked')

            tasks_to_lock.append(task)

        # Lock all tasks for validation
        dtos = []
        for task in tasks_to_lock:
            task.lock_task()
            dtos.append(task.as_dto())

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

