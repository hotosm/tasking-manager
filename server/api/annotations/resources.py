from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError
from server.models.postgis.task import Task
from server.models.postgis.task_annotation import TaskAnnotation
from server.services.project_service import ProjectService, NotFound
from server.services.task_annotations_service import TaskAnnotationsService
from server.services.application_service import ApplicationService


class AnnotationsRestAPI(Resource):
    def get(self, project_id: int, annotation_type: str = None):
        """
        Get all task annotations for a project
        ---
        tags:
            - annotations
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The ID of the project
              required: true
              type: integer
            - name: annotation_type
              in: path
              description: The type of annotation to fetch
              required: false
              type: string
        responses:
            200:
                description: Project Annotations
            404:
                description: Project or annotations not found
            500:
                description: Internal Server Error
        """
        try:
            ProjectService.get_project_by_id(project_id)
        except NotFound as e:
            current_app.logger.error(f"Error validating project: {str(e)}")
            return {"Error": "Project not found"}, 404

        try:
            if annotation_type:
                annotations = TaskAnnotation.get_task_annotations_by_project_id_type(
                    project_id, annotation_type
                )
            else:
                annotations = TaskAnnotation.get_task_annotations_by_project_id(
                    project_id
                )
            return annotations.to_primitive(), 200
        except NotFound:
            return {"Error": "Annotations not found"}, 404

    def post(self, project_id: int, annotation_type: str):
        """
        Store new task annotations for tasks of a project
        ---
        tags:
            - annotations
        produces:
            - application/json
        parameters:
            - in: header
              name: Content-Type
              description: Content type for post body
              required: true
              type: string
              default: application/json
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
            - name: annotation_type
              in: path
              description: Annotation type
              required: true
              type: string
            - name: Application-Token
              in: header
              description: Application token registered with TM
              required: true
              type: string
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
              schema:
                projectId:
                    type: integer
                    required: true
                annotationType:
                    type: string
                    required: true
                tasks:
                    type: array
                    required: true
                    items:
                        schema:
                            taskId:
                                type: integer
                                required: true
                            annotationSource:
                                type: string
                            annotationMarkdown:
                                type: string
                            properties:
                                description: JSON object with properties
        responses:
            200:
                description: Project updated
            400:
                description: Client Error - Invalid Request
            404:
                description: Project or task not found
            500:
                description: Internal Server Error
        """

        if "Application-Token" in request.headers:
            application_token = request.headers["Application-Token"]
            try:
                is_valid_token = ApplicationService.check_token(  # noqa
                    application_token
                )
            except NotFound:
                current_app.logger.error(f"Invalid token")
                return {"Error": "Invalid token"}, 500
        else:
            current_app.logger.error(f"No token supplied")
            return {"Error": "No token supplied"}, 500

        try:
            annotations = request.get_json() or {}
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")

        try:
            ProjectService.get_project_by_id(project_id)
        except NotFound as e:
            current_app.logger.error(f"Error validating project: {str(e)}")

        task_ids = [t["taskId"] for t in annotations["tasks"]]

        # check if task ids are valid
        tasks = Task.get_tasks(project_id, task_ids)
        tasks_ids_db = [t.id for t in tasks]
        if len(task_ids) != len(tasks_ids_db):
            return {"Error": "Invalid task id"}, 500

        for annotation in annotations["tasks"]:
            try:
                TaskAnnotationsService.add_or_update_annotation(
                    annotation, project_id, annotation_type
                )
            except DataError as e:
                current_app.logger.error(f"Error creating annotations: {str(e)}")
                return {"Error": "Error creating annotations"}, 500

        return project_id, 200

    def put(self, project_id: int, task_id: int):
        """
        Update a single task's annotations
        """
        pass
