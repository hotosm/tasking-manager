from flask_restful import Resource, request

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
        message_ids = request.get_json()["messageIds"]
        if message_ids:
            MessageService.delete_multiple_messages(
                message_ids, token_auth.current_user()
            )

        return {"Success": "Messages deleted"}, 200


class NotificationsActionsDeleteAllAPI(Resource):
    @token_auth.login_required
    def delete(self):
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
        message_type = request.args.get("messageType")
        MessageService.delete_all_messages(token_auth.current_user(), message_type)
        return {"Success": "Messages deleted"}, 200


class NotificationsActionsMarkAsReadAllAPI(Resource):
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
        message_type = request.args.get("messageType")
        MessageService.mark_all_messages_read(token_auth.current_user(), message_type)
        return {"Success": "Messages marked as read"}, 200


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
        message_ids = request.get_json()["messageIds"]
        if message_ids:
            MessageService.mark_multiple_messages_read(
                message_ids, token_auth.current_user()
            )

        return {"Success": "Messages marked as read"}, 200
