from flask import current_app
from server.models.project import Task


class TaskServiceError(Exception):
    """
    Custom Exception to notify callers an error occurred when handling Task
    """
    pass


class TaskService:

    @staticmethod
    def set_locked_status(task_id, project_id, is_locked):

        task = Task.query.filter_by(id=task_id, project_id=project_id).one_or_none()

        if task is None:
            return None

        if task.task_locked and is_locked:
            current_app.logger.error(f'Task: {task_id} Project {project_id} is already locked')
            raise TaskServiceError(f'Task is already Locked')

        task.task_locked = is_locked
        task.update()
        return task
