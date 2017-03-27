from flask import current_app
from server.models.postgis.user import User


class AuthServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when authenticating """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class AuthenticationService:

    def login_user(self, osm_user_details, user_element='user'):

        osm_user = osm_user_details.find(user_element)

        if osm_user is None:
            raise AuthServiceError('User element not found in OSM response')

        osm_id = int(osm_user.attrib['id'])
        existing_user = User().get(osm_id)

        if not existing_user:
            username = osm_user.attrib['display_name']
            changesets = osm_user.find('changesets')
            changeset_count = int(changesets.attrib['count'])

            User.create_from_osm_user_details(osm_id, username, changeset_count)

        # TODO create session token

