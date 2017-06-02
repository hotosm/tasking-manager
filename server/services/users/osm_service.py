import requests
import xml.etree.ElementTree as ET
from flask import current_app

from server.models.dtos.user_dto import UserOSMDTO


class OSMServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when in the User Service """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class OSMService:

    @staticmethod
    def get_osm_details_for_user(user_id: int) -> UserOSMDTO:
        """
        Gets OSM details for the user from OSM API
        :param user_id: user_id in scope
        :raises OSMServiceError
        """
        osm_user_details_url = f'http://www.openstreetmap.org/api/0.6/user/{user_id}'
        response = requests.get(osm_user_details_url)

        if response.status_code != 200:
            raise OSMServiceError('Bad response from OSM')

        return OSMService._parse_osm_user_details_response(response.text)

    @staticmethod
    def _parse_osm_user_details_response(osm_response: str, user_element='user') -> UserOSMDTO:
        """ Parses the OSM user details response and extracts user info """
        root = ET.fromstring(osm_response)

        osm_user = root.find(user_element)
        if osm_user is None:
            raise OSMServiceError('User element not found in OSM response')

        account_created = osm_user.attrib['account_created']
        changesets = osm_user.find('changesets')
        changeset_count = int(changesets.attrib['count'])

        osm_dto = UserOSMDTO()
        osm_dto.account_created = account_created
        osm_dto.changeset_count = changeset_count
        return osm_dto
