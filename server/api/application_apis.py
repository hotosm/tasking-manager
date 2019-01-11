from flask_restful import Resource, current_app

from server.services.application_service import ApplicationService
from server.services.users.authentication_service import token_auth


class ApplicationAPI(Resource):

    @token_auth.login_required
    def post(self):
        """
        Creates an application key for the user
        ---
        tags:
          - application
        produces:
          - application/json
        parameters:
          - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            defualt: Token sessionTokenHere==
        responses:
          200:
            description: Key generated successfully
          302:
            description: User is not authorized to create a key
          500:
            description: A problem occurred
        """
        try:
            token = ApplicationService.create_token(tm.authenticated_user_id)
            return token.to_primitive(), 200
        except Exception as e:
            error_msg = f'Application POST API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


    @token_auth.login_required
    def delete(self):
        """
        Deletes an application key for a user
        ---
        tags:
          - application
        produces:
          - application/json
        parameters:
          - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            defualt: Token sessionTokenHere==
          - in: query
            name: token
            description: Token to remove
            type: string
            required: true
            default: 1 
        responses:
          200:
            description: Key deleted successfully
          302:
            description: User is not authorized to delete the key
          404:
            description: Key not found
          500:
            description: A problem occurred
        """
        try:
            token = ApplicationService.get_token_for_logged_in_user(tm.authenticated_user_id, token)
            token.delete()
            return {"ok"}, 200
        except NotFound:
            return {"Error": "Key does not exist for user"}, 404
        except Exception as e:
            error_msg = f'Application DELETE API - unhandleed error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
