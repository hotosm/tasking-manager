from flask_restful import Resource, request, current_app

from server.services.messaging.message_service import MessageService
from server.services.users.authentication_service import token_auth, tm


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
                    message_ids, tm.authenticated_user_id
                )

            return {"Success": "Messages deleted"}, 200
        except Exception as e:
            error_msg = f"DeleteMultipleMessages - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to delete messages"}, 500
