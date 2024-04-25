from backend.services.messaging.message_service import MessageService
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

@router.delete("/delete-multiple/")
@requires("authenticated")
async def delete(request: Request):
    """
    Delete specified messages for logged in user
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
        - in: body
          name: body
          required: true
          description: JSON object containing message ids to delete
          schema:
              properties:
                  messageIds:
                      type: array
                      items: integer
                      required: true
    responses:
        200:
            description: Messages deleted
        500:
            description: Internal Server Error
    """
    message_ids = await request.json()["messageIds"]
    if message_ids:
        MessageService.delete_multiple_messages(
            message_ids, request.user.display_name
        )

    return {"Success": "Messages deleted"}, 200


@router.delete("/delete-all/")
@requires("authenticated")
async def delete(request: Request):
    """
    Delete all messages for logged in user
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
          description: Optional message-type filter; leave blank to delete all
    responses:
        200:
            description: Messages deleted
        500:
            description: Internal Server Error
    """
    message_type = request.query_params.get("messageType")
    MessageService.delete_all_messages(request.user.display_name, message_type)
    return {"Success": "Messages deleted"}, 200


@router.post("/mark-as-read-all/")
@requires("authenticated")
async def post(request: Request):
    """
    Mark all messages as read for logged in user
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
          description: Optional message-type filter; leave blank to mark all as read
    responses:
        200:
            description: Messages marked as read
        500:
            description: Internal Server Error
    """
    message_type = request.query_params.get("messageType")
    MessageService.mark_all_messages_read(request.user.display_name, message_type)
    return {"Success": "Messages marked as read"}, 200


@router.post("/mark-as-read-multiple/")
@requires("authenticated")
async def post(request: Request):
    """
    Mark specified messages as read for logged in user
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
        - in: body
          name: body
          required: true
          description: JSON object containing message ids to mark as read
          schema:
              properties:
                  messageIds:
                      type: array
                      items: integer
                      required: true
    responses:
        200:
            description: Messages marked as read
        500:
            description: Internal Server Error
    """
    message_ids = request.json()["messageIds"]
    if message_ids:
        MessageService.mark_multiple_messages_read(
            message_ids, request.user.display_name
        )

    return {"Success": "Messages marked as read"}, 200
