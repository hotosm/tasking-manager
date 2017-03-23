from flask_restful import Resource, request
from flask import session
from server import osm


@osm.tokengetter
def get_osm_oauth_token():
    if 'osm_oauth' in session:
        resp = session['osm_oauth']
        return resp['oauth_token'], resp['oauth_token_secret']


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
        callback_url = 'http://localhost:5000/api/v1/auth/oauth'

        #callback_url = url_for('oauthorized', next=request.args.get('next'))
        return osm.authorize(callback=callback_url)
        #return redirect("https://www.openstreetmap.org/oauth/authorize")


class OAuthAPI(Resource):

    def get(self):
        iain = request

        resp = osm.authorized_response()
        if resp is None:
            iain = 'bad'
        else:
            session['osm_oauth'] = resp

        test = osm.request('user/details')
        iain = test




        # TODO return redirect(url_for('index'))

