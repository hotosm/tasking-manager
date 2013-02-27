from pyramid.response import Response
from pyramid.view import view_config
from xml.etree import ElementTree
from pyramid.httpexceptions import HTTPFound

from sqlalchemy.exc import DBAPIError

from sqlalchemy import (
    desc,
    )

from ..models import (
    DBSession,
    Map,
    User,
    )

from pyramid.security import (
    remember,
    forget,
    authenticated_userid
    )

import urlparse
import oauth2 as oauth

@view_config(route_name='home', renderer='home.jade')
def home(request):

    maps = DBSession.query(Map).order_by(desc(Map.id))

    print authenticated_userid(request)

    return dict(title="home", maps=maps,)

# our oauth key and secret (we're the consumer in the oauth protocol)
# consumer key and secret created by Kate Chapman
CONSUMER_KEY = 'BOFkVgLDXTSMP6VHfiX8MQ'
CONSUMER_SECRET = '4o4uLSqLWMciG2fE2zGncLcdewPNi9wU1To51Iz2E'

# OSM oauth URLs
BASE_URL = 'http://www.openstreetmap.org/oauth'
REQUEST_TOKEN_URL = '%s/request_token' % BASE_URL
ACCESS_TOKEN_URL = '%s/access_token' % BASE_URL
AUTHORIZE_URL = '%s/authorize' % BASE_URL

# OSM user details URL
USER_DETAILS_URL = 'http://api.openstreetmap.org/api/0.6/user/details'

# an oauth consumer instance using our key and secret
consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

@view_config(route_name='login')
def login(request):
    # get the request token
    client = oauth.Client(consumer)
    oauth_callback_url = request.route_url('oauth_callback')
    url = "%s?oauth_callback=%s" % (REQUEST_TOKEN_URL, oauth_callback_url)
    resp, content = client.request(url, "GET")
    if resp['status'] != '200':
        return HTTPBadGateway('The OSM authentication server didn\'t respond correctly')
    request_token = dict(urlparse.parse_qsl(content))
    # store the request token in the session, we'll need in the callback
    session = request.session
    session['request_token'] = request_token
    session['came_from'] = request.params.get('came_from')
    #session.save()
    redirect_url = "%s?oauth_token=%s" % \
            (AUTHORIZE_URL, request_token['oauth_token'])
    return HTTPFound(location=redirect_url)

@view_config(route_name='oauth_callback')
def oauth_callback(request):
    # the request token we have in the user session should be the same
    # as the one passed to the callback
    session = request.session
    request_token = session.get('request_token')
    if request.params.get('oauth_token') != request_token['oauth_token']:
        return HTTPBadRequest('Tokens don\'t match')
    # get the access token
    token = oauth.Token(request_token['oauth_token'],
                        request_token['oauth_token_secret'])
    verifier = request.params.get('oauth_verifier')
    token.set_verifier(verifier)
    client = oauth.Client(consumer, token)
    resp, content = client.request(ACCESS_TOKEN_URL, "POST")
    access_token = dict(urlparse.parse_qsl(content))
    token = access_token['oauth_token']
    token_secret = access_token['oauth_token_secret']
    # get the user details, finally
    token = oauth.Token(token, token_secret)
    client = oauth.Client(consumer, token)
    resp, content = client.request(USER_DETAILS_URL, "GET")
    user_elt = ElementTree.XML(content).find('user')
    # save the user's "display name" in the session
    if 'display_name' in user_elt.attrib:
        username = user_elt.attrib['display_name']
        db_session = DBSession()
        if db_session.query(User).get(username) is None:
            db_session.add(User(username))
            db_session.flush()
        headers = remember(request, username, max_age=20*7*24*60*60)

    # and redirect to the main page
    return HTTPFound(location=session.get('came_from'), headers=headers)

@view_config(route_name='logout')
def logout(request):
    headers = forget(request)
    return HTTPFound(location=request.route_url('home'), headers=headers)

conn_err_msg = """\
Pyramid is having a problem using your SQL database.  The problem
might be caused by one of the following things:

1.  You may need to run the "initialize_osmtm_db" script
    to initialize your database tables.  Check your virtual
    environment's "bin" directory for this script and try to run it.

2.  Your database server may not be running.  Check that the
    database server referred to by the "sqlalchemy.url" setting in
    your "development.ini" file is running.

After you fix the problem, please restart the Pyramid application to
try it again.
"""
