from flask_restful import Resource, current_app, request
from server.models.dtos.validator_dto import LockForValidationDTO, UnlockAfterValidationDTO
from schematics.exceptions import DataError
from server.services.authentication_service import token_auth, tm
from server.services.validator_service import ValidatorService, TaskNotFound, ValidatatorServiceError


class LockTasksForValidationAPI(Resource):

    @token_auth.login_required
    def post(self, project_id):
        """
        Lock tasks for validation
        ---
        tags:
            - validation
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
              description: The ID of the project the tasks are associated with
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for locking task(s)
              schema:
                  properties:
                      taskIds:
                          type: array
                          items:
                              type: integer
                          description: Array of taskIds for locking
                          default: [1,2]
        responses:
            200:
                description: Task(s) locked for validation
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
            validator_dto = LockForValidationDTO(request.get_json())
            validator_dto.project_id = project_id
            validator_dto.user_id = tm.authenticated_user_id
            validator_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            tasks = ValidatorService().lock_tasks_for_validation(validator_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError as e:
            return {"Error": str(e)}, 403
        except TaskNotFound as e:
            return {"Error": str(e)}, 404
        except Exception as e:
            error_msg = f'Validator Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class UnlockTasksAfterValidationAPI(Resource):

    @token_auth.login_required
    def post(self, project_id):
        """
        Unlocks tasks after validation completed
        ---
        tags:
            - validation
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
            - in: body
              name: body
              required: true
              description: JSON object for unlocking a task
              schema:
                  properties:
                      validatedTasks:
                          type: array
                          items:
                              schema:
                                  $ref: "#/definitions/ValidatedTask"
        responses:
            200:
                description: Task unlocked
            400:
                description: Client Error
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            validated_dto = UnlockAfterValidationDTO(request.get_json())
            validated_dto.project_id = project_id
            validated_dto.user_id = tm.authenticated_user_id
            validated_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            tasks = ValidatorService().unlock_tasks_after_validation(validated_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError as e:
            return {"Error": str(e)}, 400
        except TaskNotFound as e:
            return {"Error": str(e)}, 404
        except Exception as e:
            error_msg = f'Validator Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
