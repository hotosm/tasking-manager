from flask_restful import Resource

from backend.services.users.authentication_service import token_auth
from backend.services.users.user_service import UserService


class LicensesActionsAcceptAPI(Resource):
    @token_auth.login_required
    def post(self, license_id):
        """
        Capture user acceptance of license terms
        ---
        tags:
          - licenses
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: license_id
              in: path
              description: License ID terms have been accepted for
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Terms accepted
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User or license not found
            500:
                description: Internal Server Error
        """
        UserService.accept_license_terms(token_auth.current_user(), license_id)
        return {"Success": "Terms Accepted"}, 200
