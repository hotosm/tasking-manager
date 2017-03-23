from flask_restful import Resource
from flask import redirect


class LoginAPI(Resource):

    def get(self):
        """
        Redirects user to OSM to login there
        ---
        tags:
          - user
        produces:
          - application/json
        responses:
          302:
            description: Redirect to OSM
        """
        return redirect("https://www.openstreetmap.org/oauth/authorize")
