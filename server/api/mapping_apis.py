from flask_restful import Resource, current_app, request
from server.services.project_service import ProjectService, ProjectServiceError, ProjectStoreError
from server.services.task_service import TaskService


class ProjectAPI(Resource):

    def get(self, project_id):
        """
        Retrieves a Tasking-Manager project
        ---
        tags:
            - mapping
        produces:
            - application/json
        parameters:
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project found
            400:
                description: Invalid request
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_service = ProjectService()
            project_dto = project_service.get_project_dto_for_mapper(project_id,
                                                                     request.environ.get('HTTP_ACCEPT_LANGUAGE'))

            if project_dto is None:
                return {"Error": "Project Not Found"}, 404

            return project_dto.to_primitive(), 200
        except ProjectServiceError as e:
            return {"error": str(e)}, 400
        except ProjectStoreError as e:
            return {"error": str(e)}, 500
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class LockTaskForMappingAPI(Resource):

    def post(self, project_id, task_id):
        """
        Locks the task for mapping
        ---
        tags:
            - mapping
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: The unique task ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task locked
            403:
                description: Task already locked
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            task = TaskService().lock_task_for_mapping(task_id, project_id)

            if task is None:
                return {"Error": "Task Not Found"}, 404

            return {"Status": "Success"}, 200
        except TaskServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500