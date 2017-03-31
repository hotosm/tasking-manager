import requests
import xml.etree.ElementTree as ET
from flask import current_app
from typing import Optional
from server.models.postgis.user import User
from server.models.dtos.user_dto import UserDTO


class UserServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when in the User Service """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class UserService:

    @staticmethod
    def get_user_by_username(username: str) -> Optional[UserDTO]:
        """Gets user DTO for supplied username """
        user = User().get_by_username(username)

        if user is None:
            return None

        return user.as_dto()

    @staticmethod
    def is_user_a_project_manager(user_id: int) -> bool:
        """ Is the user a project manager """
        user = User().get_by_id(user_id)

        if user is None:
            return False

        return user.is_project_manager()

    @staticmethod
    def get_osm_details_for_user(username: str):

        user = User().get_by_username(username)

        if user is None:
            return None

        osm_user_details_url = f'http://www.openstreetmap.org/api/0.6/user/{user.id}'
        response = requests.get(osm_user_details_url)

        if response.status_code != 200:
            raise UserServiceError('Bad response from OSM')

        UserService._parse_osm_user_details_response(response.text)

    @staticmethod
    def _parse_osm_user_details_response(osm_response: str):
        root = ET.fromstring(osm_response)

        user_element = root.find('user')
        # TODO if none

        account_created = user_element.attrib['account_created']
        changesets = user_element.find('changesets')
        changeset_count = int(changesets.attrib['count'])


        iain = user_element


