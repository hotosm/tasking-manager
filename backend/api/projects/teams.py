# from flask_restful import Resource, request, current_app
# from schematics.exceptions import DataError

from backend.services.team_service import TeamService, TeamServiceError
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
# from backend.services.users.authentication_service import token_auth
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class ProjectsTeamsAPI(Resource):
    # @token_auth.login_required
@router.get("/{project_id}/teams/")
@requires("authenticated")
async def get(request: Request, project_id: int, session: AsyncSession = Depends(get_session)):
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
    await ProjectService.exists(project_id, session)
    teams_dto = await TeamService.get_project_teams_as_dto(project_id, session)
    return teams_dto.model_dump(by_alias=True), 200


    # @token_auth.login_required
@router.post("/{project_id}/teams/{team_id}/")
@requires("authenticated")
async def post(request: Request, team_id, project_id):
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
        if not TeamService.is_user_team_manager(team_id, request.user.display_name):
            return {
                "Error": "User is not an admin or a manager for the team",
                "SubCode": "UserPermissionError",
            }, 401

        try:
            role = request.get_json(force=True)["role"]
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": str(e), "SubCode": "InvalidData"}, 400

        try:
            if not ProjectAdminService.is_user_action_permitted_on_project(
                token_auth.current_user, project_id
            ):
                raise ValueError()
            TeamService.add_team_project(team_id, project_id, role)
            return (
                {
                    "Success": "Team {} assigned to project {} with role {}".format(
                        team_id, project_id, role
                    )
                },
                201,
            )
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

@router.patch("/<int:team_id>/projects/<int:project_id>/")
@requires("authenticated")
async def patch(request: Request, team_id: int, project_id: int):
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
            role = request.get_json(force=True)["role"]
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": str(e), "SubCode": "InvalidData"}, 400

        try:
            if not ProjectAdminService.is_user_action_permitted_on_project(
                token_auth.current_user, project_id
            ):
                raise ValueError()
            TeamService.change_team_role(team_id, project_id, role)
            return {"Status": "Team role updated successfully."}, 200
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403
        except TeamServiceError as e:
            return str(e), 402

@router.delete("/<int:team_id>/projects/<int:project_id>/")
@requires("authenticated")
async def delete(request: Request, team_id: int, project_id: int):
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
        if not ProjectAdminService.is_user_action_permitted_on_project(
            request.user.display_name, project_id
        ):
            raise ValueError()
        TeamService.delete_team_project(team_id, project_id)
        return {"Success": True}, 200
    except ValueError:
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403
