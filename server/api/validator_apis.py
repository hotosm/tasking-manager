from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.validator_dto import LockForValidationDTO, UnlockAfterValidationDTO
from server.services.users.authentication_service import token_auth, tm
from server.services.validator_service import ValidatorService, NotFound, ValidatatorServiceError, UserLicenseError


class LockTasksForValidationAPI(Resource):

    @tm.pm_only(False)
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
            409:
                description: User has not accepted license terms of project
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
            tasks = ValidatorService.lock_tasks_for_validation(validator_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError as e:
            return {"Error": str(e)}, 403
        except NotFound as e:
            return {"Error": str(e)}, 404
        except UserLicenseError:
            return {"Error": "User not accepted license terms"}, 409
        except Exception as e:
            error_msg = f'Validator Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class StopValidatingAPI(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id):
        """
        Unlock tasks that are locked for validation resetting them to their last status
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
            403:
                description: Forbidden
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
            tasks = ValidatorService.stop_validating_tasks(validated_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError as e:
            return {"Error": str(e)}, 403
        except NotFound as e:
            return {"Error": str(e)}, 404
        except Exception as e:
            error_msg = f'Stop Validating API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

class UnlockTasksAfterValidationAPI(Resource):

    @tm.pm_only(False)
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
            403:
                description: Forbidden
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
            tasks = ValidatorService.unlock_tasks_after_validation(validated_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError as e:
            return {"Error": str(e)}, 403
        except NotFound as e:
            return {"Error": str(e)}, 404
        except Exception as e:
            error_msg = f'Validator Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class MappedTasksByUser(Resource):

    def get(self, project_id):
        """
        Get mapped tasks grouped by user
        ---
        tags:
            - validation
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task user is working on
            404:
                description: No mapped tasks
            500:
                description: Internal Server Error
        """
        try:
            mapped_tasks = ValidatorService.get_mapped_tasks_by_user(project_id)
            return mapped_tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "No mapped tasks"}, 404
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500