from flask_restful import Resource

from backend.services.application_service import ApplicationService
from backend.services.users.authentication_service import token_auth


class SystemApplicationsRestAPI(Resource):
    @token_auth.login_required
    def get(self):
        """
        Gets application keys for a user
        ---
        tags:
          - system
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
            description: User keys retrieved
          404:
            description: User has no keys
          500:
            description: A problem occurred
        """
        tokens = ApplicationService.get_all_tokens_for_logged_in_user(
            token_auth.current_user()
        )
        if len(tokens) == 0:
            return 400
        return tokens.to_primitive(), 200

    @token_auth.login_required
    def post(self):
        """
        Creates an application key for the user
        ---
        tags:
          - system
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
            description: Key generated successfully
          302:
            description: User is not authorized to create a key
          500:
            description: A problem occurred
        """
        token = ApplicationService.create_token(token_auth.current_user())
        return token.to_primitive(), 200

    def patch(self, application_key):
        """
        Checks the validity of an application key
        ---
        tags:
          - system
        produces:
          - application/json
        parameters:
          - in: path
            name: application_key
            description: Application key to test
            type: string
            required: true
            default: 1
        responses:
          200:
            description: Key is valid
          302:
            description: Key is not valid
          500:
            description: A problem occurred
        """
        is_valid = ApplicationService.check_token(application_key)
        if is_valid:
            return 200
        else:
            return 302

    @token_auth.login_required
    def delete(self, application_key):
        """
        Deletes an application key for a user
        ---
        tags:
          - system
        produces:
          - application/json
        parameters:
          - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
          - in: path
            name: application_key
            description: Application key to remove
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
        token = ApplicationService.get_token(application_key)
        if token.user == token_auth.current_user():
            token.delete()
            return 200
        else:
            return 302
