from flask import current_app
from server.models.dtos.user_dto import UserDTO, UserOSMDTO, UserFilterDTO, UserSearchQuery, UserSearchDTO
from server.models.postgis.user import User, UserRole, MappingLevel
from server.models.postgis.utils import NotFound
from server.services.users.osm_service import OSMService, OSMServiceError
from server.services.messaging.smtp_service import SMTPService


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

        intermediate_level = current_app.config['MAPPER_LEVEL_INTERMEDIATE']
        advanced_level = current_app.config['MAPPER_LEVEL_ADVANCED']

        if changeset_count > advanced_level:
            new_user.mapping_level = MappingLevel.ADVANCED.value
        elif intermediate_level < changeset_count < advanced_level:
            new_user.mapping_level = MappingLevel.INTERMEDIATE.value
        else:
            new_user.mapping_level = MappingLevel.BEGINNER.value

        new_user.create()
        return new_user

    @staticmethod
    def get_user_dto_by_username(requested_username: str, logged_in_user_id: int) -> UserDTO:
        """Gets user DTO for supplied username """
        requested_user = UserService.get_user_by_username(requested_username)
        logged_in_user = UserService.get_user_by_id(logged_in_user_id)

        return requested_user.as_dto(logged_in_user.username)

    @staticmethod
    def update_user_details(user_id: int, user_dto: UserDTO) -> dict:
        """ Update user with info supplied by user, if they add or change their email address a verification mail 
            will be sent """
        user = UserService.get_user_by_id(user_id)

        verification_email_sent = False
        if user_dto.email_address and user.email_address != user_dto.email_address.lower():
            # Send user verification email if they are adding or changing their email address
            SMTPService.send_verification_email(user_dto.email_address.lower(), user.username)
            user.set_email_verified_status(is_verified=False)
            verification_email_sent = True

        user.update(user_dto)
        return dict(verificationEmailSent=verification_email_sent)

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
        osm_dto = OSMService.get_osm_details_for_user(user.id)
        return osm_dto

    @staticmethod
    def check_and_update_mapper_level(user_id: int):
        """ Check users mapping level and update if they have crossed threshold """
        user = UserService.get_user_by_id(user_id)
        user_level = MappingLevel(user.mapping_level)

        if user_level == MappingLevel.ADVANCED:
            return  # User has achieved highest level, so no need to do further checking

        intermediate_level = current_app.config['MAPPER_LEVEL_INTERMEDIATE']
        advanced_level = current_app.config['MAPPER_LEVEL_ADVANCED']

        try:
            osm_details = OSMService.get_osm_details_for_user(user_id)
        except OSMServiceError:
            # Swallow exception as we don't want to blow up the server for this
            current_app.logger.error('Error attempting to update mapper level')
            return

        if osm_details.changeset_count > advanced_level:
            user.mapping_level = MappingLevel.ADVANCED.value
        elif intermediate_level < osm_details.changeset_count < advanced_level:
            user.mapping_level = MappingLevel.INTERMEDIATE.value

        user.save()
        return user
