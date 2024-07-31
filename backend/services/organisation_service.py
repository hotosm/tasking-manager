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
    OrganisationManagerDTO,
    OrganisationTeamsDTO,
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
from databases import Database

class OrganisationServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling organisations"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class OrganisationService:

    @staticmethod
    async def get_organisation_by_id(organisation_id: int, db: Database):
        query = """
        SELECT
            o.id AS organisation_id,
            o.name AS organisation_name,
            o.slug AS organisation_slug,
            o.logo AS organisation_logo,
            o.description AS organisation_description,
            o.url AS organisation_url,
            CASE 
                WHEN o.type = 1 THEN 'FREE'
                WHEN o.type = 2 THEN 'DISCOUNTED'
                WHEN o.type = 3 THEN 'FULL_FEE'
                ELSE 'UNKNOWN'
            END AS organisation_type,
            o.subscription_tier AS organisation_subscription_tier,
            m.id AS manager_id,
            m.username AS manager_username,
            t.id AS team_id,
            t.name AS team_name,
            t.logo AS team_logo,
            t.description AS team_description,
            t.join_method AS team_join_method,
            t.visibility AS team_visibility
        FROM
            organisations o
        LEFT JOIN
            organisation_managers om ON o.id = om.organisation_id
        LEFT JOIN
            users m ON om.user_id = m.id
        LEFT JOIN
            teams t ON o.id = t.organisation_id
        WHERE
            o.id = :organisation_id;
        """
        result = await db.fetch_all(query, values={"organisation_id": organisation_id})

        if not result:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id)

        return result

    @staticmethod
    async def get_organisation_by_id_as_dto(
        organisation_id: int,
        user_id: int,
        abbreviated: bool,
        db: Database
    ) -> OrganisationDTO:
        org = await OrganisationService.get_organisation_by_id(organisation_id, db)
        return await OrganisationService.get_organisation_dto(org, user_id, abbreviated, db)

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
        
        org = await session.execute(
            select(Organisation)
            .options(selectinload(Organisation.managers), selectinload(Organisation.teams))
            .filter_by(id=org.id)
        )
        org = org.scalars().first()
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
    async def get_organisations(manager_user_id: int, db: Database):
        if manager_user_id is None:
            """Get all organisations"""
            return await Organisation.get_all_organisations(db)
        else:
            return await Organisation.get_organisations_managed_by_user(manager_user_id, db)

    @staticmethod
    async def get_organisations_as_dto(
        manager_user_id: int,
        authenticated_user_id: int,
        omit_managers: bool,
        omit_stats: bool,
        db: Database
    ):
        orgs = await OrganisationService.get_organisations(manager_user_id, db)
        orgs_dto = ListOrganisationsDTO()
        for org in orgs:
            org_dto = OrganisationDTO(**org)  # Assuming org is a record from fetch_all
            if not omit_stats:
                year = datetime.today().strftime("%Y")
                stats = await OrganisationService.get_organisation_stats(org_dto.organisation_id, db, year)
                org_dto.stats = stats
            
            if omit_managers or not authenticated_user_id:
                del org_dto.managers
            
            orgs_dto.organisations.append(org_dto)
        
        return orgs_dto

    @staticmethod
    async def get_organisations_managed_by_user(user_id: int, session):
        """Get all organisations a user manages"""
        if await UserService.is_user_an_admin(user_id, session):
            return await Organisation.get_all_organisations(session)

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
    async def get_organisation_stats(organisation_id: int, db: Database, year: int = None) -> OrganizationStatsDTO:
        # Prepare the base projects query
        projects_query = f"""
                SELECT
                    COUNT(CASE WHEN status = {ProjectStatus.DRAFT.value} THEN 1 END) AS draft,
                    COUNT(CASE WHEN status = {ProjectStatus.PUBLISHED.value} THEN 1 END) AS published,
                    COUNT(CASE WHEN status = {ProjectStatus.ARCHIVED.value} THEN 1 END) AS archived,
                    COUNT(CASE WHEN status IN ({ProjectStatus.ARCHIVED.value}, {ProjectStatus.PUBLISHED.value})
                                AND EXTRACT(YEAR FROM created) = {year} THEN 1 END) AS recent,
                    COUNT(CASE WHEN status = {ProjectStatus.PUBLISHED.value}
                                AND last_updated < NOW() - INTERVAL '6 MONTH' THEN 1 END) AS stale
                FROM projects
                WHERE organisation_id = :organisation_id"""
        
        projects_values = {"organisation_id": organisation_id}

        if year:
            start_date = datetime(int(year), 1, 1)
            projects_query += " AND created BETWEEN :start_date AND NOW()"
            projects_values["start_date"] = start_date

        project_stats = await db.fetch_one(query=projects_query, values=projects_values)

        projects_dto = OrganizationProjectsStatsDTO(**project_stats)

        active_tasks_query = f"""
            SELECT
                COUNT(CASE WHEN t.task_status = {TaskStatus.READY.value} THEN 1 END) AS ready,
                COUNT(CASE WHEN t.task_status = {TaskStatus.LOCKED_FOR_MAPPING.value} THEN 1 END) AS locked_for_mapping,
                COUNT(CASE WHEN t.task_status = {TaskStatus.MAPPED.value} THEN 1 END) AS mapped,
                COUNT(CASE WHEN t.task_status = {TaskStatus.LOCKED_FOR_VALIDATION.value} THEN 1 END) AS locked_for_validation,
                COUNT(CASE WHEN t.task_status = {TaskStatus.VALIDATED.value} THEN 1 END) AS validated,
                COUNT(CASE WHEN t.task_status = {TaskStatus.INVALIDATED.value} THEN 1 END) AS invalidated,
                COUNT(CASE WHEN t.task_status = {TaskStatus.BADIMAGERY.value} THEN 1 END) AS badimagery
            FROM tasks t
            WHERE t.project_id IN (
                SELECT p.id
                FROM projects p
                WHERE p.organisation_id = :organisation_id
                AND p.status = {ProjectStatus.PUBLISHED.value}
        """
        
        task_values = {"organisation_id": organisation_id}

        if year:
            start_date = datetime(int(year), 1, 1)
            active_tasks_query += " AND p.created BETWEEN :start_date AND NOW()"
            task_values["start_date"] = start_date

        active_tasks_query += ")"
        task_stats = await db.fetch_one(query=active_tasks_query, values=task_values)
        tasks_dto = OrganizationTasksStatsDTO(**task_stats)

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
