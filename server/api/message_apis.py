from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError
from server.models.dtos.message_dto import MessageDTO
from server.services.authentication_service import token_auth, tm
from server.services.message_service import MessageService


class ProjectsMessageAll(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Send message to all contributors to a project
        ---
        tags:
            - messages
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
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
                description: All mapped tasks validated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            message_dto = MessageDTO(request.get_json())
            message_dto.from_user_id = tm.authenticated_user_id
            message_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            MessageService.send_message_to_all_contributors(project_id, message_dto)
            return {"Success": "Messages sent"}, 200
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class HasNewMessages(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def get(self):
        """
        Gets count of unread messages
        ---
        tags:
          - messages
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
        try:
            unread_messages = MessageService.has_user_new_messages(tm.authenticated_user_id)
            return unread_messages, 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class GetAllMessages(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def get(self):
        """
        Get all messages for logged in user
        ---
        tags:
          - messages
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
                description: Messages found
            404:
                description: User has no messages
            500:
                description: Internal Server Error
        """
        try:
            user_messages = MessageService.get_all_messages(tm.authenticated_user_id)
            return user_messages.to_primitive(), 200
        except Exception as e:
            error_msg = f'Messages GET all - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
