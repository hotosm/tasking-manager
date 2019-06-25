from flask import current_app
from sqlalchemy.exc import IntegrityError

from server.models.dtos.organisation_dto import OrganisationDTO, NewOrganisationDTO
from server.models.postgis.organisation import Organisation
from server.models.postgis.utils import NotFound
from server.services.users.user_service import UserService


class OrganisationServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling organisations """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class OrganisationService:

    @staticmethod
    def get_organisation_by_id(organisation_id: int) -> Organisation:
        org = Organisation.get(organisation_id)

        if org is None:
            raise NotFound()

        return org

    @staticmethod
    def get_organisation_dto(organisation_id) -> OrganisationDTO:
        """
        Get the organisation DTO
        :param organisation_id: ID of the organisation
        :raises NotFound
        """
        org = OrganisationService.get_organisation_by_id(organisation_id)
        return org.as_dto()

    @staticmethod
    def get_organisation_dto_by_name(organisation_name) -> OrganisationDTO:
        """
        Get the organisation DTO
        :param organisation_name: name of the organisation
        :raises NotFound
        """
        org = OrganisationService.get_organisation_by_name(organisation_name)
        return org.as_dto()

    @staticmethod
    def get_organisation_by_name(organisation_name: str) -> Organisation:
        org = Organisation.get_organisation_by_name(organisation_name)

        if org is None:
            raise NotFound()

        return org

    @staticmethod
    def create_organisation(new_organisation_dto: NewOrganisationDTO) -> int:
        """
        Creates a new organisation using an organisation dto
        :param organisation_dto: Organisation DTO
        :returns: ID of new Organisation
        """
        try:
            org = Organisation().create_from_dto(new_organisation_dto)
            return org.id
        except IntegrityError as e:
            raise OrganisationServiceError(f'Organisation name already exists: {new_organisation_dto.name}')

    @staticmethod
    def update_organisation(organisation_dto: OrganisationDTO) -> Organisation:
        """
        Updates an organisation
        :param organisation_dto: DTO with updated info
        :returns updated Organisation
        """
        org = OrganisationService.get_organisation_by_id(organisation_dto.organisation_id)

        OrganisationService.assert_validate_name(org, organisation_dto.name)

        OrganisationService.assert_validate_users(organisation_dto)

        org.update(organisation_dto)
        return org

    @staticmethod
    def assert_validate_name(org: Organisation, name: str):
        """ Validates that the organisation name doesn't exist """
        if org.name != name and Organisation.get_organisation_by_name(name) is not None:
            raise OrganisationServiceError(f'Organisation name already exists: {name}')

    @staticmethod
    def assert_validate_users(organisation_dto: OrganisationDTO):
        """ Validates that the users exist"""
        if len(organisation_dto.admins) == 0:
            raise OrganisationServiceError('Must have at least one admin')

            admins = []
            for user in organisation_dto.admins:
                try:
                    admin = UserService.get_user_by_username(user)
                except NotFound:
                    raise NotFound(f'User {user} does not exist')

                admins.append(admin.username)

            organisation_dto.admins = admins

    @staticmethod
    def delete_organisation(organisation_id: int):
        """ Deletes an organisation if it has no projects """
        org = OrganisationService.get_organisation_by_id(organisation_id)

        if org.can_be_deleted():
            org.delete()
        else:
            raise OrganisationServiceError('Organisation has projects, cannot be deleted')

    @staticmethod
    def user_is_admin(organisation_id: int, user_id: int):
        """ Check that the user is an admin for the org or a global admin"""
        if UserService.is_user_an_admin(user_id):
            return True

        org = Organisation.get(organisation_id)
        user = UserService.get_user_by_id(user_id)

        return user in org.admins

    @staticmethod
    def get_all_organisations_for_user(user_id: int):
        """ Get all organisations that a user can see based on org visibility """
        if UserService.is_user_an_admin(user_id):
            return Organisation().get_all_organisations()

        return Organisation().get_all_organisations_for_user(user_id)
