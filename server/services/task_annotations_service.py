from server import db
from server.models.postgis.project import Project
from server.models.postgis.task import Task
from server.models.postgis.task_annotation import TaskAnnotation
from server.models.postgis.utils import timestamp, NotFound
from server.services.project_service import ProjectService


class TaskAnnotationsService:
    @staticmethod
    def add_or_update_annotation(annotation, project_id, annotation_type):
        """ Takes a json of tasks and create annotations in the db """

        task_id = annotation['taskId']
        source = annotation.get('annotationSource', None)
        markdown = annotation.get('annotationMarkdown', None)
        task_annotation = TaskAnnotation(task_id, project_id, annotation_type, annotation['properties'], source, markdown)

        # check if the task has this annotation_type
        existing_annotation = TaskAnnotation.get_task_annotation(task_id, project_id, annotation_type)
        if (existing_annotation):
            # update this annotation
            existing_annotation.properties = task_annotation.properties
            existing_annotation.updated_timestamp = timestamp()
            existing_annotation.update()
        else:
            # add this annotation
            task_annotation.create()
