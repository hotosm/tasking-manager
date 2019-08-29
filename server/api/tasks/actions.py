from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.grid_dto import SplitTaskDTO
from server.models.postgis.utils import NotFound
from server.services.grid.split_service import SplitService, SplitServiceError
from server.services.users.user_service import UserService
from server.services.project_admin_service import ProjectAdminService
from server.services.users.authentication_service import token_auth, tm
from server.models.dtos.validator_dto import (
    LockForValidationDTO,
    UnlockAfterValidationDTO,
    StopValidationDTO,
)
from server.services.validator_service import (
    ValidatorService,
    ValidatatorServiceError,
    UserLicenseError,
)
from server.models.dtos.mapping_dto import (
    LockTaskDTO,
    StopMappingTaskDTO,
    MappedTaskDTO,
)
from server.services.mapping_service import MappingService, MappingServiceError


class TasksActionsMappingLockAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Locks the task for mapping
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
            409:
                description: User has not accepted license terms of project
            500:
                description: Internal Server Error
        """
        try:
            lock_task_dto = LockTaskDTO()
            lock_task_dto.user_id = tm.authenticated_user_id
            lock_task_dto.project_id = project_id
            lock_task_dto.task_id = task_id
            lock_task_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            lock_task_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to lock task"}, 400

        try:
            task = MappingService.lock_task_for_mapping(lock_task_dto)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
        except UserLicenseError:
            return {"Error": "User not accepted license terms"}, 409
        except Exception as e:
            error_msg = f"Task Lock API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to lock task"}, 500


class TasksActionsMappingStopAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Unlock task that is locked for mapping resetting it to it's last status
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
                  id: TaskUpdateStop
                  properties:
                      comment:
                          type: string
                          description: Optional user comment about the task
                          default: Comment about mapping done before stop
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
            stop_task = StopMappingTaskDTO(request.get_json())
            stop_task.user_id = tm.authenticated_user_id
            stop_task.task_id = task_id
            stop_task.project_id = project_id
            stop_task.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            stop_task.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed"}, 400

        try:
            task = MappingService.stop_mapping_task(stop_task)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError:
            return {"Error": "Task unlock failed"}, 403
        except Exception as e:
            error_msg = f"Task Lock API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Task unlock failed"}, 500


class TasksActionsMappingUnlockAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Unlocks the task after mapping completed
        ---
        tags:
            - tasks
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
                  id: TaskUpdateUnlock
                  required:
                      - status
                  properties:
                      status:
                          type: string
                          description: The new status for the task
                          default: MAPPED
                      comment:
                          type: string
                          description: Optional user comment about the task
                          default: Comment about the mapping
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
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed"}, 400

        try:
            task = MappingService.unlock_task_after_mapping(mapped_task)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError:
            return {"Error": "Task unlock failed"}, 403
        except Exception as e:
            error_msg = f"Task Lock API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Task unlock failed"}, 500
        finally:
            # Refresh mapper level after mapping
            UserService.check_and_update_mapper_level(tm.authenticated_user_id)


class TasksActionsMappingUndoAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Get task for mapping
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
            403:
                description: Forbidden
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            task = MappingService.undo_mapping(
                project_id, task_id, tm.authenticated_user_id, preferred_locale
            )
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError:
            return {"Error": "User not permitted to undo task"}, 403
        except Exception as e:
            error_msg = f"Task GET API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to lock task"}, 500


class TasksActionsValidationLockAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id):
        """
        Lock tasks for validation
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
            validator_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            validator_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to lock task"}, 400

        try:
            tasks = ValidatorService.lock_tasks_for_validation(validator_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError:
            return {"Error": "Unable to lock task"}, 403
        except NotFound:
            return {"Error": "Task not found"}, 404
        except UserLicenseError:
            return {"Error": "User not accepted license terms"}, 409
        except Exception as e:
            error_msg = f"Validator Lock API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to lock task"}, 500


class TasksActionsValidatioStopAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id):
        """
        Unlock tasks that are locked for validation resetting them to their last status
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
                      resetTasks:
                          type: array
                          items:
                              schema:
                                  $ref: "#/definitions/ResetTask"
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
            validated_dto = StopValidationDTO(request.get_json())
            validated_dto.project_id = project_id
            validated_dto.user_id = tm.authenticated_user_id
            validated_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            validated_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed"}, 400

        try:
            tasks = ValidatorService.stop_validating_tasks(validated_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError:
            return {"Error": "Task unlock failed"}, 403
        except NotFound:
            return {"Error": "Task unlock failed"}, 404
        except Exception as e:
            error_msg = f"Stop Validating API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Task unlock failed"}, 500


class TasksActionsValidationUnlockAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id):
        """
        Unlocks tasks after validation completed
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
            validated_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            validated_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed"}, 400

        try:
            tasks = ValidatorService.unlock_tasks_after_validation(validated_dto)
            return tasks.to_primitive(), 200
        except ValidatatorServiceError:
            return {"Error": "Task unlock failed"}, 403
        except NotFound:
            return {"Error": "Task unlock failed"}, 404
        except Exception as e:
            error_msg = f"Validator Lock API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Task unlock failed"}, 500


class ProjectValidateAll(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Validate all mapped tasks on a project
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All mapped tasks validated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ValidatorService.validate_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks validated"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to validate tasks"}, 500


class ProjectInvalidateAll(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Invalidate all mapped tasks on a project
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All mapped tasks invalidated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ValidatorService.invalidate_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks invalidated"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to invalidate tasks"}, 500


class ProjectResetBadImagery(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Mark all bad imagery tasks ready for mapping
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All bad imagery tasks marked ready for mapping
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            MappingService.reset_all_badimagery(project_id, tm.authenticated_user_id)
            return {"Success": "All bad imagery tasks marked ready for mapping"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to reset tasks"}, 500


class ProjectResetAll(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Reset all tasks on project back to ready, preserving history.
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All tasks reset
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ProjectAdminService.reset_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks reset"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to reset tasks"}, 500


class TasksActionsMapAllAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Map all tasks on a project
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All tasks mapped
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            MappingService.map_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks mapped"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to mapall tasks"}, 500


class TasksActionsValidateAllAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Validate all mapped tasks on a project
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All mapped tasks validated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ValidatorService.validate_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks validated"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to validate all tasks"}, 500


class TasksActionsInvalidateAllAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Invalidate all mapped tasks on a project
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All mapped tasks invalidated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ValidatorService.invalidate_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks invalidated"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to invalidate all tasks"}, 500


class TasksActionsResetBadImageryAllAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Mark all bad imagery tasks ready for mapping
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All bad imagery tasks marked ready for mapping
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            MappingService.reset_all_badimagery(project_id, tm.authenticated_user_id)
            return {"Success": "All bad imagery tasks marked ready for mapping"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to reset tasks"}, 500


class TasksActionsResetAllAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Reset all tasks on project back to ready, preserving history.
        ---
        tags:
            - tasks
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All tasks reset
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ProjectAdminService.reset_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks reset"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to reset tasks"}, 500


class TasksActionsSplitAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Split a task
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
            split_task_dto.preferred_locale = request.environ.get(
                "HTTP_ACCEPT_LANGUAGE"
            )
            split_task_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to split task"}, 400
        try:
            tasks = SplitService.split_task(split_task_dto)
            return tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except SplitServiceError:
            return {"Error": "Unable to split task"}, 403
        except Exception as e:
            error_msg = f"Task Split API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to split task"}, 500
