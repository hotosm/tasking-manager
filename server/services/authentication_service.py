import base64
from urllib import parse
from flask import current_app
from flask_httpauth import HTTPTokenAuth
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from server.models.postgis.user import User

token_auth = HTTPTokenAuth(scheme='Token')


@token_auth.verify_token
def verify_token(token):
    if not token:
        return False

    decoded_token = base64.b64decode(token).decode('utf-8')

    # If token check is valid we don't need to do any subsequent testing.  Note that tokens are hardcoded to
    # be good for 7 days (604800 seconds)
    if AuthenticationService.is_valid_token(decoded_token, 604800):
        return True


class AuthServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when authenticating """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class AuthenticationService:
    def login_user(self, osm_user_details, user_element='user') -> str:
        """
        Generates authentication details for user, creating in DB if user is unknown to us
        :param osm_user_details: XML response from OSM
        :param user_element: Exists for unit testing
        :raises AuthServiceError
        :returns Authorized URL with authentication details in query string
        """
        osm_user = osm_user_details.find(user_element)

        if osm_user is None:
            raise AuthServiceError('User element not found in OSM response')

        osm_id = int(osm_user.attrib['id'])
        username = osm_user.attrib['display_name']
        existing_user = User().get_by_id(osm_id)

        if not existing_user:
            changesets = osm_user.find('changesets')
            changeset_count = int(changesets.attrib['count'])

            User.create_from_osm_user_details(osm_id, username, changeset_count)

        session_token = self._generate_session_token_for_user(osm_id)
        authorized_url = self._generate_authorized_url(username, session_token)

        return authorized_url

    def get_authentication_failed_url(self):
        """ Generates the auth-failed URL for the running app """
        base_url = current_app.config['APP_BASE_URL']
        auth_failed_url = f'{base_url}/auth-failed'
        return auth_failed_url

    def _generate_session_token_for_user(self, osm_id: int):
        """
        Generates a unique token with the osm_id and current time embedded within it
        :param osm_id: OSM ID of the user authenticating
        :return: Token
        """
        serializer = URLSafeTimedSerializer(current_app.secret_key)
        return serializer.dumps(osm_id)

    def _generate_authorized_url(self, username, session_token):
        """ Generate URL that we'll redirect the user to once authenticated """
        base_url = current_app.config['APP_BASE_URL']
        # Trailing & added as Angular a bit flaky with parsing querystring
        authorized_url = f'{base_url}/authorized?username={parse.quote(username)}&session_token={session_token}&ng=0'
        return authorized_url

    @staticmethod
    def is_valid_token(token, token_expiry, requested_username=None):
        """
        Validates if the supplied token is valid, and hasn't expired.
        :param token: Token to check
        :param token_expiry: When the token expires
        :param requested_username: The username that was requested from the API, if this is different from the tokenised
          user then the tokenised user is attempting to illegally access other users details
        :return: True if token is valid
        """
        serializer = URLSafeTimedSerializer(current_app.secret_key)

        try:
            tokenised_username = serializer.loads(token, max_age=token_expiry)
        except SignatureExpired:
            app.logger.debug('Token has expired')
            return False
        except BadSignature:
            app.logger.debug('Bad Token Signature')
            return False

        if requested_username is not None:
            # If the requested username is not equal to the tokenised username, then the user is attempting to
            # access a resource that belongs to another user, which is effectively hacking, hence logging out warning
            if tokenised_username != requested_username.lower():
                current_app.logger.warn(
                    'Tokenised user {0}, attempted to access resource belonging to {1}'.format(tokenised_username,
                                                                                               requested_username))
                return False

        return True
