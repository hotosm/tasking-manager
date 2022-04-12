from flask import current_app, redirect, request
from flask_restful import Resource

from backend import osm
from backend.config import EnvironmentConfig
from backend.services.users.authentication_service import (
    AuthenticationService,
    AuthServiceError,
)


class SystemAuthenticationLoginAPI(Resource):
    def get(self):
        """
        Redirects user to OSM to authenticate
        ---
        tags:
          - system
        produces:
          - application/json
        parameters:
            - in: query
              name: callback_url
              description: Route to redirect user once authenticated
              type: string
              default: /take/me/here
        responses:
          200:
            description: oauth token params
        """
        redirect_uri = request.args.get(
            "redirect_uri", current_app.config["APP_BASE_URL"]
        )
        authorize_url = f"{EnvironmentConfig.OSM_SERVER_URL}/oauth2/authorize"
        state = AuthenticationService.generate_random_state()

        osm.redirect_uri = redirect_uri
        osm.state = state

        login_url, state = osm.authorization_url(authorize_url)
        return {"auth_url": login_url, "state": state}, 200


class SystemAuthenticationCallbackAPI(Resource):
    def get(self):
        """
        Handles the OSM OAuth callback
        ---
        tags:
          - system
        produces:
          - application/json
        responses:
          302:
            description: Redirects to login page, or login failed page
          500:
            description: A problem occurred authenticating the user
          502:
            description: A problem occurred negotiating with the OSM API
        """

        token_url = f"{EnvironmentConfig.OSM_SERVER_URL}/oauth2/token"
        authorization_code = request.args.get("code", None)
        if authorization_code is None:
            return {"Error": "Missing code parameter"}, 500

        email = request.args.get("email_address", None)

        osm_resp = osm.fetch_token(
            token_url=token_url,
            client_secret=EnvironmentConfig.OAUTH_CLIENT_SECRET,
            code=authorization_code,
        )

        if osm_resp is None:
            current_app.logger.critical("No response from OSM")
            return redirect(AuthenticationService.get_authentication_failed_url())

        user_info_url = f"{EnvironmentConfig.OAUTH_API_URL}/user/details.json"
        osm_response = osm.get(user_info_url)  # Get details for the authenticating user

        if osm_response.status_code != 200:
            current_app.logger.critical("Error response from OSM")
            return redirect(AuthenticationService.get_authentication_failed_url())

        try:
            user_params = AuthenticationService.login_user(osm_response.json(), email)
            user_params["session"] = osm_resp
            return user_params, 200
        except AuthServiceError:
            return {"Error": "Unable to authenticate"}, 500


class SystemAuthenticationEmailAPI(Resource):
    def get(self):
        """
        Authenticates user owns email address
        ---
        tags:
          - system
        produces:
          - application/json
        parameters:
            - in: query
              name: username
              type: string
              default: thinkwhere
            - in: query
              name: token
              type: string
              default: 1234dvsdf
        responses:
            301:
                description: Will redirect to email validation page
            500:
                description: Internal Server Error
        """
        try:
            username = request.args.get("username")
            token = request.args.get("token")
            AuthenticationService.authenticate_email_token(username, token)

            return {"Status": "OK"}, 200
        except AuthServiceError:
            return {"Error": "Unable to authenticate"}, 403
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to authenticate"}, 500
