from backend.models.postgis.utils import timestamp
from databases import Database
from fastapi import APIRouter, Depends, Request
from loguru import logger
from fastapi.responses import JSONResponse
from backend.db import get_db, get_session
from backend.models.dtos.mapping_dto import TaskCommentDTO
from backend.models.dtos.message_dto import ChatMessageDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.mapping_service import MappingService, MappingServiceError
from backend.services.messaging.chat_service import ChatService
from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import login_required
from backend.services.users.user_service import UserService

session = get_session()


router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)


@router.post("/{project_id}/comments/")
async def post(
    project_id: int,
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Add a message to project chat
    ---
    tags:
        - comments
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
            description: Project ID to attach the chat message to
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object for creating a new mapping license
            schema:
                properties:
                    message:
                        type: string
                        default: This is an awesome project
    responses:
        201:
            description: Message posted successfully
        400:
            description: Invalid Request
        500:
            description: Internal Server Error
    """
    user = await UserService.get_user_by_id(user.id, db)
    if await UserService.is_user_blocked(user.id, db):
        return JSONResponse(
            content={"Error": "User is on read only mode", "SubCode": "ReadOnly"},
            status_code=403,
        )
    request_json = await request.json()
    message = request_json.get("message")
    chat_dto = ChatMessageDTO(
        message=message,
        user_id=user.id,
        project_id=project_id,
        timestamp=timestamp(),
        username=user.username,
    )
    try:
        async with db.transaction():
            project_messages = await ChatService.post_message(
                chat_dto, project_id, user.id, db
            )
            return project_messages
    except ValueError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.get("/{project_id}/comments/")
async def get(request: Request, project_id: int, db: Database = Depends(get_db)):
    """
    Get all chat messages for a project
    ---
    tags:
        - comments
    produces:
        - application/json
    parameters:
        - name: project_id
            in: path
            description: Project ID to attach the chat message to
            required: true
            type: integer
            default: 1
        - in: query
            name: page
            description: Page of results user requested
            type: integer
            default: 1
        - in: query
            name: perPage
            description: Number of elements per page.
            type: integer
            default: 20
    responses:
        200:
            description: All messages
        404:
            description: No chat messages on project
        500:
            description: Internal Server Error
    """
    await ProjectService.exists(project_id, db)
    page = (
        int(request.query_params.get("page")) if request.query_params.get("page") else 1
    )
    per_page = int(request.query_params.get("perPage", 20))
    project_messages = await ChatService.get_messages(project_id, db, page, per_page)
    return project_messages


@router.delete("/{project_id}/comments/{comment_id}/")
async def delete(
    project_id: int,
    comment_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Delete a chat message
    ---
    tags:
      - comments
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
          description: Project ID to attach the chat message to
          required: true
          type: integer
          default: 1
        - name: comment_id
          in: path
          description: Comment ID to delete
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Comment deleted
        403:
            description: User is not authorized to delete comment
        404:
            description: Comment not found
        500:
            description: Internal Server Error
    """
    authenticated_user_id = user.id
    try:
        async with db.transaction():
            await ChatService.delete_project_chat_by_id(
                project_id, comment_id, authenticated_user_id, db
            )
            return JSONResponse(content={"Success": "Comment deleted"}, status_code=200)
    except ValueError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.post("/{project_id}/comments/tasks/{task_id}/")
# TODO Decorator
# @tm.pm_only(False)
async def post(
    request: Request,
    project_id: int,
    task_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Adds a comment to the task outside of mapping/validation
    ---
    tags:
        - comments
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
        - name: task_id
          in: path
          description: Unique task ID
          required: true
          type: integer
          default: 1
        - in: body
          name: body
          required: true
          description: JSON object representing the comment
          schema:
            id: TaskComment
            required:
                - comment
            properties:
                comment:
                    type: string
                    description: user comment about the task
    responses:
        200:
            description: Comment added
        400:
            description: Client Error
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Task not found
        500:
            description: Internal Server Error
    """
    authenticated_user_id = request.user.display_name
    if await UserService.is_user_blocked(authenticated_user_id, db):
        return JSONResponse(
            content={"Error": "User is on read only mode", "SubCode": "ReadOnly"},
            status_code=403,
        )

    try:
        request_json = await request.json()
        comment = request_json.get("comment")
        task_comment = TaskCommentDTO(
            user_id=user.id, task_id=task_id, project_id=project_id, comment=comment
        )
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": "Unable to add comment", "SubCode": "InvalidData"},
            status_code=400,
        )
    try:
        task = await MappingService.add_task_comment(task_comment, db)
        return task
    except MappingServiceError:
        return JSONResponse(content={"Error": "Task update failed"}, status_code=403)


@router.get("/{project_id}/comments/tasks/{task_id}/")
async def get(request: Request, project_id, task_id):
    """
    Get comments for a task
    ---
    tags:
        - comments
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
        - name: task_id
          in: path
          description: Unique task ID
          required: true
          type: integer
          default: 1
        - in: body
          name: body
          required: true
          description: JSON object representing the comment
          schema:
            id: TaskComment
            required:
                - comment
            properties:
                comment:
                    type: string
                    description: user comment about the task
    responses:
        200:
            description: Comment retrieved
        400:
            description: Client Error
        404:
            description: Task not found
        500:
            description: Internal Server Error
    """
    try:
        task_comment = TaskCommentDTO(request.json())
        task_comment.user_id = request.user.display_name
        task_comment.task_id = task_id
        task_comment.project_id = project_id
        task_comment.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": "Unable to fetch task comments",
                "SubCode": "InvalidData",
            },
            status_code=400,
        )

    try:
        # NEW FUNCTION HAS TO BE ADDED
        # task = MappingService.add_task_comment(task_comment)
        # return task.model_dump(by_alias=True), 200
        return
    except MappingServiceError as e:
        return JSONResponse(content={"Error": str(e)}, status_code=403)
