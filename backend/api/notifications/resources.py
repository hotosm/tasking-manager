from backend.services.messaging.message_service import (
    MessageService,
    MessageServiceError,
)
from backend.services.notification_service import NotificationService
from backend.services.users.authentication_service import tm
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

@router.get("/{message_id}/")
@requires("authenticated")
async def get(request: Request, message_id: int):
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
        user_message = MessageService.get_message_as_dto(
            message_id, request.user.display_name
        )
        return user_message.model_dump(by_alias=True), 200
    except MessageServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403

@router.delete("/{message_id}/")
@requires("authenticated")
async def delete(request: Request, message_id: int):
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
        MessageService.delete_message(message_id, request.user.display_name)
        return {"Success": "Message deleted"}, 200
    except MessageServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


@router.get("/")
@requires("authenticated")
async def get(request: Request):
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
    page = request.query_params.get("page", 1)
    page_size = request.query_params.get("pageSize", 10)
    sort_by = request.query_params.get("sortBy", "date")
    sort_direction = request.query_params.get("sortDirection", "desc")
    message_type = request.query_params.get("messageType", None)
    from_username = request.query_params.get("from")
    project = request.query_params.get("project", None)
    task_id = request.query_params.get("taskId", None)
    status = request.query_params.get("status", None)
    user_messages = MessageService.get_all_messages(
        request.user.display_name,
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
    return user_messages.model_dump(by_alias=True), 200


@router.get("/queries/own/count-unread/")
async def get(request: Request):
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
    unread_count = MessageService.has_user_new_messages(request.user.display_name)
    return unread_count, 200


@router.post("/queries/own/post-unread/")
@requires("authenticated")
async def post(request: Request):
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
    user_id = request.user.display_name
    unread_count = NotificationService.update(user_id)
    return unread_count, 200
