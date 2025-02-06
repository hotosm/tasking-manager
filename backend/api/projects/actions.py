from databases import Database
from fastapi import APIRouter, BackgroundTasks, Body, Depends, Request
from fastapi.responses import JSONResponse
from loguru import logger
from shapely import GEOSException
from shapely.errors import TopologicalError

from backend.db import get_db
from backend.models.dtos.grid_dto import GridDTO
from backend.models.dtos.message_dto import MessageDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.utils import InvalidGeoJson
from backend.services.grid.grid_service import GridService
from backend.services.interests_service import InterestService
from backend.services.messaging.message_service import MessageService
from backend.services.project_admin_service import (
    ProjectAdminService,
    ProjectAdminServiceError,
)
from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import login_required, pm_only

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.post("/{project_id}/actions/transfer-ownership/")
async def post(
    request: Request,
    background_tasks: BackgroundTasks,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    data: dict = Body(...),
):
    """
    Transfers a project to a new user
    ---
    tags:
        - projects
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
        - in: body
          name: body
          required: true
          description: username of the new owner
          schema:
              properties:
                  username:
                    type: string
    responses:
        200:
            description: Project ownership transferred successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    try:
        username = data["username"]
    except Exception:
        return JSONResponse(
            content={"Error": "Username not provided", "SubCode": "InvalidData"},
            status_code=400,
        )
    try:
        await ProjectAdminService.transfer_project_to(
            project_id, user.id, username, db, background_tasks
        )
        return JSONResponse(content={"Success": "Project Transferred"}, status_code=200)
    except (ValueError, ProjectAdminServiceError) as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.post("/{project_id}/actions/message-contributors/")
async def post(
    request: Request,
    background_tasks: BackgroundTasks,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Send message to all contributors of a project
    ---
    tags:
        - projects
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
        - in: body
          name: body
          required: true
          description: JSON object for creating message
          schema:
            properties:
                subject:
                    type: string
                    default: Thanks
                    required: true
                message:
                    type: string
                    default: Thanks for your contribution
                    required: true
    responses:
        200:
            description: Message sent successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    try:
        request_json = await request.json()
        request_json["from_user_id"] = user.id
        message_dto = MessageDTO(**request_json)
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": "Unable to send message to contributors",
                "SubCode": "InvalidData",
            },
            status_code=400,
        )
    if not await ProjectAdminService.is_user_action_permitted_on_project(
        user.id, project_id, db
    ):
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )
    try:
        background_tasks.add_task(
            MessageService.send_message_to_all_contributors,
            project_id,
            message_dto,
        )
        return JSONResponse(content={"Success": "Messages started"}, status_code=200)
    except Exception as e:
        logger.error(f"Error starting background task: {str(e)}")
        return JSONResponse(
            content={"Error": "Failed to send messages"}, status_code=500
        )


@router.post("/{project_id}/actions/feature/")
async def post(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Set a project as featured
    ---
    tags:
        - projects
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
            description: Featured projects
        400:
            description: Bad request
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user.id, project_id, db
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

    try:
        await ProjectService.set_project_as_featured(project_id, db)
        return JSONResponse(content={"Success": True}, status_code=200)
    except ValueError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.post("/{project_id}/actions/remove-feature/")
async def post(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Unset a project as featured
    ---
    tags:
        - projects
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
            description: Project is no longer featured
        400:
            description: Bad request
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user.id, project_id, db
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

    try:
        await ProjectService.unset_project_as_featured(project_id, db)
        return JSONResponse(content={"Success": True}, status_code=200)
    except ValueError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.post("/{project_id}/actions/set-interests/")
async def post(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    data: dict = Body(...),
):
    """
    Creates a relationship between project and interests
    ---
    tags:
        - interests
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
        - in: body
            name: body
            required: true
            description: JSON object for creating/updating project and interests relationships
            schema:
                properties:
                    interests:
                        type: array
                        items:
                        type: integer
    responses:
        200:
            description: New project interest relationship created
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    try:
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user.id, project_id, db
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

    project_interests = await InterestService.create_or_update_project_interests(
        project_id, data["interests"], db
    )
    return project_interests.model_dump(by_alias=True)


@router.post("/actions/intersecting-tiles/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    grid_dto: GridDTO = Body(...),
):
    """
    Gets the tiles intersecting the aoi
    ---
    tags:
        - grid
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - in: body
            name: body
            required: true
            description: JSON object containing aoi and tasks and bool flag for controlling clip grid to aoi
            schema:
                properties:
                    clipToAoi:
                    type: boolean
                    default: true
                    areaOfInterest:
                        schema:
                            properties:
                                type:
                                    type: string
                                    default: FeatureCollection
                                features:
                                    type: array
                                    items:
                                        schema:
                                            $ref: "#/definitions/GeoJsonFeature"
                    grid:
                        schema:
                            properties:
                                type:
                                    type: string
                                    default: FeatureCollection
                                features:
                                    type: array
                                    items:
                                        schema:
                                            $ref: "#/definitions/GeoJsonFeature"
    responses:
        200:
            description: Intersecting tasks found successfully
        400:
            description: Client Error - Invalid Request
        500:
            description: Internal Server Error
    """
    try:
        grid = GridService.trim_grid_to_aoi(grid_dto)
        return JSONResponse(content=grid, status_code=200)
    except InvalidGeoJson as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )
    except TopologicalError:
        return JSONResponse(
            content={
                "Error": "Invalid geometry. Polygon is self intersecting",
                "SubCode": "SelfIntersectingAOI",
            },
            status_code=400,
        )
    except GEOSException as wrapped:
        if isinstance(wrapped.args[0], str) and "Self-intersection" in wrapped.args[0]:
            return JSONResponse(
                content={
                    "error": "Invalid geometry. Polygon is self intersecting",
                    "SubCode": "SelfIntersectingAOI",
                },
                status_code=400,
            )
        return JSONResponse(
            content={"error": str(wrapped), "SubCode": "InternalServerError"}
        )
