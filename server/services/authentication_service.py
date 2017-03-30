import base64
from urllib import parse
from flask import current_app
from flask_httpauth import HTTPTokenAuth
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from server.api.utils import TMAPIDecorators
from server.services.user_service import UserService
from server.models.postgis.user import User

token_auth = HTTPTokenAuth(scheme='Token')
tm = TMAPIDecorators()


@token_auth.verify_token
def verify_token(token):
    """ Verify the supplied token and check user role is correct for the requested resource"""
    if not token:
        return False

    decoded_token = base64.b64decode(token).decode('utf-8')

    valid_token, user_id = AuthenticationService.is_valid_token(decoded_token, 604800)
    if not valid_token:
        return False

    if tm.is_pm_only_resource:
        if not UserService.is_user_a_project_manager(user_id):
            return False

    tm.authenticated_user_id = user_id  # Set the user ID on the decorator as a convenience
    return True  # All tests passed token is good for the requested resource


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

        session_token = self.generate_session_token_for_user(osm_id)
        authorized_url = self._generate_authorized_url(username, session_token)

        return authorized_url

    def get_authentication_failed_url(self):
        """ Generates the auth-failed URL for the running app """
        base_url = current_app.config['APP_BASE_URL']
        auth_failed_url = f'{base_url}/auth-failed'
        return auth_failed_url

    @staticmethod
    def generate_session_token_for_user(osm_id: int):
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
    def is_valid_token(token, token_expiry):
        """
        Validates if the supplied token is valid, and hasn't expired.
        :param token: Token to check
        :param token_expiry: When the token expires
        :return: True if token is valid, and user_id contained in token
        """
        serializer = URLSafeTimedSerializer(current_app.secret_key)

        try:
            tokenised_user_id = serializer.loads(token, max_age=token_expiry)
        except SignatureExpired:
            current_app.logger.debug('Token has expired')
            return False, None
        except BadSignature:
            current_app.logger.debug('Bad Token Signature')
            return False, None

        return True, tokenised_user_id
