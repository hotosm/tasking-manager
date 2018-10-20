from urllib import parse

from flask import session, current_app, redirect, request
from flask_restful import Resource

from server import osm
from server.services.users.authentication_service import AuthenticationService, AuthServiceError


@osm.tokengetter
def get_oauth_token():
    """ Required by Flask-OAuthlib.  Pulls oauth token from the session so we can make authenticated requests"""
    if 'osm_oauth' in session:
        resp = session['osm_oauth']
        return resp['oauth_token'], resp['oauth_token_secret']


class LoginAPI(Resource):

    def get(self):
        """
        Redirects user to OSM to authenticate
        ---
        tags:
          - authentication
        produces:
          - application/json
        parameters:
            - in: query
              name: redirect_to
              description: Route to redirect user once authenticated
              type: string
              default: /take/me/here
        responses:
          302:
            description: Redirects to OSM
        """
        redirect_query = ''
        redirect_to = request.args.get('redirect_to')
        if redirect_to and 'login' not in redirect_to:
            redirect_query = f'?redirect_to={parse.quote(redirect_to)}'

        base_url = current_app.config['APP_BASE_URL']
        return osm.authorize(callback=f'{base_url}/api/v1/auth/oauth-callback{redirect_query}')


class OAuthAPI(Resource):

    def get(self):
        """
        Handles the OSM OAuth callback
        ---
        tags:
          - authentication
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
        osm_resp = osm.authorized_response()
        if osm_resp is None:
            current_app.logger.critical('No response from OSM')
            return redirect(AuthenticationService.get_authentication_failed_url())
        else:
            session['osm_oauth'] = osm_resp  # Set OAuth details in the session temporarily

        osm_response = osm.request('user/details')  # Get details for the authenticating user

        if osm_response.status != 200:
            current_app.logger.critical('Error response from OSM')
            return redirect(AuthenticationService.get_authentication_failed_url())

        try:
            redirect_to = request.args.get('redirect_to')
            authorized_url = AuthenticationService.login_user(osm_response.data, redirect_to)
            return redirect(authorized_url)  # Redirect to Authentication page on successful authorization :)
        except AuthServiceError as e:
            return {"Error": str(e)}, 500


class AuthEmailAPI(Resource):

    def get(self):
        """
        Authenticates user owns email address
        ---
        tags:
          - authentication
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
            username = request.args.get('username')
            token = request.args.get('token')
            redirect_url = AuthenticationService.authenticate_email_token(username, token)

            return redirect(redirect_url)
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
