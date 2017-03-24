from flask_restful import Resource
from flask import session, current_app
from server import osm


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
        responses:
          302:
            description: Redirects to OSM
        """
        base_url = current_app.config['APP_BASE_URL']
        return osm.authorize(callback=f'{base_url}/api/v1/auth/oauth-callback')


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
        """
        osm_resp = osm.authorized_response()
        if osm_resp is None:
            # TODO auth failed so redirect to login failed
            pass
        else:
            # TODO create authorized handler in client
            session['osm_oauth'] = osm_resp  # Set OAuth details in the session temporarily

        osm_user_details = osm.request('user/details')
        debug = osm_user_details

        # TODO set user details, and generate session token
