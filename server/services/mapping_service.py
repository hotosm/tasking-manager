from flask import current_app
from server.models.dtos.mapping_dto import TaskDTO, MappedTaskDTO, LockTaskDTO
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.utils import NotFound
from server.services.project_service import ProjectService


class MappingServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MappingService:

    task = None
    project_service = None

    def __init__(self, task_id: int, project_id: int, project_service=None):
        """
        Constructs service for task user wants to map
        :param task_id: ID of the task to map
        :param project_id: ID of project task is associated with
        :param project_service: Service is injectable to ease unit testing
        :raises NotFound if task doesn't exist in the DB
        """
        self.task = Task.get(task_id, project_id)

        if self.task is None:
            raise NotFound()

        if project_service is None:
            self.project_service = ProjectService.from_project_id(project_id)
        else:
            self.project_service = project_service

    @staticmethod
    def get_task(task_id: int, project_id: int):

        task = Task.get(task_id, project_id)

        if task is None:
            raise NotFound()

        return task

    @staticmethod
    def get_task_as_dto(task_id: int, project_id: int) -> TaskDTO:
        """ Get task as DTO for transmission over API """
        task = MappingService.get_task(task_id, project_id)
        return task.as_dto()

    @staticmethod
    def lock_task_for_mapping(lock_task_dto: LockTaskDTO) -> TaskDTO:
        """
        Sets the task_locked status to locked so no other user can work on it
        :param lock_task_dto: DTO with data needed to lock the task
        :raises TaskServiceError
        :return: Updated task, or None if not found
        """
        task = MappingService.get_task(lock_task_dto.task_id, lock_task_dto.project_id)

        if task.task_locked:
            raise MappingServiceError(f'Task: {task.id} Project {task.project_id} is already locked')

        current_state = TaskStatus(task.task_status).name
        if current_state not in [TaskStatus.READY.name, TaskStatus.INVALIDATED.name, TaskStatus.BADIMAGERY.name]:
            raise MappingServiceError(f'Cannot lock task {task.id} state must be in {TaskStatus.READY.name},'
                                      f' {TaskStatus.INVALIDATED.name}, {TaskStatus.BADIMAGERY.name}')

        user_can_map, error_message = ProjectService.is_user_permitted_to_map(lock_task_dto.project_id,
                                                                              lock_task_dto.user_id)
        if not user_can_map:
            raise MappingServiceError(error_message)

        task.lock_task(lock_task_dto.user_id)
        return task.as_dto()

    def unlock_task_after_mapping(self, mapped_task: MappedTaskDTO) -> TaskDTO:
        """ Unlocks the task and sets the task history appropriately """

        if not self.task.task_locked:
            return self.task.as_dto()  # Task is already unlocked, so return without any further processing

        if self.task.lock_holder_id != mapped_task.user_id:
            raise MappingServiceError('Attempting to unlock a task owned by another user')

        current_status = TaskStatus(self.task.task_status)
        new_state = TaskStatus[mapped_task.status.upper()]

        if current_status == TaskStatus.DONE:
            raise MappingServiceError('Cannot unlock DONE task')

        if current_status == TaskStatus.BADIMAGERY and new_state not in [TaskStatus.READY, TaskStatus.BADIMAGERY]:
            raise MappingServiceError(f'Cannot set BADIMAGERY to {current_status.name}')

        self.task.unlock_task(mapped_task.user_id, new_state, mapped_task.comment)
        return self.task.as_dto()
