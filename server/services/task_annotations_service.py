from server import db
from server.models.postgis.project import Project
from server.models.postgis.task import Task
from server.models.postgis.task_annotation import TaskAnnotation
from server.models.postgis.utils import timestamp, NotFound
from server.services.project_service import ProjectService


class TaskAnnotationsService:
    @staticmethod
    def create_task_annotations(project_id: int):
        """ Takes a json of tasks and create annotations in the db """
        pass

    @staticmethod
    def get_task_annotations(project_id: int):
        """ Get all the task annotations """
        pass
