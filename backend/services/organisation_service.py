from datetime import datetime
# from flask import current_app
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
from backend.models.postgis.team import Team, TeamVisibility
from backend.models.postgis.statuses import ProjectStatus, TaskStatus
from backend.services.users.user_service import UserService
from backend.db import get_session
session = get_session()
from sqlalchemy import select
from sqlalchemy.orm import selectinload


class OrganisationServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling organisations"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class OrganisationService:

    @staticmethod
    async def get_organisation_by_id(organisation_id: int, session) -> Organisation:
        # Use eager loading to fetch projects and teams along with the organisation
        query = select(Organisation).where(Organisation.id == organisation_id).options(selectinload(Organisation.managers), selectinload(Organisation.teams))
        org = await session.execute(query)
        org = await session.get(Organisation, organisation_id)
        if org is None:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )
        return org

    @staticmethod
    async def get_organisation_by_id_as_dto(
        organisation_id: int, user_id: int, abbreviated: bool, session
    ):
        org = await OrganisationService.get_organisation_by_id(organisation_id, session)
        return await OrganisationService.get_organisation_dto(org, user_id, abbreviated, session)


    @staticmethod
    async def get_organisation_by_slug_as_dto(slug: str, user_id: int, abbreviated: bool, session):
        stmt = select(Organisation).where(Organisation.slug == slug).options(selectinload(Organisation.managers),selectinload(Organisation.teams))
        result = await session.execute(stmt)
        org = result.scalars().first()
        if org is None:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND", slug=slug)
        return await OrganisationService.get_organisation_dto(org, user_id, abbreviated, session)


    @staticmethod
    async def get_organisation_dto(org, user_id: int, abbreviated: bool, session):
        
        if org is None:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND")
        
        # org = await session.execute(
        #     select(Organisation)
        #     .options(selectinload(Organisation.managers), selectinload(Organisation.teams))
        #     .filter_by(id=org.id)
        # )
        # org = org.scalars().first()
        organisation_dto = org.as_dto(abbreviated)
        
        if user_id != 0:
            organisation_dto.is_manager = await (
                OrganisationService.can_user_manage_organisation(org.id, user_id, session)
            )
        else:
            organisation_dto.is_manager = False

        if abbreviated:
            return organisation_dto
        
        if organisation_dto.is_manager:
            organisation_dto.teams = [team.as_dto_inside_org() for team in org.teams]
        else:
            organisation_dto.teams = [
                await team.as_dto_inside_org(session)
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
    async def create_organisation(new_organisation_dto: NewOrganisationDTO, session) -> int:
        """
        Creates a new organisation using an organisation dto
        :param new_organisation_dto: Organisation DTO
        :returns: ID of new Organisation
        """
        try:
            org = await Organisation.create_from_dto(new_organisation_dto, session)
            await session.refresh(org)  # Explicitly refresh the object
            return org.id
        except IntegrityError:
            raise OrganisationServiceError(
                f"NameExists- Organisation name already exists: {new_organisation_dto.name}"
            )

    @staticmethod
    async def update_organisation(organisation_dto: UpdateOrganisationDTO, session) -> Organisation:
        """
        Updates an organisation
        :param organisation_dto: DTO with updated info
        :returns updated Organisation
        """
        org = await OrganisationService.get_organisation_by_id(
            organisation_dto.organisation_id, session
        )
        OrganisationService.assert_validate_name(org, organisation_dto.name, session)
        OrganisationService.assert_validate_users(organisation_dto, session)
        await org.update(organisation_dto, session)
        return org

    @staticmethod
    async def delete_organisation(organisation_id: int, session):
        """Deletes an organisation if it has no projects"""
        org = await OrganisationService.get_organisation_by_id(organisation_id, session)

        if org.can_be_deleted():
            await session.delete(org)
            await session.commit()

        else:
            raise OrganisationServiceError(
                "Organisation has projects, cannot be deleted"
            )

    @staticmethod
    async def get_organisations(manager_user_id: int, session):
        if manager_user_id is None:
            """Get all organisations"""
            return await Organisation.get_all_organisations(session)
        else:
            return await Organisation.get_organisations_managed_by_user(manager_user_id, session)

    @staticmethod
    async def get_organisations_as_dto(
        manager_user_id: int,
        authenticated_user_id: int,
        omit_managers: bool,
        omit_stats: bool,
        session
    ):
        orgs = await OrganisationService.get_organisations(manager_user_id, session)
        orgs_dto = ListOrganisationsDTO()
        for org in orgs:
            org_dto = org.as_dto(omit_managers)
            if not omit_stats:
                year = datetime.today().strftime("%Y")
                org_dto.stats = await OrganisationService.get_organisation_stats(org.id, session, year)
            if not authenticated_user_id:
                del org_dto.managers
            orgs_dto.organisations.append(org_dto)
        return orgs_dto

    @staticmethod
    async def get_organisations_managed_by_user(user_id: int, session):
        """Get all organisations a user manages"""
        if await UserService.is_user_an_admin(user_id, session):
            return await Organisation.get_all_organisations()

        return await Organisation.get_organisations_managed_by_user(user_id, session)

    @staticmethod
    async def get_organisations_managed_by_user_as_dto(user_id: int, session) -> ListOrganisationsDTO:

        orgs = await OrganisationService.get_organisations_managed_by_user(user_id, session)
        orgs_dto = ListOrganisationsDTO()

        # Fetch managers asynchronously for each organisation
        for org in orgs:
            await org.fetch_managers(session) 
            orgs_dto.organisations.append(org.as_dto())
        return orgs_dto
    
        # orgs_dto.organisations = [org.as_dto() for org in orgs]
        # return orgs_dto

    @staticmethod
    def get_projects_by_organisation_id(organisation_id: int) -> Organisation:
        projects = (
            session.query(Project.id, ProjectInfo.name)
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
    async def get_organisation_stats(organisation_id: int, session, year: int = None) -> OrganizationStatsDTO:
        projects_query = select(Project.id, Project.status, Project.last_updated, Project.created).where(
            Project.organisation_id == organisation_id
        )

        if year:
            # Ensure year is an integer
            year = int(year)
            start_date = datetime(year, 1, 1)
            projects_query = projects_query.where(Project.created.between(start_date, func.now()))

        # Fetch the published projects
        published_projects_query = projects_query.where(Project.status == ProjectStatus.PUBLISHED.value)
        published_projects_result = await session.execute(published_projects_query)
        published_projects_ids = [row[0] for row in published_projects_result.fetchall()]

        # Build the base query for active tasks
        active_tasks_query = select(Task.id, Task.project_id, Task.task_status).where(
            Task.project_id.in_(published_projects_ids)
        )
        # Execute the queries asynchronously and count results
        projects_dto = OrganizationProjectsStatsDTO()

        draft_count = await session.scalar(select(func.count()).select_from(projects_query.where(Project.status == ProjectStatus.DRAFT.value).subquery()))
        published_count = await session.scalar(select(func.count()).select_from(published_projects_query.subquery()))
        archived_count = await session.scalar(select(func.count()).select_from(projects_query.where(Project.status == ProjectStatus.ARCHIVED.value).subquery()))
        recent_count = await session.scalar(
            select(func.count()).select_from(
                projects_query.where(
                    Project.status.in_([ProjectStatus.ARCHIVED.value, ProjectStatus.PUBLISHED.value]),
                    extract("year", Project.created) == datetime.now().year
                ).subquery()
            )
        )
        stale_count = await session.scalar(
            select(func.count()).select_from(
                projects_query.where(
                    Project.status == ProjectStatus.PUBLISHED.value,
                    func.DATE(Project.last_updated) < datetime.now() + relativedelta(months=-6)
                ).subquery()
            )
        )

        projects_dto.draft = draft_count
        projects_dto.published = published_count
        projects_dto.archived = archived_count
        projects_dto.recent = recent_count
        projects_dto.stale = stale_count

        # Execute the queries for tasks asynchronously and count results
        tasks_dto = OrganizationTasksStatsDTO()

        ready_count = await session.scalar(select(func.count()).select_from(active_tasks_query.where(Task.task_status == TaskStatus.READY.value).subquery()))
        locked_for_mapping_count = await session.scalar(select(func.count()).select_from(active_tasks_query.where(Task.task_status == TaskStatus.LOCKED_FOR_MAPPING.value).subquery()))
        mapped_count = await session.scalar(select(func.count()).select_from(active_tasks_query.where(Task.task_status == TaskStatus.MAPPED.value).subquery()))
        locked_for_validation_count = await session.scalar(select(func.count()).select_from(active_tasks_query.where(Task.task_status == TaskStatus.LOCKED_FOR_VALIDATION.value).subquery()))
        validated_count = await session.scalar(select(func.count()).select_from(active_tasks_query.where(Task.task_status == TaskStatus.VALIDATED.value).subquery()))
        invalidated_count = await session.scalar(select(func.count()).select_from(active_tasks_query.where(Task.task_status == TaskStatus.INVALIDATED.value).subquery()))
        badimagery_count = await session.scalar(select(func.count()).select_from(active_tasks_query.where(Task.task_status == TaskStatus.BADIMAGERY.value).subquery()))

        tasks_dto.ready = ready_count
        tasks_dto.locked_for_mapping = locked_for_mapping_count
        tasks_dto.mapped = mapped_count
        tasks_dto.locked_for_validation = locked_for_validation_count
        tasks_dto.validated = validated_count
        tasks_dto.invalidated = invalidated_count
        tasks_dto.badimagery = badimagery_count

        # Populate and return the main DTO
        stats_dto = OrganizationStatsDTO()
        stats_dto.projects = projects_dto
        stats_dto.active_tasks = tasks_dto

        return stats_dto

    @staticmethod
    async def assert_validate_name(org: Organisation, name: str, session):
        """Validates that the organisation name doesn't exist"""
        if org.name != name and await Organisation.get_organisation_by_name(name, session) is not None:
            raise OrganisationServiceError(
                f"NameExists- Organisation name already exists: {name}"
            )

    @staticmethod
    async def assert_validate_users(organisation_dto: OrganisationDTO, session):
        """Validates that the users exist"""
        if organisation_dto.managers and len(organisation_dto.managers) == 0:
            raise OrganisationServiceError(
                "MustHaveAdmin- Must have at least one admin"
            )

        if organisation_dto.managers and len(organisation_dto.managers) > 0:
            managers = []
            for user in organisation_dto.managers:
                try:
                    admin = await UserService.get_user_by_username(user)
                except NotFound:
                    raise NotFound(sub_code="USER_NOT_FOUND", username=user)

                managers.append(admin.username)

            organisation_dto.managers = managers


    @staticmethod
    async def can_user_manage_organisation(organisation_id: int, user_id: int, session):
        """Check that the user is an admin for the org or a global admin"""
        if await UserService.is_user_an_admin(user_id, session):
            return True
        else:
            return await OrganisationService.is_user_an_org_manager(organisation_id, user_id, session)


    @staticmethod
    async def is_user_an_org_manager(organisation_id: int, user_id: int, session):
        """Check that the user is an manager for the org"""
        stmt = select(Organisation).options(selectinload(Organisation.managers)).where(Organisation.id == organisation_id)
        result = await session.execute(stmt)
        org = result.scalars().first()
        if org is None:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )
        user = await UserService.get_user_by_id(user_id, session)
        return user in org.managers


    @staticmethod
    def get_campaign_organisations_as_dto(campaign_id: int, user_id: int):
        """
        Returns organisations under a particular campaign
        """
        organisation_list_dto = ListOrganisationsDTO()
        orgs = (
            session.query(Organisation).join(campaign_organisations)
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
