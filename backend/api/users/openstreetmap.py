from flask_restful import Resource

from backend.services.users.authentication_service import token_auth
from backend.services.users.user_service import UserService, OSMServiceError


class UsersOpenStreetMapAPI(Resource):
    @token_auth.login_required
    def get(self, username):
        """
        Get details from OpenStreetMap for a specified username
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded sesesion token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: username
              in: path
              description: Mapper's OpenStreetMap username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User not found
            500:
                description: Internal Server Error
            502:
                description: Bad response from OSM
        """
        try:
            osm_dto = UserService.get_osm_details_for_user(username)
            return osm_dto.to_primitive(), 200
        except OSMServiceError as e:
            return {"Error": str(e)}, 502
