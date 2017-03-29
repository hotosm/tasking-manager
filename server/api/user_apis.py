from flask_restful import Resource


class UserAPI(Resource):

    def get(self, user_name):
        """
        Gets basic user information
        ---
        tags:
          - user
        produces:
          - application/json
        responses:
          302:
            description: Redirects to OSM
        """
        pass