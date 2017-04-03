from typing import Optional
from flask import current_app
from server.models.dtos.project_dto import ProjectDTO
from server.models.dtos.mapping_dto import TaskDTO, MappedTaskDTO, LockTaskDTO
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.project import Project, ProjectStatus
from server.models.postgis.utils import NotFound


class DatabaseError(Exception):
    """ Custom exception to notify callers error occurred with database"""
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MappingServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MappingService:

    task = None

    def __init__(self, task_id: int, project_id: int):
        """
        Constructs service for task user wants to map
        :param task_id: ID of the task to map
        :param project_id: ID of project task is associated with
        :raises NotFound if task doesn't exist in the DB
        """
        self.task = Task.get(task_id, project_id)

        if self.task is None:
            raise NotFound()

    def get_project_dto_for_mapper(self, project_id: int, locale='en') -> Optional[ProjectDTO]:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises DatabaseError, MappingServiceError
        """
        try:
            project = Project()
            project_dto = project.as_dto_for_mapping(project_id, locale)
        except Exception as e:
            raise DatabaseError(f'Error getting project {project_id} - {str(e)}')

        if project_dto is None:
            return None

        if project_dto.project_status != ProjectStatus.PUBLISHED.name:
            raise MappingServiceError(f'Project {project_id} is not published')

        return project_dto

    def get_task_as_dto(self) -> TaskDTO:
        """ Get task as DTO for transmission over API """
        return self.task.as_dto()

    def lock_task_for_mapping(self, lock_task_dto: LockTaskDTO) -> TaskDTO:
        """
        Sets the task_locked status to locked so no other user can work on it
        :param lock_task_dto: DTO with data needed to lock the task
        :raises TaskServiceError
        :return: Updated task, or None if not found
        """
        if self.task.task_locked:
            raise MappingServiceError(f'Task: {self.task.id} Project {self.task.project_id} is already locked')

        current_state = TaskStatus(self.task.task_status).name
        if current_state not in [TaskStatus.READY.name, TaskStatus.INVALIDATED.name, TaskStatus.BADIMAGERY.name]:
            raise MappingServiceError(f'Cannot lock task {self.task.id} state must be in {TaskStatus.READY.name},'
                                      f' {TaskStatus.INVALIDATED.name}, {TaskStatus.BADIMAGERY.name}')

        # TODO check if allowed user for private project
        # TODO check level if enforce mapper level

        if Project.has_user_already_locked_task(self.task.project_id, lock_task_dto.user_id):
            raise MappingServiceError('User already has a locked task on this project')

        self.task.lock_task(lock_task_dto.user_id)
        return self.task.as_dto()

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
