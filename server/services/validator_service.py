from flask import current_app
from server.models.dtos.validator_dto import LockForValidationDTO
from server.models.postgis.task import Task


class TaskNotFound(Exception):
    """ Custom exception to notify callers that a requested mapping task was not found"""
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ValidatorService:

    def lock_tasks_for_validation(self, validation_dto: LockForValidationDTO):
        """ Lock provides tasks for validation """

        for task_id in validation_dto.task_ids:
            task = Task.get(task_id, validation_dto.project_id)
            if task is None:
                raise TaskNotFound(f'Task {task_id} not found')

