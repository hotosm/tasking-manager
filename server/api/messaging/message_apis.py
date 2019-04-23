import threading

from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.message_dto import MessageDTO
from server.services.messaging.message_service import MessageService, NotFound, MessageServiceError
from server.services.users.authentication_service import token_auth, tm


class ProjectsMessageAll(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Send message to all contributors to a project
        ---
        tags:
            - messaging
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
            threading.Thread(target=MessageService.send_message_to_all_contributors,
                             args=(project_id, message_dto)).start()

            return {"Success": "Messages started"}, 200
        except Exception as e:
            error_msg = f'Send message all - unhandled error: {str(e)}'
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
          - messaging
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
          - messaging
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
              description: Optional message-type filter
              type: integer
            - in: query
              name: from
              description: Optional from username filter
              type: string
            - in: query
              name: project
              description: Optional project filter
              type: string
            - in: query
              name: taskId
              description: Optional task filter
              type: integer
            - in: query
              name: sortBy
              description: field to sort by, defaults to date
              type: string
            - in: query
              name: sortDirection
              description: direction of sort, defaults to desc
              type: string
            - in: query
              name: page
              description: Page of results user requested
              type: integer
            - in: query
              name: pageSize
              description: Size of page, defaults to 10
              type: integer
        responses:
            200:
                description: Messages found
            404:
                description: User has no messages
            500:
                description: Internal Server Error
        """
        try:
            preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            page = request.args.get('page', 1, int)
            page_size = request.args.get('pageSize', 10, int)
            sort_by = request.args.get('sortBy')
            sort_direction = request.args.get('sortDirection')
            message_type = request.args.get('messageType', None, int)
            from_username = request.args.get('from')
            project = request.args.get('project')
            task_id = request.args.get('taskId', None, int)
            user_messages = MessageService.get_all_messages(tm.authenticated_user_id, preferred_locale,
                                                            page, page_size, sort_by, sort_direction,
                                                            message_type, from_username, project, task_id)
            return user_messages.to_primitive(), 200
        except NotFound:
            return {"Error": "No messages found"}, 404
        except Exception as e:
            error_msg = f'Messages GET all - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class DeleteMultipleMessages(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def delete(self):
        """
        Delete specified messages for logged in user
        ---
        tags:
          - messaging
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
            message_ids = request.get_json()['messageIds']
            if message_ids:
                MessageService.delete_multiple_messages(message_ids, tm.authenticated_user_id)

            return {"Success": "Messages deleted"}, 200
        except Exception as e:
            error_msg = f'DeleteMultipleMessages - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class MessagesAPI(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, message_id):
        """
        Gets the specified message
        ---
        tags:
          - messaging
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: message_id
              in: path
              description: The unique message
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Messages found
            403:
                description: Forbidden, if user attempting to ready other messages
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            user_message = MessageService.get_message_as_dto(message_id, tm.authenticated_user_id)
            return user_message.to_primitive(), 200
        except MessageServiceError as e:
            return {"Error": str(e)}, 403
        except NotFound:
            return {"Error": "No messages found"}, 404
        except Exception as e:
            error_msg = f'Messages GET all - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only(False)
    @token_auth.login_required
    def delete(self, message_id):
        """
        Deletes the specified message
        ---
        tags:
          - messaging
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: message_id
              in: path
              description: The unique message
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Messages found
            403:
                description: Forbidden, if user attempting to ready other messages
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            MessageService.delete_message(message_id, tm.authenticated_user_id)
            return {"Success": "Message deleted"}, 200
        except MessageServiceError as e:
            return {"Error": str(e)}, 403
        except NotFound:
            return {"Error": "No messages found"}, 404
        except Exception as e:
            error_msg = f'Messages GET all - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ResendEmailValidationAPI(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def post(self):
        """
        Resends the validation user to the logged in user
        ---
        tags:
          - messaging
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
                description: Resends the user their email verification email
            500:
                description: Internal Server Error
        """
        try:
            MessageService.resend_email_validation(tm.authenticated_user_id)
            return {"Success": "Verification email resent"}, 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
