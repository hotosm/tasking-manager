from databases import Database
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, Request, Body
from loguru import logger

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
from backend.services.team_service import TeamService, TeamServiceError
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/teams/")
async def get(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """Get teams assigned with a project
    ---
    tags:
        - teams
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
            description: Teams listed successfully
        403:
            description: Forbidden, if user is not authenticated
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    # Check if project exists
    await ProjectService.exists(project_id, db)
    teams_dto = await TeamService.get_project_teams_as_dto(project_id, db)
    return teams_dto


@router.post("/{project_id}/teams/{team_id}/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
    project_id: int = None,
    data: dict = Body(...),
):
    """Assign a team to a project
    ---
    tags:
      - teams
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
        - name: team_id
          in: path
          description: Unique team ID
          required: true
          type: integer
          default: 1
        - in: body
          name: body
          required: true
          description: The role that the team will have on the project
          schema:
              properties:
                  role:
                    type: string
    responses:
        201:
            description: Team project assignment created
        401:
            description: Forbidden, if user is not a manager of the project
        403:
            description: Forbidden, if user is not authenticated
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    if not await TeamService.is_user_team_manager(team_id, user.id, db):
        return JSONResponse(
            content={
                "Error": "User is not an admin or a manager for the team",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )

    try:
        role = data["role"]
    except ValueError as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": str(e), "SubCode": "InvalidData"}, status_code=400
        )

    try:
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user.id, project_id, db
        ):
            raise ValueError()
        await TeamService.add_team_project(team_id, project_id, role, db)
        return JSONResponse(
            content={
                "Success": "Team {} assigned to project {} with role {}".format(
                    team_id, project_id, role
                )
            },
            status_code=201,
        )
    except ValueError:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )


@router.patch("/{team_id}/projects/{project_id}/")
async def patch(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
    project_id: int = None,
    data: dict = Body(...),
):
    """Update role of a team on a project
    ---
    tags:
      - teams
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
        - name: team_id
          in: path
          description: Unique team ID
          required: true
          type: integer
          default: 1
        - in: body
          name: body
          required: true
          description: The role that the team will have on the project
          schema:
              properties:
                  role:
                    type: string
    responses:
        201:
            description: Team project assignment created
        401:
            description: Forbidden, if user is not a manager of the project
        403:
            description: Forbidden, if user is not authenticated
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    try:
        role = data["role"]
    except ValueError as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    try:
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user.id, project_id, db
        ):
            raise ValueError()
        await TeamService.change_team_role(team_id, project_id, role, db)
        return JSONResponse(
            content={"Status": "Team role updated successfully."}, status_code=201
        )
    except ValueError:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )
    except TeamServiceError as e:
        return JSONResponse(content={"Error": str(e)}, status_code=402)


@router.delete("/{team_id}/projects/{project_id}/")
async def delete(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
    project_id: int = None,
):
    """
    Deletes the specified team project assignment
    ---
    tags:
        - teams
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: message_id
            in: path
            description: Unique message ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Team unassigned of the project
        401:
            description: Forbidden, if user is not a manager of the project
        403:
            description: Forbidden, if user is not authenticated
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    try:
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user.id, project_id, db
        ):
            raise ValueError()
        await TeamService.delete_team_project(team_id, project_id, db)
        return JSONResponse(content={"Success": True}, status_code=200)
    except ValueError:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )
