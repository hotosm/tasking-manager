# from flask_restful import , request, current_app
# from schematics.exceptions import Exception

from backend.models.dtos.message_dto import ChatMessageDTO
from backend.models.dtos.mapping_dto import TaskCommentDTO
from backend.services.messaging.chat_service import ChatService
from backend.services.users.user_service import UserService
from backend.services.project_service import ProjectService
from backend.services.mapping_service import MappingService, MappingServiceError
from backend.services.users.authentication_service import tm
from fastapi import APIRouter, Depends, Request
from backend.db.database import get_db
from starlette.authentication import requires
from loguru import logger

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)

# class CommentsProjectsAllAPI():
#     @tm.pm_only(False)
#     @token_auth.login_required
@router.post("/{project_id}/comments/")
@requires("authenticated")
@tm.pm_only(False)
async def post(request: Request, project_id: int):
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
    authenticated_user_id = request.user.display_name
    if UserService.is_user_blocked(authenticated_user_id):
        return {"Error": "User is on read only mode", "SubCode": "ReadOnly"}, 403

    try:
        chat_dto = ChatMessageDTO(request.get_json())
        chat_dto.user_id = authenticated_user_id
        chat_dto.project_id = project_id
        chat_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {
            "Error": "Unable to add chat message",
            "SubCode": "InvalidData",
        }, 400

    try:
        project_messages = ChatService.post_message(
            chat_dto, project_id, authenticated_user_id
        )
        return project_messages.model_dump(by_alias=True), 201
    except ValueError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403

@router.get("/{project_id}/comments/")
async def get(request: Request, project_id):
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
    ProjectService.exists(project_id)
    page = int(request.query_params.get("page")) if request.query_params.get("page") else 1
    per_page = int(request.query_params.get("perPage", 20))
    project_messages = ChatService.get_messages(project_id, page, per_page)
    return project_messages.model_dump(by_alias=True), 200


# class CommentsProjectsRestAPI():
    # @token_auth.login_required
@router.delete("/{project_id}/comments/{comment_id}/")
@requires("authenticated")
async def delete(request: Request, project_id: int, comment_id: int):
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
        authenticated_user_id = request.user.display_name
        try:
            ChatService.delete_project_chat_by_id(
                project_id, comment_id, authenticated_user_id
            )
            return {"Success": "Comment deleted"}, 200
        except ValueError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


# class CommentsTasksRestAPI():
    # @token_auth.login_required
@router.post("/{project_id}/comments/tasks/{task_id}/")
@requires("authenticated")
@tm.pm_only(False)
def post(request: Request, project_id: int, task_id: int):
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
        if UserService.is_user_blocked(authenticated_user_id):
            return {"Error": "User is on read only mode", "SubCode": "ReadOnly"}, 403

        try:
            task_comment = TaskCommentDTO(request.json())
            task_comment.user_id = request.user.display_name
            task_comment.task_id = task_id
            task_comment.project_id = project_id
            task_comment.validate()
        except Exception as e:
            logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to add comment", "SubCode": "InvalidData"}, 400

        try:
            task = MappingService.add_task_comment(task_comment)
            return task.model_dump(by_alias=True), 201
        except MappingServiceError:
            return {"Error": "Task update failed"}, 403

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
            return {
                "Error": "Unable to fetch task comments",
                "SubCode": "InvalidData",
            }, 400

        try:
            # NEW FUNCTION HAS TO BE ADDED
            # task = MappingService.add_task_comment(task_comment)
            # return task.model_dump(by_alias=True), 200
            return
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
