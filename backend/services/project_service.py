import json
from datetime import datetime, timedelta, timezone

import geojson
from aiocache import Cache, cached

from databases import Database
from fastapi import HTTPException
from loguru import logger

from backend.config import get_settings
from backend.db import db_connection
from backend.exceptions import NotFound
from backend.models.dtos.mapping_dto import TaskDTOs
from backend.models.dtos.project_dto import (
    ProjectContribDTO,
    ProjectContribsDTO,
    ProjectDTO,
    ProjectSearchResultsDTO,
    ProjectStatsDTO,
    ProjectSummary,
    ProjectUserStatsDTO,
)
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project import Project, ProjectStatus
from backend.models.postgis.statuses import (
    EncouragingEmailType,
    MappingLevel,
    MappingNotAllowed,
    MappingPermission,
    TeamRoles,
    ValidatingNotAllowed,
    ValidationPermission,
)
from backend.models.postgis.task import Task
from backend.services.messaging.smtp_service import SMTPService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_search_service import ProjectSearchService
from backend.services.team_service import TeamService
from backend.services.users.user_service import UserService


class ProjectServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling projects"""

    def __init__(self, message):
        logger.debug(message)


class ProjectService:
    @staticmethod
    async def get_project_by_id(project_id: int, db: Database):
        query = """
            SELECT * FROM projects WHERE id = :project_id
        """
        project = await db.fetch_one(query=query, values={"project_id": project_id})

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        return project

    @staticmethod
    async def exists(project_id: int, db: Database) -> bool:
        # Query to check if the project exists
        query = """
            SELECT 1
            FROM projects
            WHERE id = :project_id
        """

        # Execute the query
        result = await db.fetch_one(query=query, values={"project_id": project_id})

        if result is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return True

    @staticmethod
    def get_project_by_name(project_id: int) -> Project:
        project = Project.get(project_id)
        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return project

    @staticmethod
    async def auto_unlock_tasks(project_id: int, db: Database):
        await Task.auto_unlock_tasks(project_id, db)

    @staticmethod
    def delete_tasks(project_id: int, tasks_ids):
        # Validate project exists.
        project = Project.get(project_id)
        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        tasks = [{"id": i, "obj": Task.get(i, project_id)} for i in tasks_ids]

        # In case a task is not found.
        not_found = [t["id"] for t in tasks if t["obj"] is None]
        if len(not_found) > 0:
            raise NotFound(sub_code="TASK_NOT_FOUND", tasks=not_found)

        # Delete task one by one.
        [t["obj"].delete() for t in tasks]

    @staticmethod
    async def get_contribs_by_day(project_id: int, db: Database) -> ProjectContribsDTO:
        project = await ProjectService.get_project_by_id(project_id, db)
        query = """
            SELECT
                action_text,
                DATE(action_date) AS day,
                task_id
            FROM task_history
            WHERE project_id = :project_id
            AND action = 'STATE_CHANGE'
            AND action_text IN ('MAPPED', 'VALIDATED', 'INVALIDATED')
            GROUP BY action_text, day, task_id
            ORDER BY day ASC
        """
        rows = await db.fetch_all(query=query, values={"project_id": project_id})

        contribs_dto = ProjectContribsDTO()
        dates = sorted({row["day"] for row in rows})

        cumulative_mapped = 0
        cumulative_validated = 0
        tasks = {
            "MAPPED": {"total": 0},
            "VALIDATED": {"total": 0},
            "INVALIDATED": {"total": 0},
        }

        dates_list = []
        for date in dates:
            dto = ProjectContribDTO(
                date=date, mapped=0, validated=0, total_tasks=project.total_tasks
            )

            values = [
                (row["action_text"], row["task_id"])
                for row in rows
                if row["day"] == date
            ]
            values.sort(reverse=True)

            for task_status, task_id in values:
                if task_status == "MAPPED":
                    if task_id not in tasks["MAPPED"]:
                        tasks["MAPPED"][task_id] = 1
                        tasks["MAPPED"]["total"] += 1
                        dto.mapped += 1
                elif task_status == "VALIDATED":
                    if task_id not in tasks["VALIDATED"]:
                        tasks["VALIDATED"][task_id] = 1
                        tasks["VALIDATED"]["total"] += 1
                        dto.validated += 1
                        if task_id in tasks["INVALIDATED"]:
                            del tasks["INVALIDATED"][task_id]
                            tasks["INVALIDATED"]["total"] -= 1
                        if task_id not in tasks["MAPPED"]:
                            tasks["MAPPED"][task_id] = 1
                            tasks["MAPPED"]["total"] += 1
                            dto.mapped += 1
                else:  # "INVALIDATED"
                    if task_id not in tasks["INVALIDATED"]:
                        tasks["INVALIDATED"][task_id] = 1
                        tasks["INVALIDATED"]["total"] += 1
                        if task_id in tasks["MAPPED"]:
                            del tasks["MAPPED"][task_id]
                            tasks["MAPPED"]["total"] -= 1
                            if dto.mapped > 0:
                                dto.mapped -= 1
                        if task_id in tasks["VALIDATED"]:
                            del tasks["VALIDATED"][task_id]
                            tasks["VALIDATED"]["total"] -= 1
                            if dto.validated > 0:
                                dto.validated -= 1

                cumulative_mapped = tasks["MAPPED"]["total"]
                cumulative_validated = tasks["VALIDATED"]["total"]
                dto.cumulative_mapped = cumulative_mapped
                dto.cumulative_validated = cumulative_validated

            dates_list.append(dto)

        contribs_dto.stats = dates_list
        return contribs_dto

    @staticmethod
    async def get_project_dto_for_mapper(
        project_id, current_user_id, db: Database, locale="en", abbrev=False
    ) -> ProjectDTO:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises ProjectServiceError, NotFound
        """
        project = await ProjectService.get_project_by_id(project_id, db)
        # if project is public and is not draft, we don't need to check permissions
        if not project.private and not project.status == ProjectStatus.DRAFT.value:
            return await Project.as_dto_for_mapping(
                project.id, db, current_user_id, locale, abbrev
            )

        is_allowed_user = True
        is_team_member = None
        is_manager_permission = False

        if current_user_id:
            is_manager_permission = (
                await ProjectAdminService.is_user_action_permitted_on_project(
                    current_user_id, project_id, db
                )
            )
        # Draft Projects - admins, authors, org admins & team managers permitted
        if project.status == ProjectStatus.DRAFT.value:
            if not is_manager_permission:
                is_allowed_user = False
                raise ProjectServiceError("ProjectNotFetched- Unable to fetch project")

        # Private Projects - allowed_users, admins, org admins &
        # assigned teams (mappers, validators, project managers), authors permitted

        if project.private and not is_manager_permission:
            is_allowed_user = False
            if current_user_id:
                # Query to check if the current user is an allowed user for the project
                allowed_user_check_query = """
                    SELECT 1
                    FROM project_allowed_users pau
                    WHERE pau.project_id = :project_id AND pau.user_id = :user_id
                """
                result = await db.fetch_one(
                    allowed_user_check_query,
                    {"project_id": project.id, "user_id": current_user_id},
                )
                is_allowed_user = result is not None

        if not (is_allowed_user or is_manager_permission):
            if current_user_id:
                allowed_roles = [
                    TeamRoles.MAPPER.value,
                    TeamRoles.VALIDATOR.value,
                    TeamRoles.PROJECT_MANAGER.value,
                ]
                is_team_member = await TeamService.check_team_membership(
                    project.id, allowed_roles, current_user_id, db
                )

        if is_allowed_user or is_manager_permission or is_team_member:
            return await Project.as_dto_for_mapping(
                project.id, db, current_user_id, locale, abbrev
            )
        else:
            return None

    @staticmethod
    async def get_project_tasks(
        db: Database,
        project_id: int,
        task_ids_str: str,
        order_by: str = None,
        order_by_type: str = "ASC",
        status: int = None,
    ):
        await Project.exists(project_id, db)
        return await Project.tasks_as_geojson(
            db, project_id, task_ids_str, order_by, order_by_type, status
        )

    @staticmethod
    async def get_project_aoi(project_id, db: Database):
        await Project.exists(project_id, db)
        return await Project.get_aoi_geometry_as_geojson(project_id, db)

    @staticmethod
    async def get_project_priority_areas(project_id: int, db: Database) -> list:
        await Project.exists(project_id, db)

        # Fetch the priority areas' geometries as GeoJSON
        query = """
            SELECT ST_AsGeoJSON(pa.geometry) AS geojson
            FROM priority_areas pa
            JOIN project_priority_areas ppa ON pa.id = ppa.priority_area_id
            WHERE ppa.project_id = :project_id;
        """
        rows = await db.fetch_all(query, values={"project_id": project_id})
        geojson_areas = [json.loads(row["geojson"]) for row in rows] if rows else []
        return geojson_areas

    @staticmethod
    async def get_task_for_logged_in_user(user_id: int, db: Database):
        """if the user is working on a task in the project return it"""
        tasks = await Task.get_locked_tasks_for_user(user_id, db)

        return tasks

    @staticmethod
    async def get_task_details_for_logged_in_user(
        user_id: int, preferred_locale: str, db: Database
    ):
        """if the user is working on a task in the project return it"""
        tasks = await Task.get_locked_tasks_details_for_user(user_id, db)

        if len(tasks) == 0:
            raise NotFound(sub_code="TASK_NOT_FOUND")

        dtos = []
        for task in tasks:
            dtos.append(
                await Task.as_dto_with_instructions(
                    task.id, task.project_id, db, preferred_locale
                )
            )

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    async def is_user_in_the_allowed_list(
        project_id: int, current_user_id: int, db: Database
    ) -> bool:
        """For private projects, check if user is present in the allowed list"""

        query = """
        SELECT COUNT(1)
        FROM project_allowed_users
        WHERE project_id = :project_id AND user_id = :user_id
        """

        result = await db.fetch_val(
            query, values={"project_id": project_id, "user_id": current_user_id}
        )
        # Return True if the user is in the allowed list, False otherwise
        return result > 0

    @staticmethod
    async def evaluate_mapping_permission(
        project_id: int, user_id: int, mapping_permission: int, db: Database
    ):
        allowed_roles = [
            TeamRoles.MAPPER.value,
            TeamRoles.VALIDATOR.value,
            TeamRoles.PROJECT_MANAGER.value,
        ]
        is_team_member = await TeamService.check_team_membership(
            project_id, allowed_roles, user_id, db
        )

        # mapping_permission = 1(level),2(teams),3(teamsAndLevel)
        if mapping_permission == MappingPermission.TEAMS.value:
            if not is_team_member:
                return False, MappingNotAllowed.USER_NOT_TEAM_MEMBER

        elif mapping_permission == MappingPermission.LEVEL.value:
            if not await ProjectService._is_user_intermediate_or_advanced(user_id, db):
                return False, MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL

        elif mapping_permission == MappingPermission.TEAMS_LEVEL.value:
            if not await ProjectService._is_user_intermediate_or_advanced(user_id, db):
                return False, MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL
            if not is_team_member:
                return False, MappingNotAllowed.USER_NOT_TEAM_MEMBER

    @staticmethod
    async def is_user_permitted_to_map(project_id: int, user_id: int, db: Database):
        """Check if the user is allowed to map the on the project in scope"""

        if await UserService.is_user_blocked(user_id, db):
            return False, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = await ProjectService.get_project_by_id(project_id, db)
        if project.license_id:
            if not await UserService.has_user_accepted_license(
                user_id, project.license_id, db
            ):
                return False, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        mapping_permission = project.mapping_permission
        is_manager_permission = (
            False  # is_admin or is_author or is_org_manager or is_manager_team
        )
        if await ProjectAdminService.is_user_action_permitted_on_project(
            user_id, project_id, db
        ):
            is_manager_permission = True
        # Draft (public/private) accessible only for is_manager_permission
        if (
            ProjectStatus(project.status) == ProjectStatus.DRAFT
            and not is_manager_permission
        ):
            return False, MappingNotAllowed.PROJECT_NOT_PUBLISHED

        is_restriction = None
        if not is_manager_permission and mapping_permission:
            is_restriction = await ProjectService.evaluate_mapping_permission(
                project_id, user_id, mapping_permission, db
            )
        tasks = await Task.get_locked_tasks_for_user(user_id, db)
        if len(tasks.locked_tasks) > 0:
            return False, MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        is_allowed_user = None
        if project.private and not is_manager_permission:
            # Check if user is in allowed user list
            is_allowed_user = await ProjectService.is_user_in_the_allowed_list(
                project.id, user_id, db
            )
            if is_allowed_user:
                return True, "User allowed to map"

        if not is_manager_permission and is_restriction:
            return is_restriction

        elif project.private and not (
            is_manager_permission or is_allowed_user or not is_restriction
        ):
            return False, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST
        return True, "User allowed to map"

    @staticmethod
    async def _is_user_intermediate_or_advanced(user_id, db: Database):
        """Helper method to determine if user level is not beginner"""
        user_mapping_level = await UserService.get_mapping_level(user_id, db)
        if user_mapping_level not in [MappingLevel.INTERMEDIATE, MappingLevel.ADVANCED]:
            return False

        return True

    @staticmethod
    async def evaluate_validation_permission(
        project_id: int, user_id: int, validation_permission: int, db: Database
    ):
        allowed_roles = [TeamRoles.VALIDATOR.value, TeamRoles.PROJECT_MANAGER.value]
        is_team_member = await TeamService.check_team_membership(
            project_id, allowed_roles, user_id, db
        )
        # validation_permission = 1(level),2(teams),3(teamsAndLevel)
        if validation_permission == ValidationPermission.TEAMS.value:
            if not is_team_member:
                return False, ValidatingNotAllowed.USER_NOT_TEAM_MEMBER

        elif validation_permission == ValidationPermission.LEVEL.value:
            if not await ProjectService._is_user_intermediate_or_advanced(user_id, db):
                return False, ValidatingNotAllowed.USER_IS_BEGINNER

        elif validation_permission == ValidationPermission.TEAMS_LEVEL.value:
            if not await ProjectService._is_user_intermediate_or_advanced(user_id, db):
                return False, ValidatingNotAllowed.USER_IS_BEGINNER
            if not is_team_member:
                return False, ValidatingNotAllowed.USER_NOT_TEAM_MEMBER

    @staticmethod
    async def is_user_permitted_to_validate(
        project_id: int, user_id: int, db: Database
    ):
        """Check if the user is allowed to validate on the project in scope"""
        if await UserService.is_user_blocked(user_id, db):
            return False, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = await ProjectService.get_project_by_id(project_id, db)
        if project.license_id:
            if not await UserService.has_user_accepted_license(
                user_id, project.license_id, db
            ):
                return False, ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        validation_permission = project.validation_permission

        # is_admin or is_author or is_org_manager or is_manager_team
        is_manager_permission = False
        if await ProjectAdminService.is_user_action_permitted_on_project(
            user_id, project_id, db
        ):
            is_manager_permission = True

        # Draft (public/private) accessible only for is_manager_permission
        if (
            ProjectStatus(project.status) == ProjectStatus.DRAFT
            and not is_manager_permission
        ):
            return False, ValidatingNotAllowed.PROJECT_NOT_PUBLISHED

        is_restriction = None
        if not is_manager_permission and validation_permission:
            is_restriction = await ProjectService.evaluate_validation_permission(
                project_id, user_id, validation_permission, db
            )

        tasks = await Task.get_locked_tasks_for_user(user_id, db)
        if len(tasks.locked_tasks) > 0:
            return False, ValidatingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        is_allowed_user = None
        if project.private and not is_manager_permission:
            # Check if user is in allowed user list
            is_allowed_user = await ProjectService.is_user_in_the_allowed_list(
                project_id, user_id, db
            )

            if is_allowed_user:
                return True, "User allowed to validate"

        if not is_manager_permission and is_restriction:
            return is_restriction
        elif project.private and not (
            is_manager_permission or is_allowed_user or not is_restriction
        ):
            return False, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        return True, "User allowed to validate"

    def summary_cache_key_builder(func, *args, **kwargs):
        args_without_db = args[:-1]
        return f"{func.__name__}:{args_without_db}:{kwargs}"

    @staticmethod
    @cached(cache=Cache.MEMORY, key_builder=summary_cache_key_builder, ttl=600)
    def get_cached_project_summary(
        project_id: int, preferred_locale: str = "en"
    ) -> ProjectSummary:
        """Gets the project summary DTO"""
        project = ProjectService.get_project_by_id(project_id)
        # We don't want to cache the project stats, so we set calculate_completion to False
        return project.get_project_summary(preferred_locale, calculate_completion=False)

    @staticmethod
    async def get_project_summary(
        project_id: int, db: Database, preferred_locale: str = "en"
    ) -> ProjectSummary:
        query = """
        SELECT
            p.id AS id,
            p.difficulty,
            p.priority,
            p.default_locale,
            ST_AsGeoJSON(p.centroid) AS centroid,
            p.organisation_id,
            p.tasks_bad_imagery,
            p.tasks_mapped,
            p.tasks_validated,
            p.status,
            p.mapping_types,
            p.total_tasks,
            p.last_updated,
            p.due_date,
            p.country,
            p.changeset_comment,
            p.created,
            p.osmcha_filter_id,
            p.mapping_permission,
            p.validation_permission,
            p.enforce_random_task_selection,
            p.private,
            p.license_id,
            p.id_presets,
            p.extra_id_params,
            p.rapid_power_user,
            p.imagery,
            p.mapping_editors,
            p.validation_editors,
            u.username AS author,
            o.name AS organisation_name,
            o.slug AS organisation_slug,
            o.logo AS organisation_logo,
            ARRAY(SELECT user_id FROM project_allowed_users WHERE project_id = p.id) AS allowed_users
        FROM projects p
        LEFT JOIN organisations o ON o.id = p.organisation_id
        LEFT JOIN users u ON u.id = p.author_id
        WHERE p.id = :id
        """
        params = {"id": project_id}
        # Execute query
        project = await db.fetch_one(query, params)
        if not project:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)
        """Gets the project summary DTO"""

        summary = await Project.get_project_summary(
            project, preferred_locale, db, calculate_completion=False
        )
        summary.percent_mapped = Project.calculate_tasks_percent(
            "mapped",
            project.tasks_mapped,
            project.tasks_validated,
            project.total_tasks,
            project.tasks_bad_imagery,
        )
        summary.percent_validated = Project.calculate_tasks_percent(
            "validated",
            project.tasks_validated,
            project.tasks_validated,
            project.total_tasks,
            project.tasks_bad_imagery,
        )
        summary.percent_bad_imagery = Project.calculate_tasks_percent(
            "bad_imagery",
            project.tasks_mapped,
            project.tasks_validated,
            project.total_tasks,
            project.tasks_bad_imagery,
        )
        return summary

    @staticmethod
    async def set_project_as_featured(project_id: int, db: Database):
        """Sets project as featured"""
        project = await ProjectService.get_project_by_id(project_id, db)
        await Project.set_as_featured(project, db)

    @staticmethod
    async def unset_project_as_featured(project_id: int, db: Database):
        """Sets project as featured"""
        project = await ProjectService.get_project_by_id(project_id, db)
        await Project.unset_as_featured(project, db)

    @staticmethod
    async def get_featured_projects(
        preferred_locale: str, db: Database
    ) -> ProjectSearchResultsDTO:
        """Fetch featured projects and return results."""

        # Create the search query
        query, params = await ProjectSearchService.create_search_query(db)

        # Append filtering for featured projects
        query += " AND p.featured = TRUE"

        projects = await db.fetch_all(query, params)
        project_ids = [project["id"] for project in projects]

        # Get total contributors
        contrib_counts = await ProjectSearchService.get_total_contributions(
            project_ids, db
        )
        zip_items = zip(projects, contrib_counts)

        dto = ProjectSearchResultsDTO()
        dto.results = [
            await ProjectSearchService.create_result_dto(
                project, preferred_locale, total_contributors, db
            )
            for project, total_contributors in zip_items
        ]
        dto.pagination = None
        return dto

    @staticmethod
    async def is_favorited(project_id: int, user_id: int, db: Database) -> bool:
        await ProjectService.exists(project_id, db)
        return await Project.is_favorited(project_id, user_id, db)

    @staticmethod
    async def favorite(project_id: int, user_id: int, db: Database):
        await ProjectService.exists(project_id, db)
        await Project.favorite(project_id, user_id, db)

    @staticmethod
    async def unfavorite(project_id: int, user_id: int, db: Database):
        await ProjectService.exists(project_id, db)
        await Project.unfavorite(project_id, user_id, db)

    @staticmethod
    def get_project_title(project_id: int, preferred_locale: str = "en") -> str:
        """Gets the project title DTO"""
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_title(preferred_locale)

    def stats_cache_key_builder(func, *args, **kwargs):
        args_without_db = args[:-1]
        return f"{func.__name__}:{args_without_db}:{kwargs}"

    @staticmethod
    @cached(cache=Cache.MEMORY, key_builder=stats_cache_key_builder, ttl=600)
    async def get_project_stats(project_id: int, db: Database) -> ProjectStatsDTO:
        """Gets the project stats DTO"""
        await ProjectService.exists(project_id, db)
        return await Project.get_project_stats(project_id, db)

    @staticmethod
    async def get_project_user_stats(
        project_id: int, username: str, db: Database
    ) -> ProjectUserStatsDTO:
        """Gets the user stats for a specific project"""
        await ProjectService.exists(project_id, db)
        user = await UserService.get_user_by_username(username, db)
        return await Project.get_project_user_stats(project_id, user.id, db)

    def get_project_teams(project_id: int):
        project = ProjectService.get_project_by_id(project_id)

        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return project.teams

    @staticmethod
    def get_project_organisation(project_id: int) -> Organisation:
        project = ProjectService.get_project_by_id(project_id)

        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return project.organisation

    @staticmethod
    async def send_email_on_project_progress(project_id: int):
        """Send email to all contributors on project progress"""
        async with db_connection.database.connection() as db:
            current_settings = get_settings()
            if not current_settings.SEND_PROJECT_EMAIL_UPDATES:
                return
            project = await ProjectService.get_project_by_id(project_id, db)

            project_completion = Project.calculate_tasks_percent(
                "project_completion",
                project.tasks_mapped,
                project.tasks_validated,
                project.total_tasks,
                project.tasks_bad_imagery,
            )
            if project_completion == 50 and project.progress_email_sent:
                return  # Don't send progress email if it's already sent
            if project_completion in [50, 100]:
                email_type = (
                    EncouragingEmailType.PROJECT_COMPLETE.value
                    if project_completion == 100
                    else EncouragingEmailType.PROJECT_PROGRESS.value
                )
                project_title_query = """
                    SELECT name
                    FROM project_info
                    WHERE project_id = :project_id AND locale = :locale
                """
                project_title = await db.fetch_val(
                    project_title_query,
                    values={
                        "project_id": project_id,
                        "locale": project.default_locale,
                    },
                )

                # Update progress_email_sent status
                await db.execute(
                    """
                    UPDATE projects
                    SET progress_email_sent = TRUE
                    WHERE id = :project_id
                """,
                    values={"project_id": project_id},
                )
                await SMTPService.send_email_to_contributors_on_project_progress(
                    email_type, project_id, project_title, project_completion, db
                )

    @staticmethod
    async def get_active_projects(interval: int, db: Database):
        # Calculate the action_date and make it naive
        action_date = (datetime.now(timezone.utc) - timedelta(hours=interval)).replace(
            tzinfo=None
        )
        # First query to get distinct project_ids
        query_project_ids = """
        SELECT DISTINCT project_id
        FROM task_history
        WHERE action_date >= :action_date
        """
        project_ids_result = await db.fetch_all(
            query_project_ids, {"action_date": action_date}
        )
        project_ids = [row["project_id"] for row in project_ids_result]

        # If there are no project IDs, return an empty FeatureCollection
        if not project_ids:
            return geojson.FeatureCollection([])

        # Second query to get project details
        query_projects = """
        SELECT
            id,
            mapping_types,
            ST_AsGeoJSON(geometry) AS geometry
        FROM projects
        WHERE status = :status
        AND id = ANY(:project_ids)
        """
        project_result = await db.fetch_all(
            query_projects,
            {"status": ProjectStatus.PUBLISHED.value, "project_ids": project_ids},
        )

        # Building GeoJSON FeatureCollection
        features = [
            geojson.Feature(
                geometry=geojson.loads(project["geometry"]),
                properties={
                    "project_id": project["id"],
                    "mapping_types": project["mapping_types"],
                },
            )
            for project in project_result
        ]

        return geojson.FeatureCollection(features)
