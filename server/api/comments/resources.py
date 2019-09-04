from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.message_dto import ChatMessageDTO
from server.models.dtos.mapping_dto import TaskCommentDTO
from server.models.postgis.utils import NotFound
from server.services.messaging.chat_service import ChatService
from server.services.users.user_service import UserService
from server.services.mapping_service import MappingService, MappingServiceError
from server.services.users.authentication_service import token_auth, tm


class CommentsProjectsRestAPI(Resource):
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
              description: The ID of the project to attach the chat message to
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

        if UserService.is_user_blocked(tm.authenticated_user_id):
            return "User is on read only mode", 403

        try:
            chat_dto = ChatMessageDTO(request.get_json())
            chat_dto.user_id = tm.authenticated_user_id
            chat_dto.project_id = project_id
            chat_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to add chat message"}, 400

        try:
            project_messages = ChatService.post_message(chat_dto)
            return project_messages.to_primitive(), 201
        except Exception as e:
            error_msg = f"Chat PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to add chat message"}, 500

    def get(self, project_id):
        """
        Get all chat messages for project
        ---
        tags:
          - comments
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              description: The ID of the project to attach the chat message to
              required: true
              type: integer
              default: 1
            - in: query
              name: page
              description: Page of results user requested
              type: integer
              default: 1
        responses:
            200:
                description: All messages
            404:
                description: No chat messages on project
            500:
                description: Internal Server Error
        """
        try:
            page = int(request.args.get("page")) if request.args.get("page") else 1
            project_messages = ChatService.get_messages(project_id, page)
            return project_messages.to_primitive(), 200
        except NotFound:
            return {"Error": "No chat messages found for project"}, 404
        except Exception as e:
            error_msg = f"Chat PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch chat messages"}, 500


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
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: The unique task ID
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
        try:
            task_comment = TaskCommentDTO(request.get_json())
            task_comment.user_id = tm.authenticated_user_id
            task_comment.task_id = task_id
            task_comment.project_id = project_id
            task_comment.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to add comment"}, 400

        try:
            task = MappingService.add_task_comment(task_comment)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError:
            return {"Error": "Task update failed"}, 403
        except Exception as e:
            error_msg = f"Task Comment API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Task update failed"}, 500

    def get(self, project_id, task_id):
        """
        Gets comments for a task
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
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: The unique task ID
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
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            task_comment = TaskCommentDTO(request.get_json())
            task_comment.user_id = tm.authenticated_user_id
            task_comment.task_id = task_id
            task_comment.project_id = project_id
            task_comment.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to fetch task comments"}, 400

        try:
            # NEW FUNCTION HAS TO BE ADDED
            # task = MappingService.add_task_comment(task_comment)
            # return task.to_primitive(), 200
            return
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f"Task Comment API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
