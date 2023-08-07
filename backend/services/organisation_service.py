from datetime import datetime
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.sql import extract
from dateutil.relativedelta import relativedelta

from backend import db
from backend.exceptions import NotFound
from backend.models.dtos.organisation_dto import (
    OrganisationDTO,
    NewOrganisationDTO,
    ListOrganisationsDTO,
    UpdateOrganisationDTO,
)
from backend.models.dtos.stats_dto import (
    OrganizationStatsDTO,
    OrganizationProjectsStatsDTO,
    OrganizationTasksStatsDTO,
)
from backend.models.postgis.campaign import campaign_organisations
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project import Project, ProjectInfo
from backend.models.postgis.task import Task
from backend.models.postgis.team import TeamVisibility
from backend.models.postgis.statuses import ProjectStatus, TaskStatus
from backend.services.users.user_service import UserService


class OrganisationServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling organisations"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class OrganisationService:
    @staticmethod
    def get_organisation_by_id(organisation_id: int) -> Organisation:
        org = Organisation.get(organisation_id)

        if org is None:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )

        return org

    @staticmethod
    def get_organisation_by_id_as_dto(
        organisation_id: int, user_id: int, abbreviated: bool
    ):
        org = OrganisationService.get_organisation_by_id(organisation_id)
        return OrganisationService.get_organisation_dto(org, user_id, abbreviated)

    @staticmethod
    def get_organisation_by_slug_as_dto(slug: str, user_id: int, abbreviated: bool):
        org = Organisation.query.filter_by(slug=slug).first()
        if org is None:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND", slug=slug)
        return OrganisationService.get_organisation_dto(org, user_id, abbreviated)

    @staticmethod
    def get_organisation_dto(org, user_id: int, abbreviated: bool):
        if org is None:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND")
        organisation_dto = org.as_dto(abbreviated)

        if user_id != 0:
            organisation_dto.is_manager = (
                OrganisationService.can_user_manage_organisation(org.id, user_id)
            )
        else:
            organisation_dto.is_manager = False

        if abbreviated:
            return organisation_dto

        if organisation_dto.is_manager:
            organisation_dto.teams = [team.as_dto_inside_org() for team in org.teams]
        else:
            organisation_dto.teams = [
                team.as_dto_inside_org()
                for team in org.teams
                if team.visibility == TeamVisibility.PUBLIC.value
            ]

        return organisation_dto

    @staticmethod
    def get_organisation_by_name(organisation_name: str) -> Organisation:
        organisation = Organisation.get_organisation_by_name(organisation_name)

        if organisation is None:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_name=organisation_name
            )

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
                f"NameExists- Organisation name already exists: {new_organisation_dto.name}"
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
        """Deletes an organisation if it has no projects"""
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
            """Get all organisations"""
            return Organisation.get_all_organisations()
        else:
            return Organisation.get_organisations_managed_by_user(manager_user_id)

    @staticmethod
    def get_organisations_as_dto(
        manager_user_id: int,
        authenticated_user_id: int,
        omit_managers: bool,
        omit_stats: bool,
    ):
        orgs = OrganisationService.get_organisations(manager_user_id)
        orgs_dto = ListOrganisationsDTO()
        for org in orgs:
            org_dto = org.as_dto(omit_managers)
            if not omit_stats:
                year = datetime.today().strftime("%Y")
                org_dto.stats = OrganisationService.get_organisation_stats(org.id, year)
            if not authenticated_user_id:
                del org_dto.managers
            orgs_dto.organisations.append(org_dto)

        return orgs_dto

    @staticmethod
    def get_organisations_managed_by_user(user_id: int):
        """Get all organisations a user manages"""
        if UserService.is_user_an_admin(user_id):
            return Organisation.get_all_organisations()

        return Organisation.get_organisations_managed_by_user(user_id)

    @staticmethod
    def get_organisations_managed_by_user_as_dto(user_id: int) -> ListOrganisationsDTO:
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
            raise NotFound(
                sub_code="PROJECTS_NOT_FOUND", organisation_id=organisation_id
            )

        return projects

    @staticmethod
    def get_organisation_stats(
        organisation_id: int, year: int = None
    ) -> OrganizationStatsDTO:
        projects = db.session.query(
            Project.id, Project.status, Project.last_updated, Project.created
        ).filter(Project.organisation_id == organisation_id)
        if year:
            start_date = f"{year}/01/01"
            projects = projects.filter(Project.created.between(start_date, func.now()))

        published_projects = projects.filter(
            Project.status == ProjectStatus.PUBLISHED.value
        )
        active_tasks = db.session.query(
            Task.id, Task.project_id, Task.task_status
        ).filter(Task.project_id.in_([i.id for i in published_projects.all()]))

        # populate projects stats
        projects_dto = OrganizationProjectsStatsDTO()
        projects_dto.draft = projects.filter(
            Project.status == ProjectStatus.DRAFT.value
        ).count()
        projects_dto.published = published_projects.count()
        projects_dto.archived = projects.filter(
            Project.status == ProjectStatus.ARCHIVED.value
        ).count()
        projects_dto.recent = projects.filter(
            Project.status.in_(
                [ProjectStatus.ARCHIVED.value, ProjectStatus.PUBLISHED.value]
            ),
            extract("year", Project.created) == datetime.now().year,
        ).count()
        projects_dto.stale = projects.filter(
            Project.status == ProjectStatus.PUBLISHED.value,
            func.DATE(Project.last_updated) < datetime.now() + relativedelta(months=-6),
        ).count()

        # populate tasks stats
        tasks_dto = OrganizationTasksStatsDTO()
        tasks_dto.ready = active_tasks.filter(
            Task.task_status == TaskStatus.READY.value
        ).count()
        tasks_dto.locked_for_mapping = active_tasks.filter(
            Task.task_status == TaskStatus.LOCKED_FOR_MAPPING.value
        ).count()
        tasks_dto.mapped = active_tasks.filter(
            Task.task_status == TaskStatus.MAPPED.value
        ).count()
        tasks_dto.locked_for_validation = active_tasks.filter(
            Task.task_status == TaskStatus.LOCKED_FOR_VALIDATION.value
        ).count()
        tasks_dto.validated = active_tasks.filter(
            Task.task_status == TaskStatus.VALIDATED.value
        ).count()
        tasks_dto.invalidated = active_tasks.filter(
            Task.task_status == TaskStatus.INVALIDATED.value
        ).count()
        tasks_dto.badimagery = active_tasks.filter(
            Task.task_status == TaskStatus.BADIMAGERY.value
        ).count()

        # populate and return main dto
        stats_dto = OrganizationStatsDTO()
        stats_dto.projects = projects_dto
        stats_dto.active_tasks = tasks_dto
        return stats_dto

    @staticmethod
    def assert_validate_name(org: Organisation, name: str):
        """Validates that the organisation name doesn't exist"""
        if org.name != name and Organisation.get_organisation_by_name(name) is not None:
            raise OrganisationServiceError(
                f"NameExists- Organisation name already exists: {name}"
            )

    @staticmethod
    def assert_validate_users(organisation_dto: OrganisationDTO):
        """Validates that the users exist"""
        if organisation_dto.managers and len(organisation_dto.managers) == 0:
            raise OrganisationServiceError(
                "MustHaveAdmin- Must have at least one admin"
            )

        if organisation_dto.managers and len(organisation_dto.managers) > 0:
            managers = []
            for user in organisation_dto.managers:
                try:
                    admin = UserService.get_user_by_username(user)
                except NotFound:
                    raise NotFound(sub_code="USER_NOT_FOUND", username=user)

                managers.append(admin.username)

            organisation_dto.managers = managers

    @staticmethod
    def can_user_manage_organisation(organisation_id: int, user_id: int):
        """Check that the user is an admin for the org or a global admin"""
        if UserService.is_user_an_admin(user_id):
            return True
        else:
            return OrganisationService.is_user_an_org_manager(organisation_id, user_id)

    @staticmethod
    def is_user_an_org_manager(organisation_id: int, user_id: int):
        """Check that the user is an manager for the org"""

        org = Organisation.get(organisation_id)

        if org is None:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )
        user = UserService.get_user_by_id(user_id)

        return user in org.managers

    @staticmethod
    def get_campaign_organisations_as_dto(campaign_id: int, user_id: int):
        """
        Returns organisations under a particular campaign
        """
        organisation_list_dto = ListOrganisationsDTO()
        orgs = (
            Organisation.query.join(campaign_organisations)
            .filter(campaign_organisations.c.campaign_id == campaign_id)
            .all()
        )

        for org in orgs:
            if user_id != 0:
                logged_in = OrganisationService.can_user_manage_organisation(
                    org.id, user_id
                )
            else:
                logged_in = False

            organisation_dto = OrganisationDTO()
            organisation_dto.organisation_id = org.id
            organisation_dto.name = org.name
            organisation_dto.logo = org.logo
            organisation_dto.url = org.url
            organisation_dto.is_manager = logged_in

            organisation_list_dto.organisations.append(organisation_dto)

        return organisation_list_dto
