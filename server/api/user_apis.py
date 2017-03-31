from flask_restful import Resource, current_app
from server.services.user_service import UserService, UserServiceError


class UserAPI(Resource):

    def get(self, username):
        """
        Gets basic user information
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
            - name: username
              in: path
              description: The users username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            user_dto = UserService.get_user_by_username(username)

            if user_dto is None:
                return {"Error": "User Not Found"}, 404

            return user_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserOSMAPI(Resource):

    def get(self, username):
        """
        Gets details from OSM for the specified username
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
            - name: username
              in: path
              description: The users username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            404:
                description: User not found
            500:
                description: Internal Server Error
            502:
                description: Bad response from OSM
        """
        try:
            user_dto = UserService.get_osm_details_for_user(username)

            # if user_dto is None:
            #     return {"Error": "User Not Found"}, 404
            #
            # return user_dto.to_primitive(), 200
        except UserServiceError as e:
            return {"Error": str(e)}, 502
        except Exception as e:
            error_msg = f'User OSM GET - unhandled error: {str(e)}'
            current_app.logger.error(error_msg)
            return {"error": error_msg}, 500
