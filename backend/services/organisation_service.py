from flask import current_app
from sqlalchemy.exc import IntegrityError

from backend import db
from backend.models.dtos.organisation_dto import (
    OrganisationDTO,
    NewOrganisationDTO,
    ListOrganisationsDTO,
    UpdateOrganisationDTO,
)
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project import Project, ProjectInfo
from backend.models.postgis.utils import NotFound
from backend.services.users.user_service import UserService


class OrganisationServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling organisations """

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class OrganisationService:
    @staticmethod
    def get_organisation_by_id(organisation_id: int) -> Organisation:
        org = Organisation.get(organisation_id)

        if org is None:
            raise NotFound()

        return org

    @staticmethod
    def get_organisation_by_id_as_dto(
        organisation_id: int, user_id: int, abbreviated: bool
    ):
        org = Organisation.get(organisation_id)

        if org is None:
            raise NotFound()

        organisation_dto = org.as_dto(abbreviated)

        if user_id != 0:
            organisation_dto.is_manager = (
                OrganisationService.can_user_manage_organisation(
                    organisation_id, user_id
                )
            )
        else:
            organisation_dto.is_manager = False

        if abbreviated:
            return organisation_dto

        organisation_dto.teams = [team.as_dto_inside_org() for team in org.teams]

        return organisation_dto

    @staticmethod
    def get_organisation_by_name(organisation_name: str) -> Organisation:
        organisation = Organisation.get_organisation_by_name(organisation_name)

        if organisation is None:
            raise NotFound()

        return organisation

    @staticmethod
    def get_organisation_name_by_id(organisation_id: int) -> str:
        return Organisation.get_organisation_name_by_id(organisation_id)

    @staticmethod
    def create_organisation(new_organisation_dto: NewOrganisationDTO) -> int:
        """
        Creates a new organisation using an organisation dto
        :param new_organisation_dto: Organisation DTO
        :returns: ID of new Organisation
        """
        try:
            org = Organisation.create_from_dto(new_organisation_dto)
            return org.id
        except IntegrityError:
            raise OrganisationServiceError(
                f"Organisation name already exists: {new_organisation_dto.name}"
            )

    @staticmethod
    def update_organisation(organisation_dto: UpdateOrganisationDTO) -> Organisation:
        """
        Updates an organisation
        :param organisation_dto: DTO with updated info
        :returns updated Organisation
        """
        org = OrganisationService.get_organisation_by_id(
            organisation_dto.organisation_id
        )
        OrganisationService.assert_validate_name(org, organisation_dto.name)
        OrganisationService.assert_validate_users(organisation_dto)
        org.update(organisation_dto)
        return org

    @staticmethod
    def delete_organisation(organisation_id: int):
        """ Deletes an organisation if it has no projects """
        org = OrganisationService.get_organisation_by_id(organisation_id)

        if org.can_be_deleted():
            org.delete()
        else:
            raise OrganisationServiceError(
                "Organisation has projects, cannot be deleted"
            )

    @staticmethod
    def get_organisations(manager_user_id: int):
        if manager_user_id is None:
            """ Get all organisations """
            return Organisation.get_all_organisations()
        else:
            return Organisation.get_organisations_managed_by_user(manager_user_id)

    @staticmethod
    def get_organisations_as_dto(
        manager_user_id: int, authenticated_user_id: int, omit_managers: bool
    ):
        orgs = OrganisationService.get_organisations(manager_user_id)
        orgs_dto = ListOrganisationsDTO()
        for org in orgs:
            org_dto = org.as_dto(omit_managers)
            if not authenticated_user_id:
                del org_dto.managers
            orgs_dto.organisations.append(org_dto)

        return orgs_dto

    @staticmethod
    def get_organisations_managed_by_user(user_id: int):
        """ Get all organisations a user manages """
        if UserService.is_user_an_admin(user_id):
            return Organisation.get_all_organisations()

        return Organisation.get_organisations_managed_by_user(user_id)

    @staticmethod
    def get_organisations_managed_by_user_as_dto(user_id: int):
        orgs = OrganisationService.get_organisations_managed_by_user(user_id)
        orgs_dto = ListOrganisationsDTO()
        orgs_dto.organisations = [org.as_dto() for org in orgs]
        return orgs_dto

    @staticmethod
    def get_projects_by_organisation_id(organisation_id: int) -> Organisation:
        projects = (
            db.session.query(Project.id, ProjectInfo.name)
            .join(ProjectInfo)
            .filter(Project.organisation_id == organisation_id)
            .all()
        )

        if projects is None:
            raise NotFound()

        return projects

    @staticmethod
    def assert_validate_name(org: Organisation, name: str):
        """ Validates that the organisation name doesn't exist """
        if org.name != name and Organisation.get_organisation_by_name(name) is not None:
            raise OrganisationServiceError(f"Organisation name already exists: {name}")

    @staticmethod
    def assert_validate_users(organisation_dto: OrganisationDTO):
        """ Validates that the users exist"""
        if organisation_dto.managers and len(organisation_dto.managers) == 0:
            raise OrganisationServiceError("Must have at least one admin")

            managers = []
            for user in organisation_dto.managers:
                try:
                    admin = UserService.get_user_by_username(user)
                except NotFound:
                    raise NotFound(f"User {user} does not exist")

                managers.append(admin.username)

            organisation_dto.managers = managers

    @staticmethod
    def can_user_manage_organisation(organisation_id: int, user_id: int):
        """ Check that the user is an admin for the org or a global admin"""
        if UserService.is_user_an_admin(user_id):
            return True
        else:
            return OrganisationService.is_user_an_org_manager(organisation_id, user_id)

    @staticmethod
    def is_user_an_org_manager(organisation_id: int, user_id: int):
        """ Check that the user is an manager for the org """

        org = Organisation.get(organisation_id)

        if org is None:
            raise NotFound()
        user = UserService.get_user_by_id(user_id)

        return user in org.managers
