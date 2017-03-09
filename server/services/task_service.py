from flask import current_app
from server.models.project import Task


class TaskServiceError(Exception):
    """
    Custom Exception to notify callers an error occurred when handling Task
    """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class TaskService:

    @staticmethod
    def set_locked_status(task_id, project_id, is_locked):
        """
        Sets the task_locked status to locked or unlocked
        :param task_id: Task ID in scope
        :param project_id: Project ID in scope
        :param is_locked: True for locked, False for unlocked
        :raises TaskServiceError
        :return: Updated task, or None if not found
        """
        task = Task.get(project_id, task_id)

        if task is None:
            return None

        if task.task_locked and is_locked:
            raise TaskServiceError(f'Task: {task_id} Project {project_id} is already locked')

        task.task_locked = is_locked
        task.update()
        return task
