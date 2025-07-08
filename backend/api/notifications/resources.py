from databases import Database
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.message_dto import MessageDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.messaging.message_service import (
    MessageService,
    MessageServiceError,
)
from backend.services.notification_service import NotificationService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{message_id}/", response_model=MessageDTO)
async def retrieve_notification(
    message_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Gets the specified message
    ---
    tags:
      - notifications
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
          description: The unique message
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Messages found
        403:
            description: Forbidden, if user attempting to ready other messages
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    try:
        user_message = await MessageService.get_message_as_dto(message_id, user.id, db)
        return user_message
    except MessageServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.delete("/{message_id}/")
async def delete_notification(
    message_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Deletes the specified message
    ---
    tags:
      - notifications
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
          description: The unique message
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Messages found
        403:
            description: Forbidden, if user attempting to ready other messages
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    try:
        async with db.transaction():
            await MessageService.delete_message(message_id, user.id, db)
            return JSONResponse(content={"Success": "Message deleted"}, status_code=200)
    except MessageServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.get("/")
async def get_notifications(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
    message_type: str | None = Query(
        default=None,
        description=(
            "Optional message-type filter; leave blank to retrieve all.\n"
            "Accepted values: 1 (System), 2 (Broadcast), 3 (Mention), 4 (Validation),\n"
            "5 (Invalidation), 6 (Request team), 7 (Invitation), 8 (Task comment),\n"
            "9 (Project chat), 10 (Project Activity), 11 (Team broadcast)"
        ),
        alias="messageType",
    ),
    from_username: str | None = Query(
        default=None,
        alias="from",
        description="Optional from username filter",
    ),
    project: str | None = Query(
        default=None,
        description="Optional project filter",
    ),
    task_id: int | None = Query(
        default=None,
        description="Optional task filter",
        alias="taskId",
    ),
    status: str | None = Query(
        default=None,
        description="Optional status filter (read or unread)",
    ),
    sort_by: str = Query(
        default="date",
        description="Field to sort by. Options: 'date', 'read', 'project_id', 'message_type'",
        alias="sortBy",
    ),
    sort_direction: str = Query(
        default="desc",
        description="Sorting direction: 'asc' or 'desc'",
        alias="sortDirection",
    ),
    page: int = Query(
        default=1,
        description="Page number",
    ),
    page_size: int = Query(
        default=10,
        alias="pageSize",
        description="Number of results per page",
    ),
):
    """
    Get all messages for logged in user
    ---
    tags:
      - notifications
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
          name: messageType
          type: string
          description: Optional message-type filter; leave blank to retrieve all\n
            Accepted values are 1 (System), 2 (Broadcast), 3 (Mention), 4 (Validation),
            5 (Invalidation), 6 (Request team), \n
            7 (Invitation), 8 (Task comment), 9 (Project chat),
            10 (Project Activity), and 11 (Team broadcast)
        - in: query
          name: from
          description: Optional from username filter
          type: string
        - in: query
          name: project
          description: Optional project filter
          type: string
        - in: query
          name: taskId
          description: Optional task filter
          type: integer
        - in: query
          name: status
          description: Optional status filter (read or unread)
          type: string
        - in: query
          name: sortBy
          description:
            field to sort by, defaults to 'date'. Other useful options are 'read', 'project_id' and 'message_type'
          type: string
        - in: query
          name: sortDirection
          description: sorting direction ('asc' or 'desc'), defaults to 'desc'
          type: string
        - in: query
          name: page
          description: Page of results
          type: integer
        - in: query
          name: pageSize
          description: Size of page, defaults to 10
          type: integer
    responses:
        200:
            description: Messages found
        404:
            description: User has no messages
        500:
            description: Internal Server Error
    """
    preferred_locale = request.headers.get("accept-language")

    user_messages = await MessageService.get_all_messages(
        db,
        user.id,
        preferred_locale,
        page,
        page_size,
        sort_by,
        sort_direction,
        message_type,
        from_username,
        project,
        task_id,
        status,
    )
    return user_messages


@router.get("/queries/own/count-unread/")
async def get_unreads(
    user: AuthUserDTO = Depends(login_required), db: Database = Depends(get_db)
):
    """
    Gets count of unread messages
    ---
    tags:
      - notifications
    produces:
      - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
    responses:
        200:
            description: Message info
        500:
            description: Internal Server Error
    """
    unread_count = await MessageService.has_user_new_messages(user.id, db)
    return unread_count


@router.post("/queries/own/post-unread/")
async def post_unreads(
    user: AuthUserDTO = Depends(login_required), db: Database = Depends(get_db)
):
    """
    Updates notification datetime for user
    ---
    tags:
      - notifications
    produces:
      - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
    responses:
        404:
            description: Notification not found.
        200:
            description: Message info
        500:
            description: Internal Server Error
    """
    unread_count = await NotificationService.update(user.id, db)
    return unread_count
