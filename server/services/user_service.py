import requests
import xml.etree.ElementTree as ET
from flask import current_app
from server.models.dtos.user_dto import UserDTO, UserOSMDTO
from server.models.postgis.user import User, UserRole, MappingLevel
from server.models.postgis.utils import NotFound

INTERMEDIATE_MAPPER_LEVEL = 250
ADVANCED_MAPPER_LEVEL = 500


class UserServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when in the User Service """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class UserService:

    @staticmethod
    def get_user_by_id(user_id: int) -> User:
        user = User().get_by_id(user_id)

        if user is None:
            raise NotFound()

        return user

    @staticmethod
    def get_user_by_username(username: str) -> User:
        user = User().get_by_username(username)

        if user is None:
            raise NotFound()

        return user

    @staticmethod
    def register_user(osm_id, username, changeset_count):
        """
        Creates user in DB 
        :param osm_id: Unique OSM user id
        :param username: OSM Username
        :param changeset_count: OSM changeset count
        """
        new_user = User()
        new_user.id = osm_id
        new_user.username = username

        if changeset_count > ADVANCED_MAPPER_LEVEL:
            new_user.mapping_level = MappingLevel.ADVANCED.value
        elif INTERMEDIATE_MAPPER_LEVEL < changeset_count < ADVANCED_MAPPER_LEVEL:
            new_user.mapping_level = MappingLevel.INTERMEDIATE.value
        else:
            new_user.mapping_level = MappingLevel.BEGINNER.value

        new_user.create()
        return new_user

    @staticmethod
    def get_user_dto_by_username(username: str) -> UserDTO:
        """Gets user DTO for supplied username """
        user = UserService.get_user_by_username(username)
        return user.as_dto()

    @staticmethod
    def is_user_a_project_manager(user_id: int) -> bool:
        """ Is the user a project manager """
        user = UserService.get_user_by_id(user_id)
        if UserRole(user.role) in [UserRole.ADMIN, UserRole.PROJECT_MANAGER]:
            return True

        return False

    @staticmethod
    def get_mapping_level(user_id: int):
        """ Gets mapping level user is at"""
        user = UserService.get_user_by_id(user_id)

        return MappingLevel(user.mapping_level)

    @staticmethod
    def is_user_validator(user_id: int) -> bool:
        """ Determines if user is a validator """
        user = UserService.get_user_by_id(user_id)

        if UserRole(user.role) in [UserRole.VALIDATOR, UserRole.ADMIN, UserRole.PROJECT_MANAGER]:
            return True

        return False

    @staticmethod
    def upsert_mapped_projects(user_id: int, project_id: int):
        """ Add project to mapped projects if it doesn't exist, otherwise return """
        User.upsert_mapped_projects(user_id, project_id)

    @staticmethod
    def get_mapped_projects(user_id: int, preferred_locale: str):
        """ Gets all projects a user has mapped or validated on """
        return User.get_mapped_projects(user_id, preferred_locale)

    @staticmethod
    def get_osm_details_for_user(username: str) -> UserOSMDTO:
        """
        Gets OSM details for the user from OSM API
        :param username: username in scope
        :raises UserServiceError, NotFound
        """
        user = UserService.get_user_by_username(username)
        osm_user_details_url = f'http://www.openstreetmap.org/api/0.6/user/{user.id}'
        response = requests.get(osm_user_details_url)

        if response.status_code != 200:
            raise UserServiceError('Bad response from OSM')

        return UserService._parse_osm_user_details_response(response.text)

    @staticmethod
    def _parse_osm_user_details_response(osm_response: str, user_element='user') -> UserOSMDTO:
        """ Parses the OSM user details response and extracts user info """
        root = ET.fromstring(osm_response)

        osm_user = root.find(user_element)
        if osm_user is None:
            raise UserServiceError('User element not found in OSM response')

        account_created = osm_user.attrib['account_created']
        changesets = osm_user.find('changesets')
        changeset_count = int(changesets.attrib['count'])

        osm_dto = UserOSMDTO()
        osm_dto.account_created = account_created
        osm_dto.changeset_count = changeset_count
        return osm_dto
