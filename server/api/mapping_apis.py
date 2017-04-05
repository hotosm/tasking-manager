from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError
from server.models.dtos.mapping_dto import MappedTaskDTO, LockTaskDTO
from server.services.authentication_service import token_auth, tm
from server.services.mapping_service import MappingService, MappingServiceError, NotFound


class MappingTaskAPI(Resource):

    def get(self, project_id, task_id):
        """
        Get task for mapping
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
                description: Task found
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            task = MappingService.get_task_as_dto(task_id, project_id)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except Exception as e:
            error_msg = f'Task GET API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class LockTaskForMappingAPI(Resource):

    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Locks the task for mapping
        ---
        tags:
            - mapping
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
                description: Task locked
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
            lock_task_dto = LockTaskDTO()
            lock_task_dto.user_id = tm.authenticated_user_id
            lock_task_dto.project_id = project_id
            lock_task_dto.task_id = task_id
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            task = MappingService.lock_task_for_mapping(lock_task_dto)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class UnlockTaskForMappingAPI(Resource):

    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Unlocks the task after mapping completed
        ---
        tags:
            - mapping
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
            - in: body
              name: body
              required: true
              description: JSON object for unlocking a task
              schema:
                  id: TaskUpdate
                  required:
                      - status
                  properties:
                      status:
                          type: string
                          description: The new status for the task
                          default: DONE
                      comment:
                          type: string
                          description: Optional user comment about the task
                          default: Mapping makes me feel good!
        responses:
            200:
                description: Task unlocked
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
            mapped_task = MappedTaskDTO(request.get_json())
            mapped_task.user_id = tm.authenticated_user_id
            mapped_task.task_id = task_id
            mapped_task.project_id = project_id
            mapped_task.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            task = MappingService.unlock_task_after_mapping(mapped_task)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
