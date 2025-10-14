import io
import json
from typing import Optional

from backend.models.dtos.user_dto import AuthUserDTO
from databases import Database
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse, Response, StreamingResponse
from loguru import logger
from starlette.authentication import requires

from backend.db import get_db
from backend.models.dtos.grid_dto import GridDTO
from backend.models.postgis.statuses import ProjectStatus, UserRole
from backend.models.postgis.utils import InvalidGeoJson
from backend.services.grid.grid_service import GridService
from backend.services.mapping_service import MappingService
from backend.services.project_service import ProjectService, ProjectServiceError
from backend.services.users.authentication_service import login_required_optional, tm
from backend.services.users.user_service import UserService
from backend.services.validator_service import ValidatorService

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/tasks/{task_id}/")
async def retrieve_task(
    request: Request, project_id: int, task_id: int, db: Database = Depends(get_db)
):
    """
    Get a task's metadata
    ---
    tags:
        - tasks
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
        404:
            description: Task not found
        500:
            description: Internal Server Error
    """
    preferred_locale = request.headers.get("accept-language")
    task = await MappingService.get_task_as_dto(
        task_id, project_id, db, preferred_locale
    )
    return task


@router.get("/{project_id}/tasks/")
async def get_project_tasks(
    project_id: int,
    tasks: str = Query(default=None),
    as_file: bool = Query(default=False, alias="as_file"),
    user: Optional[AuthUserDTO] = Depends(login_required_optional),
    db: Database = Depends(get_db),
):
    """
    Get all tasks for a project as JSON
    ---
    tags:
        - tasks
    produces:
        - application/json
    parameters:
        - name: project_id
            in: path
            description: Project ID the task is associated with
            required: true
            type: integer
            default: 1
        - in: query
            name: tasks
            type: string
            description: List of tasks; leave blank to retrieve all
            default: 1,2
        - in: query
            name: as_file
            type: boolean
            description: Set to true if file download preferred
            default: True
    responses:
        200:
            description: Project found
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        is_private, status = await ProjectService.get_project_privacy_and_status(
            project_id, db
        )
        # If private or draft, enforce login + permission
        if is_private or status == ProjectStatus.DRAFT.value:
            user_id = user.id if user else None
            if user is None:
                return JSONResponse(
                    content={
                        "Error": "User not permitted: Private Project",
                        "SubCode": "PrivateProject",
                    },
                    status_code=403,
                )

            project_dto = await ProjectService.get_project_dto_for_mapper(
                project_id,
                user_id,
                db,
            )
            if not project_dto:
                return JSONResponse(
                    content={
                        "Error": "User not permitted: Private Project",
                        "SubCode": "PrivateProject",
                    },
                    status_code=403,
                )

        tasks_json = await ProjectService.get_project_tasks(db, project_id, tasks)
        if as_file:
            tasks_str = json.dumps(tasks_json, indent=4)
            return Response(
                content=tasks_str,
                media_type="application/geo+json",
                headers={
                    "Content-Disposition": f'attachment; filename="{project_id}-tasks.geojson"'
                },
            )

        return tasks_json

    except ProjectServiceError as e:
        return JSONResponse(content={"Error": str(e)}, status_code=403)


@router.delete("/{project_id}/tasks/")
@requires("authenticated")
async def delete(request: Request, project_id):
    """
    Delete a list of tasks from a project
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
        - in: body
            name: body
            required: true
            description: JSON object with a list of tasks to delete
            schema:
                properties:
                    tasks:
                        type: array
                        items:
                            type: integer
                        default: [ 1, 2 ]
    responses:
        200:
            description: Task(s) deleted
        400:
            description: Bad request
        403:
            description: Forbidden
        404:
            description: Project or Task Not Found
        500:
            description: Internal Server Error
    """
    user_id = request.user.display_name
    user = UserService.get_user_by_id(user_id)
    if user.role != UserRole.ADMIN.value:
        return {
            "Error": "This endpoint action is restricted to ADMIN users.",
            "SubCode": "OnlyAdminAccess",
        }, 403

    tasks_ids = await request.json().get("tasks")
    if tasks_ids is None:
        return {"Error": "Tasks ids not provided", "SubCode": "InvalidData"}, 400
    if isinstance(tasks_ids, list) is False:
        return {
            "Error": "Tasks were not provided as a list",
            "SubCode": "InvalidData",
        }, 400

    try:
        ProjectService.delete_tasks(project_id, tasks_ids)
        return {"Success": "Task(s) deleted"}, 200
    except ProjectServiceError as e:
        return {"Error": str(e)}, 403


@router.get("/{project_id}/tasks/queries/xml/")
async def get_tasks_xml(
    project_id: int,
    tasks: str = Query(default=None),
    as_file: bool = Query(default=False, alias="as_file"),
    db: Database = Depends(get_db),
):
    """
    Get all tasks for a project as OSM XML
    ---
    tags:
        - tasks
    produces:
        - application/xml
    parameters:
        - name: project_id
            in: path
            description: Project ID the task is associated with
            required: true
            type: integer
            default: 1
        - in: query
            name: tasks
            type: string
            description: List of tasks; leave blank to retrieve all
            default: 1,2
        - in: query
            name: as_file
            type: boolean
            description: Set to true if file download preferred
            default: False
    responses:
        200:
            description: OSM XML
        400:
            description: Client Error
        404:
            description: No mapped tasks
        500:
            description: Internal Server Error
    """
    xml = await MappingService.generate_osm_xml(project_id, tasks, db)

    if as_file:
        return StreamingResponse(
            io.BytesIO(xml),
            media_type="text/xml",
            headers={
                "Content-Disposition": f"attachment; filename=HOT-project-{project_id}.osm"
            },
        )

    return Response(content=xml, media_type="text/xml", status_code=200)


@router.get("/{project_id}/tasks/queries/gpx/")
async def get_tasks_gpx(
    project_id: int,
    tasks: str = Query(default=None),
    as_file: bool = Query(default=False, alias="as_file"),
    db: Database = Depends(get_db),
):
    """
    Get all tasks for a project as GPX
    ---
    tags:
        - tasks
    produces:
        - application/xml
    parameters:
        - name: project_id
            in: path
            description: Project ID the task is associated with
            required: true
            type: integer
            default: 1
        - in: query
            name: tasks
            type: string
            description: List of tasks; leave blank for all
            default: 1,2
        - in: query
            name: as_file
            type: boolean
            description: Set to true if file download preferred
            default: False
    responses:
        200:
            description: GPX XML
        400:
            description: Client error
        404:
            description: No mapped tasks
        500:
            description: Internal Server Error
    """
    xml = await MappingService.generate_gpx(project_id, tasks, db)

    if as_file:
        return StreamingResponse(
            io.BytesIO(xml),
            media_type="text/xml",
            headers={
                "Content-Disposition": f"attachment; filename=HOT-project-{project_id}.gpx"
            },
        )

    return Response(content=xml, media_type="text/xml", status_code=200)


@router.put("/{project_id}/tasks/queries/aoi/")
@requires("authenticated")
@tm.pm_only()
async def tasks_aoi(request: Request, project_id: int):
    """
    Get task tiles intersecting with the aoi provided
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
        grid_dto = GridDTO(request.get_json())
        grid_dto.validate()
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return {
            "Error": "Unable to fetch tiles interesecting AOI",
            "SubCode": "InvalidData",
        }, 400

    try:
        grid = GridService.trim_grid_to_aoi(grid_dto)
        return grid, 200
    except InvalidGeoJson as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400


@router.get("/{project_id}/tasks/queries/mapped/")
async def get_mapped_tasks(project_id: int, db: Database = Depends(get_db)):
    """
    Get all mapped tasks for a project grouped by username
    ---
    tags:
        - tasks
    produces:
        - application/json
    parameters:
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Mapped tasks returned
        500:
            description: Internal Server Error
    """
    await ProjectService.get_project_by_id(project_id, db)
    mapped_tasks = await ValidatorService.get_mapped_tasks_by_user(project_id, db)
    return mapped_tasks.model_dump(by_alias=True)


@router.get("/{username}/tasks/queries/own/invalidated/")
@requires("authenticated")
async def get_invalidated_tasks(request: Request, username: str):
    """
    Get invalidated tasks either mapped by user or invalidated by user
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
        - name: username
          in: path
          description: The users username
          required: true
          type: string
        - in: query
          name: asValidator
          description: treats user as validator, rather than mapper, if true
          type: string
        - in: query
          name: sortBy
          description: field to sort by, defaults to action_date
          type: string
        - in: query
          name: sortDirection
          description: direction of sort, defaults to desc
          type: string
        - in: query
          name: page
          description: Page of results user requested
          type: integer
        - in: query
          name: pageSize
          description: Size of page, defaults to 10
          type: integer
        - in: query
          name: project
          description: Optional project filter
          type: integer
        - in: query
          name: closed
          description: Optional filter for open/closed invalidations
          type: boolean
    responses:
        200:
            description: Invalidated tasks user has invalidated
        404:
            description: No invalidated tasks
        500:
            description: Internal Server Error
    """
    sort_column = {"updatedDate": "updated_date", "projectId": "project_id"}
    if request.query_params.get("sortBy", "updatedDate") in sort_column:
        sort_column = sort_column[request.query_params.get("sortBy", "updatedDate")]
    else:
        sort_column = sort_column["updatedDate"]
    # closed needs to be set to True, False, or None
    closed = None
    if request.query_params.get("closed") == "true":
        closed = True
    elif request.query_params.get("closed") == "false":
        closed = False
    # sort direction should only be desc or asc
    if request.query_params.get("sortDirection") in ["asc", "desc"]:
        sort_direction = request.query_params.get("sortDirection")
    else:
        sort_direction = "desc"
    invalidated_tasks = ValidatorService.get_user_invalidated_tasks(
        request.query_params.get("asValidator") == "true",
        username,
        request.environ.get("HTTP_ACCEPT_LANGUAGE"),
        closed,
        request.query_params.get("project", None),
        request.query_params.get("page", None),
        request.query_params.get("pageSize", None),
        sort_column,
        sort_direction,
    )
    return invalidated_tasks.model_dump(by_alias=True), 200
