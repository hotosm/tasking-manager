import csv
import io
from distutils.util import strtobool
from datetime import datetime

from databases import Database
from fastapi import APIRouter, Body, Depends, Request, Response, Query
from fastapi.responses import JSONResponse
from loguru import logger

from backend.db import get_db
from backend.models.dtos.team_dto import NewTeamDTO, TeamSearchDTO, UpdateTeamDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.team import Team
from backend.services.organisation_service import OrganisationService
from backend.services.team_service import TeamService, TeamServiceError
from backend.services.users.authentication_service import login_required
from backend.services.users.user_service import UserService

router = APIRouter(
    prefix="/teams",
    tags=["teams"],
    responses={404: {"description": "Not found"}},
)


@router.patch("/{team_id}/")
async def patch(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
    team_dto: UpdateTeamDTO = Body(...),
):
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
        team = await TeamService.get_team_by_id(team_id, db)
        team_dto.team_id = team_id
        data = await request.json()
        if not await TeamService.is_user_team_manager(
            team_id, user.id, db
        ) and not await OrganisationService.can_user_manage_organisation(
            team.organisation_id, user.id, db
        ):
            return JSONResponse(
                content={
                    "Error": "User is not a admin or a manager for the team",
                    "SubCode": "UserNotTeamManager",
                },
                status_code=403,
            )
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": str(e), "SubCode": "InvalidData"}, status_code=400
        )
    try:
        if ("joinMethod" or "organisations_id") not in data.keys():
            await Team.update_team_members(team, team_dto, db)
        else:
            await TeamService.update_team(team_dto, db)
        return JSONResponse(content={"Status": "Updated"}, status_code=200)
    except TeamServiceError as e:
        return JSONResponse(content={"Error": str(e)}, status_code=402)


@router.get("/{team_id:int}/")
async def retrieve_team(
    request: Request,
    team_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
    authenticated_user_id = user.id
    omit_members = strtobool(request.query_params.get("omitMemberList", "false"))
    if authenticated_user_id is None:
        user_id = 0
    else:
        user_id = authenticated_user_id
    team_dto = await TeamService.get_team_as_dto(team_id, user_id, omit_members, db)
    return team_dto

    # TODO: Add delete API then do front end services and ui work


@router.delete("/{team_id}/")
async def delete(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
):
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
    if not await TeamService.is_user_team_manager(team_id, user.id, db):
        return JSONResponse(
            content={
                "Error": "User is not a manager for the team",
                "SubCode": "UserNotTeamManager",
            },
            status_code=403,
        )

    return await TeamService.delete_team(team_id, db)


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
    search_dto.page = int(request.query_params.get("page", 1))
    search_dto.per_page = int(request.query_params.get("perPage", 10))
    search_dto.user_id = user.id
    teams = await TeamService.get_all_teams(search_dto, db)
    return teams


@router.post("/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_dto: NewTeamDTO = Body(...),
):
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

    try:
        team_dto.creator = user.id
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": str(e), "SubCode": "InvalidData"}, status_code=400
        )

    try:
        organisation_id = team_dto.organisation_id

        is_org_manager = await OrganisationService.is_user_an_org_manager(
            organisation_id, user.id, db
        )
        is_admin = await UserService.is_user_an_admin(user.id, db)
        if is_admin or is_org_manager:
            team_id = await TeamService.create_team(team_dto, db)
            return JSONResponse(content={"teamId": team_id}, status_code=201)
        else:
            error_msg = "User not permitted to create team for the Organisation"
            return JSONResponse(
                content={"Error": error_msg, "SubCode": "CreateTeamNotPermitted"},
                status_code=403,
            )
    except TeamServiceError as e:
        return JSONResponse(content={"Error": str(e)}, status_code=400)


@router.get("/join_requests/")
async def get(
    request: Request,
    team_id: int = Query(..., description="ID of the team to filter by"),
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Downloads join requests for a specific team as a CSV.
    ---
    tags:
        - teams
    produces:
        - text/csv
    parameters:
        - in: query
          name: team_id
          description: ID of the team to filter by
          required: true
          type: integer
    responses:
        200:
            description: CSV file with inactive team members
        400:
            description: Missing or invalid parameters
        401:
            description: Unauthorized access
        500:
            description: Internal server error
    """
    try:
        query = """
            SELECT
                u.username AS username,
                tm.joined_date AS joined_date,
                t.name AS team_name
            FROM
                team_members tm
            INNER JOIN
                users u ON tm.user_id = u.id
            INNER JOIN
                teams t ON tm.team_id = t.id
            WHERE
                tm.team_id = :team_id
                AND tm.active = FALSE
        """
        team_members = await db.fetch_all(query=query, values={"team_id": int(team_id)})

        if not team_members:
            return JSONResponse(
                content={"message": "No inactive members found for the specified team"},
                status_code=200,
            )

        csv_output = io.StringIO()
        writer = csv.writer(csv_output)
        writer.writerow(["Username", "Date Joined (UTC)", "Team Name"])

        for member in team_members:
            joined_date = getattr(member, "joined_date")
            joined_date_str = (
                joined_date.strftime("%Y-%m-%dT%H:%M:%S") if joined_date else "N/A"
            )
            writer.writerow(
                [
                    getattr(member, "username"),
                    joined_date_str,
                    getattr(member, "team_name"),
                ]
            )

        csv_output.seek(0)
        return Response(
            content=csv_output.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    f"attachment; filename=join_requests_{team_id}_"
                    f"{datetime.now().strftime('%Y%m%d')}.csv"
                )
            },
        )
    except Exception as e:
        return JSONResponse(
            content={"message": f"Error occurred: {str(e)}"}, status_code=500
        )
