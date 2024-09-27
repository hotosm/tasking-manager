from backend.exceptions import NotFound
from backend.models.dtos.grid_dto import SplitTaskDTO
from backend.models.postgis.utils import InvalidGeoJson
from backend.services.grid.split_service import SplitService, SplitServiceError
from backend.services.users.user_service import UserService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
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
from fastapi import APIRouter, Depends, Request
from starlette.authentication import requires
from loguru import logger

from backend.db import get_db
from databases import Database
from backend.services.users.authentication_service import login_required
from backend.models.dtos.user_dto import AuthUserDTO
from fastapi.responses import JSONResponse

router = APIRouter(
    prefix="/projects",
    tags=["tasks"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)


@router.post("/{project_id}/tasks/actions/lock-for-mapping/{task_id}/")
async def post(
    request: Request,
    project_id: int,
    task_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        lock_task_dto = LockTaskDTO(
            user_id=user.id,
            project_id=project_id,
            task_id=task_id,
            preferred_locale=request.headers.get("accept-language"),
        )
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": "Unable to lock task", "SubCode": "InvalidData"},
            status_code=400,
        )
    try:
        await ProjectService.exists(project_id, db)
        async with db.transaction():
            task = await MappingService.lock_task_for_mapping(lock_task_dto, db)
            return task
    except MappingServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )
    except UserLicenseError:
        return JSONResponse(
            {
                "Error": "User not accepted license terms",
                "SubCode": "UserLicenseError",
            },
            status_code=409,
        )


@router.post("/{project_id}/tasks/actions/stop-mapping/{task_id}/")
async def post(
    request: Request,
    project_id: int,
    task_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        request_data = await request.json()
        preferred_locale = request.headers.get("accept-language", None)
        stop_task = StopMappingTaskDTO(
            project_id=project_id,
            task_id=task_id,
            user_id=user.id,
            comment=request_data.get("comment", None),
        )
        if preferred_locale:
            stop_task.preferred_locale = preferred_locale

    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": "Task unlock failed", "SubCode": "InvalidData"}, 400
    try:
        await ProjectService.exists(project_id, db)
        async with db.transaction():
            task = await MappingService.stop_mapping_task(stop_task, db)
            return task
    except MappingServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


@router.post("/{project_id}/tasks/actions/unlock-after-mapping/{task_id}/")
async def post(
    request: Request,
    project_id: int,
    task_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        request_data = await request.json()
        mapped_task = MappedTaskDTO(
            user_id=user.id,
            project_id=project_id,
            task_id=task_id,
            status=request_data.get("status"),
            comment=request_data.get("comment", None),
        )
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": "Task unlock failed", "SubCode": "InvalidData"},
            status_code=400,
        )
    try:
        await ProjectService.exists(project_id, db)
        async with db.transaction():
            task = await MappingService.unlock_task_after_mapping(mapped_task, db)
            return task

    except MappingServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )
    except NotFound as e:
        return JSONResponse(
            content=e.to_dict(),
            status_code=404,
        )
    except Exception as e:
        logger.critical(f"Task Unlock API - unhandled error: {str(e)}")
        return JSONResponse(
            content={"Error": "Task unlock failed", "SubCode": "InternalServerError"},
            status_code=500,
        )
    finally:
        await UserService.check_and_update_mapper_level(user.id, db)


@router.post("/{project_id}/tasks/actions/undo-last-action/{task_id}/")
async def post(
    request: Request,
    project_id: int,
    task_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        preferred_locale = request.headers.get("accept-language", None)
        await ProjectService.exists(project_id, db)
        async with db.transaction():
            if preferred_locale:
                task = await MappingService.undo_mapping(
                    project_id, task_id, user.id, db, preferred_locale
                )
            else:
                task = await MappingService.undo_mapping(
                    project_id, task_id, user.id, db
                )
            return task
    except MappingServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


@router.post("/{project_id}/tasks/actions/lock-for-validation/")
async def post(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        request_data = await request.json()
        task_ids = request_data.get("taskIds")
        preferred_locale = request.headers.get("accept-language", None)
        validator_dto = LockForValidationDTO(
            project_id=project_id, task_ids=task_ids, user_id=user.id
        )
        if preferred_locale:
            validator_dto.preferred_locale = preferred_locale
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": "Unable to lock task", "SubCode": "InvalidData"}, 400

    try:
        await ProjectService.exists(project_id, db)
        async with db.transaction():
            tasks = await ValidatorService.lock_tasks_for_validation(validator_dto, db)
            return tasks
    except ValidatorServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
    except UserLicenseError:
        return {
            "Error": "User not accepted license terms",
            "SubCode": "UserLicenseError",
        }, 409


@router.post("/{project_id}/tasks/actions/stop-validation/")
async def post(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        request_data = await request.json()
        reset_tasks = request_data.get("resetTasks")
        preferred_locale = request.headers.get("accept-language", None)
        validated_dto = StopValidationDTO(
            project_id=project_id, user_id=user.id, reset_tasks=reset_tasks
        )
        if preferred_locale:
            validated_dto.preferred_locale = preferred_locale
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": "Task unlock failed", "SubCode": "InvalidData"}, 400
    try:
        await ProjectService.exists(project_id, db)
        async with db.transaction():
            tasks = await ValidatorService.stop_validating_tasks(validated_dto, db)
            return tasks
    except ValidatorServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


@router.post("/{project_id}/tasks/actions/unlock-after-validation/")
async def post(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        request_data = await request.json()
        validated_tasks = request_data.get("validatedTasks")
        preferred_locale = request.headers.get("accept-language", None)
        validated_dto = UnlockAfterValidationDTO(
            project_id=project_id, user_id=user.id, validated_tasks=validated_tasks
        )
        if preferred_locale:
            validated_dto.preferred_locale = preferred_locale
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": "Task unlock failed", "SubCode": "InvalidData"}, 400
    try:
        await ProjectService.exists(project_id, db)
        async with db.transaction():
            tasks = await ValidatorService.unlock_tasks_after_validation(
                validated_dto, db
            )
            return tasks
    except ValidatorServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


@router.post("/{project_id}/tasks/actions/map-all/")
async def post(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        authenticated_user_id = user.id
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id, db
        ):
            raise ValueError()
    except ValueError:
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403

    async with db.transaction():
        await MappingService.map_all_tasks(project_id, authenticated_user_id, db)
        return JSONResponse(content={"Success": "All tasks mapped"}, status_code=200)


@router.post("/{project_id}/tasks/actions/validate-all/")
async def post(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        authenticated_user_id = user.id
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id, db
        ):
            raise ValueError()
    except ValueError:
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403

    async with db.transaction():
        await ValidatorService.validate_all_tasks(project_id, authenticated_user_id, db)
        return JSONResponse(content={"Success": "All tasks validated"}, status_code=200)


@router.post("/{project_id}/tasks/actions/invalidate-all/")
async def post(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        authenticated_user_id = user.id
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id, db
        ):
            raise ValueError()
    except ValueError:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )
    async with db.transaction():
        await ValidatorService.invalidate_all_tasks(
            project_id, authenticated_user_id, db
        )
        return JSONResponse(
            content={"Success": "All tasks invalidated"}, status_code=200
        )


@router.post("{project_id}/tasks/actions/reset-all-badimagery/")
@requires("authenticated")
async def post(request: Request, project_id: int):
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
        authenticated_user_id = request.user.display_name
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
    return JSONResponse(
        content={"Success": "All bad imagery tasks marked ready for mapping"},
        status_code=200,
    )


@router.post("/{project_id}/tasks/actions/reset-all/")
async def post(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        authenticated_user_id = user.id
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id, db
        ):
            raise ValueError()
    except ValueError:
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403
    async with db.transaction():
        await ProjectAdminService.reset_all_tasks(project_id, authenticated_user_id, db)
        return JSONResponse(content={"Success": "All tasks reset"}, status_code=200)


@router.post("{project_id}/tasks/{task_id}/actions/split/")
@requires("authenticated")
async def post(request: Request, project_id: int, task_id: int):
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
        split_task_dto.user_id = request.user.display_name
        split_task_dto.project_id = project_id
        split_task_dto.task_id = task_id
        split_task_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
        split_task_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": "Unable to split task", "SubCode": "InvalidData"}, 400
    try:
        ProjectService.exists(project_id)  # Check if project exists
        tasks = SplitService.split_task(split_task_dto)
        return tasks.model_dump(by_alias=True), 200
    except SplitServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
    except InvalidGeoJson as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


@router.post("{project_id}/tasks/actions/extend/")
@requires("authenticated")
async def post(request: Request, project_id):
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
        extend_dto = ExtendLockTimeDTO(request.json())
        extend_dto.project_id = project_id
        extend_dto.user_id = request.user.display_name
        extend_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
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


@router.post("{project_id}/tasks/actions/reset-by-user/")
@requires("authenticated")
async def post(request: Request, project_id: int):
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
        revert_dto.action_by = request.user.display_name
        revert_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {
            "Error": "Unable to revert tasks",
            "SubCode": "InvalidData",
        }, 400
    try:
        ValidatorService.revert_user_tasks(revert_dto)
        return {"Success": "Successfully reverted tasks"}, 200
    except ValidatorServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
