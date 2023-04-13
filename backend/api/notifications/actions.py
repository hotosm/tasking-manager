from flask_restful import Resource, request, current_app

from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import token_auth, tm


class NotificationsActionsDeleteMultipleAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def delete(self):
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
        try:
            message_ids = request.get_json()["messageIds"]
            if message_ids:
                MessageService.delete_multiple_messages(
                    message_ids, token_auth.current_user()
                )

            return {"Success": "Messages deleted"}, 200
        except Exception as e:
            error_msg = f"DeleteMultipleMessages - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {
                "Error": "Unable to delete messages",
                "SubCode": "InternalServerError",
            }, 500


class NotificationsActionsMarkAllReadAPI(Resource):
    @token_auth.login_required
    def post(self):
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
        responses:
            200:
                description: Messages marked as read
            500:
                description: Internal Server Error
        """
        try:
            MessageService.mark_all_messages_read(token_auth.current_user())
            return {"Success": "Messages marked as read"}, 200
        except Exception as e:
            error_msg = f"MarkAllMessagesRead - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {
                "Error": "Unable to mark messages as read",
                "SubCode": "InternalServerError",
            }, 500


class NotificationsActionsMarkAsReadMultipleAPI(Resource):
    @token_auth.login_required
    def post(self):
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
        try:
            message_ids = request.get_json()["messageIds"]
            if message_ids:
                MessageService.mark_multiple_messages_read(
                    message_ids, token_auth.current_user()
                )

            return {"Success": "Messages marked as read"}, 200
        except Exception as e:
            error_msg = f"MarkMultipleMessagesRead - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {
                "Error": "Unable to mark messages as read",
                "SubCode": "InternalServerError",
            }, 500
