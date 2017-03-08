from server.models.project import Task

class TaskService:

    def set_locked_status(self, task_id, locked):

        task = Task.query.get(task_id)