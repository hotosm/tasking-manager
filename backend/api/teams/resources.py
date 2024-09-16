from backend.models.dtos.team_dto import (
    NewTeamDTO,
    UpdateTeamDTO,
    TeamSearchDTO,
)
from backend.services.team_service import TeamService, TeamServiceError
from backend.services.organisation_service import OrganisationService
from backend.services.users.authentication_service import login_required
from backend.services.users.user_service import UserService
from backend.models.dtos.user_dto import AuthUserDTO
from distutils.util import strtobool
from fastapi import APIRouter, Depends, Request
from backend.db import get_db, get_session
from starlette.authentication import requires
from loguru import logger
from databases import Database


router = APIRouter(
    prefix="/teams",
    tags=["teams"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

# class TeamsRestAPI(Resource):
#     @token_auth.login_required


@router.patch("/{team_id}/")
@requires("authenticated")
async def patch(request: Request, team_id: int):
    """
    Updates a team
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
        - name: team_id
            in: path
            description: The unique team ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object for updating a team
            schema:
            properties:
                name:
                    type: string
                    default: HOT - Mappers
                logo:
                    type: string
                    default: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                members:
                    type: array
                    items:
                        schema:
                            $ref: "#/definitions/TeamMembers"
                organisation:
                    type: string
                    default: HOT
                description:
                    type: string
                    default: HOT's mapping editors
                inviteOnly:
                    type: boolean
                    default: false
    responses:
        200:
            description: Team updated successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    try:
        team = TeamService.get_team_by_id(team_id)
        team_dto = UpdateTeamDTO(request.json())
        team_dto.team_id = team_id
        team_dto.validate()

        authenticated_user_id = request.user.display_name
        if not TeamService.is_user_team_manager(
            team_id, authenticated_user_id
        ) and not OrganisationService.can_user_manage_organisation(
            team.organisation_id, authenticated_user_id
        ):
            return {
                "Error": "User is not a admin or a manager for the team",
                "SubCode": "UserNotTeamManager",
            }, 403
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    try:
        TeamService.update_team(team_dto)
        return {"Status": "Updated"}, 200
    except TeamServiceError as e:
        return str(e), 402


@router.get("/{team_id}/")
async def retrieve_team(request: Request, team_id: int, db: Database = Depends(get_db)):
    """
    Retrieves a Team
    ---
    tags:
        - teams
    produces:
        - application/json
    parameters:
        - name: team_id
            in: path
            description: Unique team ID
            required: true
            type: integer
            default: 1
        - in: query
            name: omitMemberList
            type: boolean
            description: Set it to true if you don't want the members list on the response.
            default: False
    responses:
        200:
            description: Team found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Team not found
        500:
            description: Internal Server Error
    """
    authenticated_user_id = request.user.display_name
    omit_members = strtobool(request.query_params.get("omitMemberList", "false"))
    if authenticated_user_id is None:
        user_id = 0
    else:
        user_id = authenticated_user_id
    team_dto = await TeamService.get_team_as_dto(team_id, user_id, omit_members, db)
    return team_dto

    # TODO: Add delete API then do front end services and ui work


@router.delete("/{team_id}/")
@requires("authenticated")
async def delete(request: Request, team_id: int):
    """
    Deletes a Team
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
        - name: team_id
            in: path
            description: The unique team ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Team deleted
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden - Team has associated projects
        404:
            description: Team not found
        500:
            description: Internal Server Error
    """
    if not TeamService.is_user_team_manager(team_id, request.user.display_name):
        return {
            "Error": "User is not a manager for the team",
            "SubCode": "UserNotTeamManager",
        }, 401

    return TeamService.delete_team(team_id)


@router.get("/")
async def list_teams(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Gets all teams
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
        - in: query
            name: team_name
            description: name of the team to filter by
            type: str
            default: null
        - in: query
            name: member
            description: user ID to filter teams that the users belongs to, user must be active.
            type: str
            default: null
        - in: query
            name: manager
            description: user ID to filter teams that the users has MANAGER role
            type: str
            default: null
        - in: query
            name: member_request
            description: user ID to filter teams that the user has send invite request to
            type: str
            default: null
        - in: query
            name: team_role
            description: team role for project
            type: str
            default: null
        - in: query
            name: organisation
            description: organisation ID to filter teams
            type: integer
            default: null
        - in: query
            name: omitMemberList
            type: boolean
            description: Set it to true if you don't want the members list on the response.
            default: False
        - in: query
            name: fullMemberList
            type: boolean
            description: Set it to true if you want full members list otherwise it will be limited to 10 per role.
            default: True
        - in: query
            name: paginate
            type: boolean
            description: Set it to true if you want to paginate the results.
            default: False
        - in: query
            name: page
            type: integer
            description: Page number to return.
            default: 1
        - in: query
            name: perPage
            type: integer
            description: Number of results per page.
            default: 10

    responses:
        201:
            description: Team list returned successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    search_dto = TeamSearchDTO()
    search_dto.team_name = request.query_params.get("team_name", None)
    search_dto.member = (
        int(request.query_params.get("member"))
        if request.query_params.get("member")
        else None
    )
    search_dto.manager = request.query_params.get("manager", None)
    search_dto.member_request = request.query_params.get("member_request", None)
    search_dto.team_role = request.query_params.get("team_role", None)
    search_dto.organisation = request.query_params.get("organisation", None)
    search_dto.omit_members = strtobool(
        request.query_params.get("omitMemberList", "false")
    )
    search_dto.full_members_list = strtobool(
        request.query_params.get("fullMemberList", "true")
    )
    search_dto.paginate = strtobool(request.query_params.get("paginate", "false"))
    search_dto.page = request.query_params.get("page", 1)
    search_dto.per_page = request.query_params.get("perPage", 10)
    search_dto.user_id = user.id

    teams = await TeamService.get_all_teams(search_dto, db)
    return teams


@router.post("/")
@requires("authenticated")
async def post(request: Request):
    """
    Creates a new team
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
        - in: body
            name: body
            required: true
            description: JSON object for creating team
            schema:
            properties:
                name:
                    type: string
                    default: HOT - Mappers
                organisation_id:
                    type: integer
                    default: 1
                description:
                    type: string
                visibility:
                    type: string
                    enum:
                    - "PUBLIC"
                    - "PRIVATE"
                joinMethod:
                    type: string
                    enum:
                    - "ANY"
                    - "BY_REQUEST"
                    - "BY_INVITE"
    responses:
        201:
            description: Team created successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Unauthorized - Forbidden
        500:
            description: Internal Server Error
    """
    user_id = request.user.display_name

    try:
        team_dto = NewTeamDTO(request.json())
        team_dto.creator = user_id
        team_dto.validate()
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    try:
        organisation_id = team_dto.organisation_id

        is_org_manager = OrganisationService.is_user_an_org_manager(
            organisation_id, user_id
        )
        is_admin = UserService.is_user_an_admin(user_id)
        if is_admin or is_org_manager:
            team_id = TeamService.create_team(team_dto)
            return {"teamId": team_id}, 201
        else:
            error_msg = "User not permitted to create team for the Organisation"
            return {"Error": error_msg, "SubCode": "CreateTeamNotPermitted"}, 403
    except TeamServiceError as e:
        return str(e), 400
