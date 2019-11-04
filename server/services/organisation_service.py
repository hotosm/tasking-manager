from flask import current_app
from sqlalchemy.exc import IntegrityError

from server import db
from server.models.dtos.organisation_dto import (
    OrganisationDTO,
    NewOrganisationDTO,
    ListOrganisationsDTO,
)
from server.models.postgis.organisation import Organisation
from server.models.postgis.project import Project, ProjectInfo
from server.models.postgis.team import Team
from server.models.postgis.utils import NotFound
from server.models.postgis.statuses import OrganisationVisibility
from server.services.users.user_service import UserService


class OrganisationServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling organisations """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class OrganisationService:
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
    def get_teams_by_organisation_id(organisation_id: int) -> Organisation:
        teams = (
            db.session.query(Team.id, Team.name)
            .filter(Team.organisation_id == organisation_id)
            .all()
        )

        if teams is None:
            raise NotFound()

        return teams

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
        except IntegrityError:
            raise OrganisationServiceError(
                f"Organisation name already exists: {new_organisation_dto.name}"
            )

    @staticmethod
    def update_organisation(organisation_dto: OrganisationDTO) -> Organisation:
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
    def assert_validate_name(org: Organisation, name: str):
        """ Validates that the organisation name doesn't exist """
        if org.name != name and Organisation.get_organisation_by_name(name) is not None:
            raise OrganisationServiceError(f"Organisation name already exists: {name}")

    @staticmethod
    def assert_validate_users(organisation_dto: OrganisationDTO):
        """ Validates that the users exist"""
        if len(organisation_dto.admins) == 0:
            raise OrganisationServiceError("Must have at least one admin")

            admins = []
            for user in organisation_dto.admins:
                try:
                    admin = UserService.get_user_by_username(user)
                except NotFound:
                    raise NotFound(f"User {user} does not exist")

                admins.append(admin.username)

            organisation_dto.admins = admins

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
    def user_is_admin(organisation_id: int, user_id: int):
        """ Check that the user is an admin for the org or a global admin"""
        if UserService.is_user_an_admin(user_id):
            return True

        org = Organisation.get(organisation_id)
        user = UserService.get_user_by_id(user_id)

        return user in org.admins

    @staticmethod
    def is_user_an_org_admin(organisation_id: int, user_id: int):
        """ Check that the user is an admin for the org """

        org = Organisation.get(organisation_id)
        user = UserService.get_user_by_id(user_id)

        return user in org.admins

    @staticmethod
    def get_all_organisations_for_user(user_id: int):
        """ Get all organisations that a user can see based on org visibility """
        if UserService.is_user_an_admin(user_id):
            return Organisation().get_all_organisations()

        return Organisation().get_all_organisations_for_user(user_id)

    @staticmethod
    def get_all_organisations_for_user_as_dto(user_id: int):
        orgs = OrganisationService.get_all_organisations_for_user(user_id)
        orgs_dto = ListOrganisationsDTO()
        orgs_dto.organisations = []
        for org in orgs:
            org_dto = OrganisationDTO()
            org_dto.organisation_id = org.id
            org_dto.name = org.name
            org_dto.logo = org.logo
            org_dto.url = org.url
            org_dto.visibility = org.visibility

            orgs_dto.organisations.append(org_dto)

        return orgs_dto

    @staticmethod
    def get_organisation_as_dto(organisation_id: int, user_id: int):
        org = Organisation.get(organisation_id)

        if org is None:
            raise NotFound()

        if user_id == 0:
            logged_in = False
        else:
            logged_in = OrganisationService.user_is_admin(organisation_id, user_id)

        org_dto = OrganisationDTO()

        if org.visibility != OrganisationVisibility.SECRET.value or logged_in:
            org_dto.projects = []
            org_dto.teams = []
            org_dto.admins = []

            org_dto.organisation_id = org.id
            org_dto.name = org.name
            org_dto.logo = org.logo
            org_dto.url = org.url
            org_dto.visibility = OrganisationVisibility(org.visibility).name

            if user_id != 0:
                org_dto.is_admin = OrganisationService.user_is_admin(
                    organisation_id, user_id
                )
            else:
                org_dto.is_admin = False

            teams = OrganisationService.get_teams_by_organisation_id(organisation_id)
            for team in teams:
                org_dto.teams.append([team.id, team.name])

            projects = OrganisationService.get_projects_by_organisation_id(
                organisation_id
            )
            for project in projects:
                org_dto.projects.append([project.id, project.name])

            if org.visibility != OrganisationVisibility.PRIVATE.value:
                for admin in org.admins:
                    org_dto.admins.append(admin.username)

        return org_dto
