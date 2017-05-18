from flask_restful import Resource, current_app, request
from server.models.dtos.grid_dto import SplitTaskDTO
from schematics.exceptions import DataError
from server.services.authentication_service import token_auth, tm
from server.models.postgis.utils import NotFound
from server.services.split_service import SplitService, SplitServiceError


class SplitTaskAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Split a task
        ---
        tags:
            - splitting
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
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
                description: Task split OK
            400:
                description: Client Error
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            split_task_dto = SplitTaskDTO()
            split_task_dto.user_id = tm.authenticated_user_id
            split_task_dto.project_id = project_id
            split_task_dto.task_id = task_id
            split_task_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400
        try:
            tasks = SplitService.split_task(split_task_dto)
            return tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except SplitServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Task Split API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
