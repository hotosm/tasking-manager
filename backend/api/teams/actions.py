from databases import Database
from fastapi import APIRouter, BackgroundTasks, Body, Depends, Request
from fastapi.responses import JSONResponse
from loguru import logger

from backend.db import db_connection, get_db
from backend.models.dtos.message_dto import MessageDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.user import User
from backend.services.team_service import (
    TeamJoinNotAllowed,
    TeamService,
    TeamServiceError,
)
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/teams",
    tags=["teams"],
    responses={404: {"description": "Not found"}},
)

TEAM_NOT_FOUND = "Team not found"


@router.post("/{team_id}/actions/join/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
):
    """
    Request to join a team
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
            description: Unique team ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Member added
        403:
            description: Forbidden
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    try:
        async with db.transaction():
            await TeamService.request_to_join_team(team_id, user.id, db)
            return JSONResponse(
                content={"Success": "Join request successful"}, status_code=200
            )
    except TeamServiceError as e:
        return JSONResponse(
            content={"Error": str(e), "SubCode": "InvalidRequest"}, status_code=400
        )


@router.patch("/{team_id}/actions/join/")
# @tm.pm_only(False)
async def patch(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
    data: dict = Body(...),
):
    """
    Take action on a team invite
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
            description: Unique team ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object to accept or reject a request to join team
            schema:
            properties:
                username:
                    type: string
                    required: true
                type:
                    type: string
                    default: join-response
                    required: true
                role:
                    type: string
                    default: member
                    required: false
                action:
                    type: string
                    default: accept
                    required: true
    responses:
        200:
            description: Member added
        403:
            description: Forbidden
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    try:
        username = data["username"]
        request_type = data.get("type", "join-response")
        action = data["action"]
        role = data.get("role", "member")
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": str(e),
                "SubCode": "InvalidData",
            },
            status_code=400,
        )

    if request_type == "join-response":
        if await TeamService.is_user_team_manager(team_id, user.id, db):
            await TeamService.accept_reject_join_request(
                team_id, user.id, username, role, action, db
            )
            return JSONResponse(content={"Success": "True"}, status_code=200)
        else:
            return JSONResponse(
                content={
                    "Error": "You don't have permissions to approve this join team request",
                    "SubCode": "ApproveJoinError",
                },
                status_code=403,
            )
    elif request_type == "invite-response":
        await TeamService.accept_reject_invitation_request(
            team_id, user.id, username, role, action, db
        )
        return JSONResponse(content={"Success": "True"}, status_code=200)


@router.post("/{team_id}/actions/add/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
    data: dict = Body(...),
):
    """
    Add members to the team
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
            description: Unique team ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object to join team
            schema:
            properties:
                username:
                    type: string
                    required: true
                role:
                    type: string
                    required: false
    responses:
        200:
            description: Member added
        403:
            description: Forbidden
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    try:
        username = data["username"]
        role = data.get("role", None)
    except (Exception, KeyError) as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": str(e),
                "SubCode": "InvalidData",
            },
            status_code=400,
        )

    try:
        await TeamService.add_user_to_team(team_id, user.id, username, role, db)
        return JSONResponse(
            content={"Success": "User added to the team"}, status_code=200
        )
    except TeamJoinNotAllowed as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.post("/{team_id}/actions/leave/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
    data: dict = Body(...),
):
    """
    Removes a user from a team
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
          description: Unique team ID
          required: true
          type: integer
          default: 1
        - in: body
          name: body
          required: true
          description: JSON object to remove user from team
          schema:
            properties:
                username:
                    type: string
                    default: 1
                    required: true
    responses:
        200:
            description: Member deleted
        403:
            description: Forbidden, if user attempting to ready other messages
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    username = data["username"]
    request_user = await User.get_by_id(user.id, db)
    if (
        await TeamService.is_user_team_manager(team_id, user.id, db)
        or request_user.username == username
    ):
        await TeamService.leave_team(team_id, username, db)
        return JSONResponse(
            content={"Success": "User removed from the team"}, status_code=200
        )
    else:
        return JSONResponse(
            content={
                "Error": "You don't have permissions to remove {} from this team.".format(
                    username
                ),
                "SubCode": "RemoveUserError",
            },
            status_code=403,
        )


@router.post("/{team_id}/actions/message-members/")
async def post(
    request: Request,
    background_tasks: BackgroundTasks,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    team_id: int = None,
):
    """
    Message all team members
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
            description: Unique team ID
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
        # Validate if team is present
        team = await TeamService.get_team_by_id(team_id, db)
        is_manager = await TeamService.is_user_team_manager(team_id, user.id, db)
        if not is_manager:
            raise ValueError
        if not message_dto.message.strip() or not message_dto.subject.strip():
            raise Exception(
                {"Error": "Empty message not allowed", "SubCode": "EmptyMessage"}
            )
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": "Request payload did not match validation",
                "SubCode": "InvalidData",
            },
            status_code=400,
        )
    except ValueError:
        return JSONResponse(
            content={
                "Error": "Unauthorised to send message to team members",
                "SubCode": "UserNotPermitted",
            },
            status_code=403,
        )

    try:
        background_tasks.add_task(
            TeamService.send_message_to_all_team_members,
            team_id,
            team.name,
            message_dto,
            user.id,
            db_connection.database,
        )
        return JSONResponse(
            content={"Success": "Message sent successfully"}, status_code=200
        )
    except ValueError as e:
        return JSONResponse(content={"Error": str(e)}, status_code=400)
