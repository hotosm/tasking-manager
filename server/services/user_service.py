import requests
import xml.etree.ElementTree as ET
from flask import current_app
from server.models.dtos.user_dto import UserDTO, UserOSMDTO, UserFilterDTO, UserSearchQuery, UserSearchDTO
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
    def update_user_details(user_id: int, user_dto: UserDTO):
        user = UserService.get_user_by_id(user_id)

        if user.email_address != user_dto.email_address:
            # TODO send verification email
            pass

        user.update(user_dto)

    @staticmethod
    def get_all_users(query: UserSearchQuery) -> UserSearchDTO:
        """ Gets paginated list of users """
        return User.get_all_users(query)

    @staticmethod
    def filter_users(username: str, page: int) -> UserFilterDTO:
        """ Gets paginated list of users, filtered by username, for autocomplete """
        return User.filter_users(username, page)

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
    def get_mapped_projects(user_name: str, preferred_locale: str):
        """ Gets all projects a user has mapped or validated on """
        user = UserService.get_user_by_username(user_name)
        return User.get_mapped_projects(user.id, preferred_locale)

    @staticmethod
    def add_role_to_user(admin_user_id: int, username: str, role: str):
        """
        Add role to user
        :param admin_user_id: ID of admin attempting to add the role 
        :param username: Username of user the role should be added to
        :param role: The requested role
        :raises UserServiceError
        """
        try:
            requested_role = UserRole[role.upper()]
        except KeyError:
            raise UserServiceError(f'Unknown role {role} accepted values are ADMIN, PROJECT_MANAGER, VALIDATOR')

        admin = UserService.get_user_by_id(admin_user_id)
        admin_role = UserRole(admin.role)

        if admin_role == UserRole.PROJECT_MANAGER and requested_role == UserRole.ADMIN:
            raise UserServiceError(f'You must be an Admin to assign Admin role')

        user = UserService.get_user_by_username(username)
        user.set_user_role(requested_role)

    @staticmethod
    def set_user_mapping_level(username: str, level: str) -> User:
        """
        Sets the users mapping level
        :raises: UserServiceError 
        """
        try:
            requested_level = MappingLevel[level.upper()]
        except KeyError:
            raise UserServiceError(f'Unknown role {level} accepted values are BEGINNER, INTERMEDIATE, ADVANCED')

        user = UserService.get_user_by_username(username)
        user.set_mapping_level(requested_level)

        return user

    @staticmethod
    def accept_license_terms(user_id: int, license_id: int):
        """ Saves the fact user has accepted license terms """
        user = UserService.get_user_by_id(user_id)
        user.accept_license_terms(license_id)

    @staticmethod
    def has_user_accepted_license(user_id: int, license_id: int):
        """ Checks if user has accepted specified license """
        user = UserService.get_user_by_id(user_id)
        return user.has_user_accepted_licence(license_id)

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
