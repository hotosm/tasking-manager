from typing import Optional
from flask import current_app
from server.models.postgis.task import Task, TaskStatus, TaskHistory, TaskAction
from server.models.postgis.project import Project, ProjectStatus
from server.models.dtos.task_dto import TaskDTO


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

    def get_project_dto_for_mapper(self, project_id: int, locale='en'):
        """ Get the project as DTO for mappers """
        try:
            project = Project()
            project_dto = project.as_dto_for_mapper(project_id, locale)
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

        self._set_task_history(task=task, action=TaskAction.LOCKED)
        task.lock_task()

        return task.as_dto()

    def unlock_task_after_mapping(self, task_id, project_id, state, comment=None):
        """
        Unlocks the task and sets the task history appropriately
        :param task_id: Selected Task
        :param project_id: Project ID associated with Task
        :param state: The current state of the task (this could be the same as the existing state)
        :param comment: Comment user has provided about the task
        """
        task = Task.get(task_id, project_id)

        if task is None:
            return None

        if not task.task_locked:
            return task  # Task is already unlocked, so return without any further processing

        try:
            new_state = TaskStatus[state.upper()]
        except KeyError:
            raise MappingServiceError(
                f'Unknown status: {state} Valid values are {TaskStatus.BADIMAGERY.name}, {TaskStatus.DONE.name}, '
                f'{TaskStatus.INVALIDATED.name}, {TaskStatus.VALIDATED.name}')

        if comment:
            # TODO need to clean comment to avoid injection attacks, maybe just raise error if html detected
            self._set_task_history(task=task, action=TaskAction.COMMENT, comment=comment)

        if TaskStatus(task.task_status) != new_state:
            self._set_task_history(task=task, action=TaskAction.STATE_CHANGE, new_state=new_state)
            task.task_status = new_state.value

        task.unlock_task()
        return task.as_dto()

    @staticmethod
    def _set_task_history(task, action, comment=None, new_state=None):
        """
        Sets the task history for the action that the user has just performed
        :param task: Task in scope
        :param action: Action the user has performed
        :param comment: Comment user has added
        :param new_state: New state of the task
        """
        history = TaskHistory(task.id, task.project_id)

        if action == TaskAction.LOCKED:
            history.set_task_locked_action()
        elif action == TaskAction.COMMENT:
            history.set_comment_action(comment)
        elif action == TaskAction.STATE_CHANGE:
            history.set_state_change_action(new_state)

        task.task_history.append(history)
