from typing import Optional
from flask import current_app
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.project import Project, ProjectStatus
from server.models.dtos.project_dto import ProjectDTO
from server.models.dtos.mapping_dto import TaskDTO, MappedTaskDTO


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

    def get_task_as_dto(self, task_id: int, project_id: int) -> Optional[TaskDTO]:
        """ Get task as DTO for transmission over API """
        task = Task.get(task_id, project_id)

        if task is None:
            return None

        return task.as_dto()

    def lock_task_for_mapping(self, task_id, project_id) -> Optional[TaskDTO]:
        """
        Sets the task_locked status to locked so no other user can work on it
        :param task_id: Task ID in scope
        :param project_id: Project ID in scope
        :raises TaskServiceError
        :return: Updated task, or None if not found
        """
        task = Task.get(task_id, project_id)

        if task is None:
            return None

        if task.task_locked:
            raise MappingServiceError(f'Task: {task_id} Project {project_id} is already locked')

        current_state = TaskStatus(task.task_status).name
        if current_state not in [TaskStatus.READY.name, TaskStatus.INVALIDATED.name]:
            raise MappingServiceError(f'Cannot lock task {task_id} state must be in {TaskStatus.READY.name},'
                                      f' {TaskStatus.INVALIDATED.name}')

        # TODO user can only have 1 tasked locked at a time

        task.lock_task()
        return task.as_dto()

    def unlock_task_after_mapping(self, mapped_task: MappedTaskDTO) -> Optional[TaskDTO]:
        """ Unlocks the task and sets the task history appropriately """
        task = Task.get(mapped_task.task_id, mapped_task.project_id)

        if task is None:
            return None

        if not task.task_locked:
            return task.as_dto()  # Task is already unlocked, so return without any further processing

        # TODO check user owns lock
        if TaskStatus(task.task_status) == TaskStatus.DONE:
            raise MappingServiceError('Cannot unlock DONE task')

        new_state = TaskStatus[mapped_task.state.upper()]

        task.unlock_task(new_state, mapped_task.comment)
        return task.as_dto()
