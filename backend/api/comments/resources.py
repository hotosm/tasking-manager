from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from backend.models.dtos.message_dto import ChatMessageDTO
from backend.models.dtos.mapping_dto import TaskCommentDTO
from backend.services.messaging.chat_service import ChatService
from backend.services.users.user_service import UserService
from backend.services.project_service import ProjectService
from backend.services.mapping_service import MappingService, MappingServiceError
from backend.services.users.authentication_service import token_auth, tm


class CommentsProjectsAllAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id):
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
        authenticated_user_id = token_auth.current_user()
        if UserService.is_user_blocked(authenticated_user_id):
            return {"Error": "User is on read only mode", "SubCode": "ReadOnly"}, 403

        try:
            chat_dto = ChatMessageDTO(request.get_json())
            chat_dto.user_id = authenticated_user_id
            chat_dto.project_id = project_id
            chat_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Unable to add chat message",
                "SubCode": "InvalidData",
            }, 400

        try:
            project_messages = ChatService.post_message(
                chat_dto, project_id, authenticated_user_id
            )
            return project_messages.to_primitive(), 201
        except ValueError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403

    def get(self, project_id):
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
        page = int(request.args.get("page")) if request.args.get("page") else 1
        per_page = int(request.args.get("perPage", 20))
        project_messages = ChatService.get_messages(project_id, page, per_page)
        return project_messages.to_primitive(), 200


class CommentsProjectsRestAPI(Resource):
    @token_auth.login_required
    def delete(self, project_id, comment_id):
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
        authenticated_user_id = token_auth.current_user()
        try:
            ChatService.delete_project_chat_by_id(
                project_id, comment_id, authenticated_user_id
            )
            return {"Success": "Comment deleted"}, 200
        except ValueError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class CommentsTasksRestAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
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
        authenticated_user_id = token_auth.current_user()
        if UserService.is_user_blocked(authenticated_user_id):
            return {"Error": "User is on read only mode", "SubCode": "ReadOnly"}, 403

        try:
            task_comment = TaskCommentDTO(request.get_json())
            task_comment.user_id = token_auth.current_user()
            task_comment.task_id = task_id
            task_comment.project_id = project_id
            task_comment.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to add comment", "SubCode": "InvalidData"}, 400

        try:
            task = MappingService.add_task_comment(task_comment)
            return task.to_primitive(), 201
        except MappingServiceError:
            return {"Error": "Task update failed"}, 403

    def get(self, project_id, task_id):
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
            task_comment = TaskCommentDTO(request.get_json())
            task_comment.user_id = token_auth.current_user()
            task_comment.task_id = task_id
            task_comment.project_id = project_id
            task_comment.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Unable to fetch task comments",
                "SubCode": "InvalidData",
            }, 400

        try:
            # NEW FUNCTION HAS TO BE ADDED
            # task = MappingService.add_task_comment(task_comment)
            # return task.to_primitive(), 200
            return
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
