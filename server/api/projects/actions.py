import threading

from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.message_dto import MessageDTO
from server.services.project_admin_service import ProjectAdminService
from server.services.messaging.message_service import MessageService
from server.services.users.authentication_service import token_auth, tm


class ProjectsActionsTransferAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Transfers a project to a new user.
        ---
        tags:
            - projects
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
              description: the username of the new owner
              schema:
                  properties:
                      username:
                        type: string
        responses:
            200:
                description: All tasks reset
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            username = request.get_json()["username"]
            ProjectAdminService.transfer_project_to(
                project_id, tm.authenticated_user_id, username
            )
            return {"Success": "Project Transfered"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to transfer project"}, 500


class ProjectsActionsMessageContributorsAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Send message to all contributors to a project
        ---
        tags:
            - projects
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
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to send message to mappers"}, 400

        try:
            threading.Thread(
                target=MessageService.send_message_to_all_contributors,
                args=(project_id, message_dto),
            ).start()

            return {"Success": "Messages started"}, 200
        except Exception as e:
            error_msg = f"Send message all - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to send messages to mappers"}, 500
