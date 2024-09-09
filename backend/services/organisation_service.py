from datetime import datetime
import json

# from flask import current_app
from sqlalchemy.exc import IntegrityError

from backend.exceptions import NotFound
from backend.models.dtos.organisation_dto import (
    OrganisationDTO,
    NewOrganisationDTO,
    ListOrganisationsDTO,
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
from backend.models.postgis.team import TeamVisibility
from backend.models.postgis.statuses import (
    ProjectStatus,
    TaskStatus,
    TeamJoinMethod,
    TeamMemberFunctions,
)
from backend.services.users.user_service import UserService
from backend.db import get_session

session = get_session()
from databases import Database
from fastapi import HTTPException


class OrganisationServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling organisations"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class OrganisationService:
    @staticmethod
    async def get_organisation_by_id(organisation_id: int, db: Database):
        # Fetch organisation details
        org_query = """
            SELECT
                id AS "organisation_id",
                name,
                slug,
                logo,
                description,
                url,
                CASE
                    WHEN type = 1 THEN 'FREE'
                    WHEN type = 2 THEN 'DISCOUNTED'
                    WHEN type = 3 THEN 'FULL_FEE'
                    ELSE 'UNKNOWN'
                END AS type,
                subscription_tier
            FROM organisations
            WHERE id = :organisation_id
        """
        org_record = await db.fetch_one(
            org_query, values={"organisation_id": organisation_id}
        )
        if not org_record:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )

        # Fetch organisation managers
        managers_query = """
            SELECT
                u.id,
                u.username,
                u.picture_url
            FROM users u
            JOIN organisation_managers om ON u.id = om.user_id
            WHERE om.organisation_id = :organisation_id
        """
        managers_records = await db.fetch_all(
            managers_query, values={"organisation_id": organisation_id}
        )

        # Assign manager records initially
        org_record.managers = managers_records
        return org_record

    @staticmethod
    async def get_organisation_by_id_as_dto(
        organisation_id: int, user_id: int, abbreviated: bool, db: Database
    ) -> OrganisationDTO:
        org = await OrganisationService.get_organisation_by_id(organisation_id, db)
        return await OrganisationService.get_organisation_dto(
            org, user_id, abbreviated, db
        )

    @staticmethod
    async def get_organisation_by_slug_as_dto(
        slug: str, user_id: int, abbreviated: bool, db: Database
    ):
        org_query = """
            SELECT
                id AS "organisation_id",
                name,
                slug,
                logo,
                description,
                url,
                CASE
                    WHEN type = 1 THEN 'FREE'
                    WHEN type = 2 THEN 'DISCOUNTED'
                    WHEN type = 3 THEN 'FULL_FEE'
                    ELSE 'UNKNOWN'
                END AS type,
                subscription_tier
            FROM organisations
            WHERE slug = :slug
        """
        org_record = await db.fetch_one(org_query, values={"slug": slug})

        if not org_record:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND", slug=slug)

        organisation_id = org_record["organisation_id"]

        # Fetch organisation managers
        managers_query = """
            SELECT
                u.id,
                u.username,
                u.picture_url
            FROM users u
            JOIN organisation_managers om ON u.id = om.user_id
            WHERE om.organisation_id = :organisation_id
        """
        managers_records = await db.fetch_all(
            managers_query, values={"organisation_id": organisation_id}
        )

        org_record.managers = managers_records
        return await OrganisationService.get_organisation_dto(
            org_record, user_id, abbreviated, db
        )

    @staticmethod
    def organisation_as_dto(org) -> OrganisationDTO:
        org_dto = OrganisationDTO(
            organisation_id=org.organisation_id,
            name=org.name,
            slug=org.slug,
            logo=org.logo,
            description=org.description,
            url=org.url,
            type=org.type,
            subscription_tier=org.subscription_tier,
            managers=json.loads(org["managers"]),
        )
        return org_dto

    @staticmethod
    def team_as_dto_inside_org(team) -> OrganisationTeamsDTO:
        team_dto = OrganisationTeamsDTO(
            team_id=team.team_id,
            name=team.name,
            description=team.description,
            join_method=TeamJoinMethod(team.join_method).name,
            members=[
                {
                    "username": member["username"],
                    "pictureUrl": member["pictureUrl"],
                    "function": TeamMemberFunctions(member["function"]).name,
                    "active": str(member["active"]),
                }
                for member in json.loads(team["members"])
            ],
            visibility=TeamVisibility(team["visibility"]).name,
        )
        return team_dto

    @staticmethod
    async def get_organisation_dto(org, user_id: int, abbreviated: bool, db):
        if org is None:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND")

        if not abbreviated:
            org.managers = []

        if user_id != 0:
            org.is_manager = await OrganisationService.can_user_manage_organisation(
                org.organisation_id, user_id, db
            )
        else:
            org.is_manager = False

        if abbreviated:
            return org

        teams_query = """
            SELECT
                t.id AS team_id,
                t.name,
                t.description,
                t.join_method,
                t.visibility,
                COALESCE(json_agg(json_build_object(
                    'username', u.username,
                    'pictureUrl', u.picture_url,
                    'function', tm.function,
                    'active', tm.active::text
                )) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
            FROM teams t
            LEFT JOIN team_members tm ON t.id = tm.team_id
            LEFT JOIN users u ON tm.user_id = u.id
            WHERE t.organisation_id = :org_id
            GROUP BY t.id
        """
        teams_records = await db.fetch_all(
            teams_query, values={"org_id": org.organisation_id}
        )
        teams = [
            OrganisationService.team_as_dto_inside_org(record)
            for record in teams_records
        ]
        if org.is_manager:
            org.teams = teams
        else:
            org.teams = [team for team in teams if team.visibility == "PUBLIC"]
        return org

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
    async def create_organisation(
        new_organisation_dto: NewOrganisationDTO, db: Database
    ) -> int:
        """
        Creates a new organisation using an organisation dto
        :param new_organisation_dto: Organisation DTO
        :returns: ID of new Organisation
        """
        try:
            org = await Organisation.create_from_dto(new_organisation_dto, db)
            return org
        except IntegrityError:
            raise OrganisationServiceError(
                f"NameExists- Organisation name already exists: {new_organisation_dto.name}"
            )

    @staticmethod
    async def update_organisation(
        organisation_dto: UpdateOrganisationDTO, db: Database
    ) -> int:
        """
        Updates an organisation
        :param organisation_dto: DTO with updated info
        :returns updated Organisation
        """
        org = await OrganisationService.get_organisation_by_id(
            organisation_dto.organisation_id, db
        )
        await OrganisationService.assert_validate_name(org, organisation_dto.name, db)
        await OrganisationService.assert_validate_users(organisation_dto, db)
        await Organisation.update(organisation_dto, db)
        return org.organisation_id

    @staticmethod
    async def delete_organisation(organisation_id: int, db: Database):
        """Deletes an organisation if it has no projects"""
        if await Organisation.can_be_deleted(organisation_id, db):
            delete_organisation_managers_query = """
                DELETE FROM organisation_managers
                WHERE organisation_id = :organisation_id
            """
            delete_organisation_query = """
                DELETE FROM organisations
                WHERE id = :organisation_id
            """
            try:
                async with db.transaction():
                    await db.execute(
                        query=delete_organisation_managers_query,
                        values={"organisation_id": organisation_id},
                    )
                    await db.execute(
                        query=delete_organisation_query,
                        values={"organisation_id": organisation_id},
                    )
            except Exception as e:
                raise HTTPException(status_code=500, detail="Deletion failed") from e
        else:
            raise HTTPException(
                status_code=400,
                detail="Organisation has projects or teams, cannot be deleted",
            )

    @staticmethod
    async def get_organisations(manager_user_id: int, db: Database):
        if manager_user_id is None:
            """Get all organisations"""
            return await Organisation.get_all_organisations(db)
        else:
            return await Organisation.get_organisations_managed_by_user(
                manager_user_id, db
            )

    @staticmethod
    async def get_organisations_as_dto(
        manager_user_id: int,
        authenticated_user_id: int,
        omit_managers: bool,
        omit_stats: bool,
        db: Database,
    ):
        orgs = await OrganisationService.get_organisations(manager_user_id, db)
        orgs_dto = ListOrganisationsDTO()
        for org in orgs:
            org_dto = OrganisationService.organisation_as_dto(org)
            if not omit_stats:
                year = datetime.today().strftime("%Y")
                stats = await OrganisationService.get_organisation_stats(
                    org_dto.organisation_id, db, year
                )
                org_dto.stats = stats

            if omit_managers or not authenticated_user_id:
                del org_dto.managers

            orgs_dto.organisations.append(org_dto)
        return orgs_dto

    @staticmethod
    async def get_organisations_managed_by_user(user_id: int, db):
        """Get all organisations a user manages"""
        if await UserService.is_user_an_admin(user_id, db):
            return await Organisation.get_all_organisations(db)

        return await Organisation.get_organisations_managed_by_user(user_id, db)

    @staticmethod
    async def get_organisations_managed_by_user_as_dto(
        user_id: int, db
    ) -> ListOrganisationsDTO:
        orgs = await OrganisationService.get_organisations_managed_by_user(user_id, db)
        orgs_dto = ListOrganisationsDTO()

        # Fetch managers asynchronously for each organisation
        for org in orgs:
            orgs_dto.organisations.append(OrganisationService.organisation_as_dto(org))
        return orgs_dto

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
    async def get_organisation_stats(
        organisation_id: int, db: Database, year: int = None
    ) -> OrganizationStatsDTO:
        # Prepare the base projects query
        projects_query = f"""
                SELECT
                    COUNT(CASE WHEN status = {ProjectStatus.DRAFT.value} THEN 1 END) AS draft,
                    COUNT(CASE WHEN status = {ProjectStatus.PUBLISHED.value} THEN 1 END) AS published,
                    COUNT(CASE WHEN status = {ProjectStatus.ARCHIVED.value} THEN 1 END) AS archived,
                    COUNT(CASE WHEN status IN ({ProjectStatus.ARCHIVED.value}, {ProjectStatus.PUBLISHED.value})
                                AND EXTRACT(YEAR FROM created) = {datetime.now().year} THEN 1 END) AS recent,
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
    async def assert_validate_name(org: Organisation, name: str, db):
        """Validates that the organisation name doesn't exist"""
        if (
            org.name != name
            and await Organisation.get_organisation_by_name(name, db) is not None
        ):
            raise OrganisationServiceError(
                f"NameExists- Organisation name already exists: {name}"
            )

    @staticmethod
    async def assert_validate_users(organisation_dto: OrganisationDTO, db):
        """Validates that the users exist"""
        if organisation_dto.managers and len(organisation_dto.managers) == 0:
            raise OrganisationServiceError(
                "MustHaveAdmin- Must have at least one admin"
            )

        if organisation_dto.managers and len(organisation_dto.managers) > 0:
            managers = []
            for user in organisation_dto.managers:
                try:
                    admin = await UserService.get_user_by_username(user, db)
                except NotFound:
                    raise NotFound(sub_code="USER_NOT_FOUND", username=user)

                managers.append(admin.username)

            organisation_dto.managers = managers

    @staticmethod
    async def can_user_manage_organisation(
        organisation_id: int, user_id: int, db: Database
    ):
        """Check that the user is an admin for the org or a global admin"""
        if await UserService.is_user_an_admin(user_id, db):
            return True
        else:
            return await OrganisationService.is_user_an_org_manager(
                organisation_id, user_id, db
            )

    @staticmethod
    async def is_user_an_org_manager(organisation_id: int, user_id: int, db: Database):
        """Check that the user is an manager for the org"""
        # Fetch organisation managers' IDs
        managers_query = """
            SELECT
                u.id
            FROM users u
            JOIN organisation_managers om ON u.id = om.user_id
            WHERE om.organisation_id = :organisation_id
        """
        managers_records = await db.fetch_all(
            managers_query, values={"organisation_id": organisation_id}
        )
        # Extract the list of IDs from the records
        managers_ids = [record.id for record in managers_records]
        user = await UserService.get_user_by_id(user_id, db)
        return user.id in managers_ids

    @staticmethod
    def get_campaign_organisations_as_dto(campaign_id: int, user_id: int):
        """
        Returns organisations under a particular campaign
        """
        organisation_list_dto = ListOrganisationsDTO()
        orgs = (
            session.query(Organisation)
            .join(campaign_organisations)
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
