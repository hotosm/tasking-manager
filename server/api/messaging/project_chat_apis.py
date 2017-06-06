from flask_restful import Resource

from server.services.users.authentication_service import token_auth, tm


class ProjectChatAPI(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id):
        """
        Post a message to project chat
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
            200:
                description: Message info
            500:
                description: Internal Server Error
        """
        pass