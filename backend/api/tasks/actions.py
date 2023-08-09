from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from backend.exceptions import NotFound
from backend.models.dtos.grid_dto import SplitTaskDTO
from backend.models.postgis.utils import InvalidGeoJson
from backend.services.grid.split_service import SplitService, SplitServiceError
from backend.services.users.user_service import UserService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import token_auth, tm
from backend.models.dtos.validator_dto import (
    LockForValidationDTO,
    UnlockAfterValidationDTO,
    StopValidationDTO,
    RevertUserTasksDTO,
)
from backend.services.validator_service import (
    ValidatorService,
    ValidatorServiceError,
    UserLicenseError,
)
from backend.models.dtos.mapping_dto import (
    LockTaskDTO,
    StopMappingTaskDTO,
    MappedTaskDTO,
    ExtendLockTimeDTO,
)
from backend.services.mapping_service import MappingService, MappingServiceError


class TasksActionsMappingLockAPI(Resource):
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Locks a task for mapping
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
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: Unique task ID
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
            lock_task_dto.user_id = token_auth.current_user()
            lock_task_dto.project_id = project_id
            lock_task_dto.task_id = task_id
            lock_task_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            lock_task_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to lock task", "SubCode": "InvalidData"}, 400

        try:
            ProjectService.exists(project_id)  # Check if project exists
            task = MappingService.lock_task_for_mapping(lock_task_dto)
            return task.to_primitive(), 200
        except MappingServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
        except UserLicenseError:
            return {
                "Error": "User not accepted license terms",
                "SubCode": "UserLicenseError",
            }, 409


class TasksActionsMappingStopAPI(Resource):
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Unlock a task that is locked for mapping resetting it to its last status
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
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: Unique task ID
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
            stop_task = StopMappingTaskDTO(
                request.get_json() if request.is_json else {}
            )
            stop_task.user_id = token_auth.current_user()
            stop_task.task_id = task_id
            stop_task.project_id = project_id
            stop_task.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            stop_task.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed", "SubCode": "InvalidData"}, 400

        try:
            ProjectService.exists(project_id)  # Check if project exists
            task = MappingService.stop_mapping_task(stop_task)
            return task.to_primitive(), 200
        except MappingServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class TasksActionsMappingUnlockAPI(Resource):
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Set a task as mapped
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
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: Unique task ID
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
            authenticated_user_id = token_auth.current_user()
            mapped_task = MappedTaskDTO(request.get_json())
            mapped_task.user_id = authenticated_user_id
            mapped_task.task_id = task_id
            mapped_task.project_id = project_id
            mapped_task.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed", "SubCode": "InvalidData"}, 400

        try:
            ProjectService.exists(project_id)  # Check if project exists
            task = MappingService.unlock_task_after_mapping(mapped_task)
            return task.to_primitive(), 200
        except MappingServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
        except NotFound as e:
            return e.to_dict()
        except Exception as e:
            error_msg = f"Task Lock API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {
                "Error": "Task unlock failed",
                "SubCode": "InternalServerError",
            }, 500
        finally:
            # Refresh mapper level after mapping
            UserService.check_and_update_mapper_level(authenticated_user_id)


class TasksActionsMappingUndoAPI(Resource):
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Undo a task's mapping status
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
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: Unique task ID
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
            ProjectService.exists(project_id)  # Check if project exists
            task = MappingService.undo_mapping(
                project_id, task_id, token_auth.current_user(), preferred_locale
            )
            return task.to_primitive(), 200
        except MappingServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class TasksActionsValidationLockAPI(Resource):
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
              description: Project ID the tasks are associated with
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
            validator_dto.user_id = token_auth.current_user()
            validator_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            validator_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to lock task", "SubCode": "InvalidData"}, 400

        try:
            ProjectService.exists(project_id)  # Check if project exists
            tasks = ValidatorService.lock_tasks_for_validation(validator_dto)
            return tasks.to_primitive(), 200
        except ValidatorServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
        except UserLicenseError:
            return {
                "Error": "User not accepted license terms",
                "SubCode": "UserLicenseError",
            }, 409


class TasksActionsValidationStopAPI(Resource):
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
              description: Project ID the task is associated with
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
            validated_dto.user_id = token_auth.current_user()
            validated_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            validated_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed", "SubCode": "InvalidData"}, 400

        try:
            ProjectService.exists(project_id)  # Check if project exists
            tasks = ValidatorService.stop_validating_tasks(validated_dto)
            return tasks.to_primitive(), 200
        except ValidatorServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class TasksActionsValidationUnlockAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Set tasks as validated
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
              description: Project ID the task is associated with
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
            validated_dto.user_id = token_auth.current_user()
            validated_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            validated_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Task unlock failed", "SubCode": "InvalidData"}, 400

        try:
            ProjectService.exists(project_id)  # Check if project exists
            tasks = ValidatorService.unlock_tasks_after_validation(validated_dto)
            return tasks.to_primitive(), 200
        except ValidatorServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class TasksActionsMapAllAPI(Resource):
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
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All tasks mapped
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        MappingService.map_all_tasks(project_id, authenticated_user_id)
        return {"Success": "All tasks mapped"}, 200


class TasksActionsValidateAllAPI(Resource):
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
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All mapped tasks validated
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        ValidatorService.validate_all_tasks(project_id, authenticated_user_id)
        return {"Success": "All tasks validated"}, 200


class TasksActionsInvalidateAllAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Invalidate all validated tasks on a project
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
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All validated tasks invalidated
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        ValidatorService.invalidate_all_tasks(project_id, authenticated_user_id)
        return {"Success": "All tasks invalidated"}, 200


class TasksActionsResetBadImageryAllAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Set all bad imagery tasks as ready for mapping
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
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All bad imagery tasks marked ready for mapping
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        MappingService.reset_all_badimagery(project_id, authenticated_user_id)
        return {"Success": "All bad imagery tasks marked ready for mapping"}, 200


class TasksActionsResetAllAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Reset all tasks on project back to ready, preserving history
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
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All tasks reset
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        ProjectAdminService.reset_all_tasks(project_id, authenticated_user_id)
        return {"Success": "All tasks reset"}, 200


class TasksActionsSplitAPI(Resource):
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
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: Unique task ID
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
            split_task_dto.user_id = token_auth.current_user()
            split_task_dto.project_id = project_id
            split_task_dto.task_id = task_id
            split_task_dto.preferred_locale = request.environ.get(
                "HTTP_ACCEPT_LANGUAGE"
            )
            split_task_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to split task", "SubCode": "InvalidData"}, 400
        try:
            ProjectService.exists(project_id)  # Check if project exists
            tasks = SplitService.split_task(split_task_dto)
            return tasks.to_primitive(), 200
        except SplitServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
        except InvalidGeoJson as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class TasksActionsExtendAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Extends duration of locked tasks
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
              description: Project ID the tasks are associated with
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
                          description: Array of taskIds to extend time for
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
            extend_dto = ExtendLockTimeDTO(request.get_json())
            extend_dto.project_id = project_id
            extend_dto.user_id = token_auth.current_user()
            extend_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Unable to extend lock time",
                "SubCode": "InvalidData",
            }, 400

        try:
            ProjectService.exists(project_id)  # Check if project exists
            MappingService.extend_task_lock_time(extend_dto)
            return {"Success": "Successfully extended task expiry"}, 200
        except MappingServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class TasksActionsReverUserTaskstAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Revert tasks by a specific user in a project
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
              default: Token session
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - in: path
              name: project_id
              description: Project ID the tasks are associated with
              required: true
              type: integer
              default: 1
            - in: query
              name: username
              description: Username to revert tasks for
              required: true
              type: string
              default: test
            - in: query
              name: action
              description: Action to revert tasks for. Can be BADIMAGERY or VALIDATED
              required: true
              type: string
        responses:
            200:
                description: Tasks reverted
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
            revert_dto = RevertUserTasksDTO()
            revert_dto.project_id = project_id
            revert_dto.action = request.args.get("action")
            user = UserService.get_user_by_username(request.args.get("username"))
            revert_dto.user_id = user.id
            revert_dto.action_by = token_auth.current_user()
            revert_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Unable to revert tasks",
                "SubCode": "InvalidData",
            }, 400
        try:
            ValidatorService.revert_user_tasks(revert_dto)
            return {"Success": "Successfully reverted tasks"}, 200
        except ValidatorServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
