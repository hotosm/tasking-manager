from databases import Database
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    responses={404: {"description": "Not found"}},
)


@router.delete("/delete-multiple/")
async def delete_multiple_notifications(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
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
    data = await request.json()
    message_ids = data["messageIds"]
    if message_ids:
        async with db.transaction():
            await MessageService.delete_multiple_messages(message_ids, user.id, db)
    return JSONResponse(content={"Success": "Messages deleted"}, status_code=200)


@router.delete("/delete-all/")
async def delete_all_notifications(
    message_type: str = Query(
        None,
        alias="messageType",
        description="Optional message-type filter; leave blank to delete all",
    ),
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
    async with db.transaction():
        await MessageService.delete_all_messages(user.id, db, message_type)
        return JSONResponse(content={"Success": "Messages deleted"}, status_code=200)


@router.post("/mark-as-read-all/")
async def mark_all_as_read(
    message_type: str = Query(
        None,
        alias="messageType",
        description="Optional message-type filter; leave blank to mark all as read",
    ),
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
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
    await MessageService.mark_all_messages_read(user.id, db, message_type)
    return JSONResponse(content={"Success": "Messages marked as read"}, status_code=200)


@router.post("/mark-as-read-multiple/")
async def mark_multiple_as_read(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
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
    data = await request.json()
    message_ids = data["messageIds"]
    if message_ids:
        await MessageService.mark_multiple_messages_read(message_ids, user.id, db)

    return JSONResponse(content={"Success": "Messages marked as read"}, status_code=200)
