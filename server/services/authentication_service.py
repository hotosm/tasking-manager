from flask import current_app
from server.models.postgis.user import User


class AuthServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when authenticating """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class AuthenticationService:

    def login_user(self, osm_user_details, user_element='user'):

        user = osm_user_details.find(user_element)

        if user is None:
            raise AuthServiceError('User element not found in OSM response')


        changesets = user.find('changesets')

        exists = User.query.get(123)
