import threading
from cachetools import TTLCache, cached
from flask import current_app
import geojson
from datetime import datetime, timedelta

from backend.exceptions import NotFound

from backend.models.dtos.mapping_dto import TaskDTOs
from backend.models.dtos.project_dto import (
    ProjectDTO,
    ProjectSummary,
    ProjectStatsDTO,
    ProjectUserStatsDTO,
    ProjectContribsDTO,
    ProjectContribDTO,
    ProjectSearchResultsDTO,
)
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project_info import ProjectInfo
from backend.models.postgis.project import Project, ProjectStatus
from backend.models.postgis.statuses import (
    MappingNotAllowed,
    ValidatingNotAllowed,
    MappingPermission,
    ValidationPermission,
    TeamRoles,
    EncouragingEmailType,
    MappingLevel,
)
from backend.models.postgis.task import Task, TaskHistory
from backend.services.messaging.smtp_service import SMTPService
from backend.services.users.user_service import UserService
from backend.services.project_search_service import ProjectSearchService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.team_service import TeamService
from sqlalchemy import func, or_
from sqlalchemy.sql.expression import true

summary_cache = TTLCache(maxsize=1024, ttl=600)


class ProjectServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling projects"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class ProjectService:
    @staticmethod
    def get_project_by_id(project_id: int) -> Project:
        project = Project.get(project_id)
        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return project

    @staticmethod
    def exists(project_id: int) -> bool:
        project = Project.exists(project_id)
        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)
        return True

    @staticmethod
    def get_project_by_name(project_id: int) -> Project:
        project = Project.get(project_id)
        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return project

    @staticmethod
    def auto_unlock_tasks(project_id: int):
        Task.auto_unlock_tasks(project_id)

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
    def get_contribs_by_day(project_id: int) -> ProjectContribsDTO:
        # Validate that project exists
        project = ProjectService.get_project_by_id(project_id)

        # Fetch all state change with date and task ID
        stats = (
            TaskHistory.query.with_entities(
                TaskHistory.action_text.label("action_text"),
                func.DATE(TaskHistory.action_date).label("day"),
                TaskHistory.task_id.label("task_id"),
            )
            .filter(TaskHistory.project_id == project_id)
            .filter(
                TaskHistory.action == "STATE_CHANGE",
                or_(
                    TaskHistory.action_text == "MAPPED",
                    TaskHistory.action_text == "VALIDATED",
                    TaskHistory.action_text == "INVALIDATED",
                ),
            )
            .group_by("action_text", "day", "task_id")
            .order_by("day")
        ).all()

        contribs_dto = ProjectContribsDTO()
        # Filter and store unique dates
        dates = list(set(r[1] for r in stats))
        dates.sort(
            reverse=False
        )  # Why was this reversed? To have the dates in ascending order
        dates_list = []
        cumulative_mapped = 0
        cumulative_validated = 0
        # A hashmap to track task state change updates
        tasks = {
            "MAPPED": {"total": 0},
            "VALIDATED": {"total": 0},
            "INVALIDATED": {"total": 0},
        }

        for date in dates:
            dto = ProjectContribDTO(
                {
                    "date": date,
                    "mapped": 0,
                    "validated": 0,
                    "total_tasks": project.total_tasks,
                }
            )
            # s -> ('LOCKED_FOR_MAPPING', datetime.date(2019, 4, 23), 1)
            # s[0] -> action, s[1] -> date, s[2] -> task_id
            values = [(s[0], s[2]) for s in stats if date == s[1]]
            values.sort(reverse=True)  # Most recent action comes first
            for val in values:
                task_id = val[1]
                task_status = val[0]

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
                else:
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
    def get_project_dto_for_mapper(
        project_id, current_user_id, locale="en", abbrev=False
    ) -> ProjectDTO:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises ProjectServiceError, NotFound
        """
        project = ProjectService.get_project_by_id(project_id)
        # if project is public and is not draft, we don't need to check permissions
        if not project.private and not project.status == ProjectStatus.DRAFT.value:
            return project.as_dto_for_mapping(current_user_id, locale, abbrev)

        is_allowed_user = True
        is_team_member = None
        is_manager_permission = False

        if current_user_id:
            is_manager_permission = (
                ProjectAdminService.is_user_action_permitted_on_project(
                    current_user_id, project_id
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
                is_allowed_user = (
                    len(
                        [
                            user
                            for user in project.allowed_users
                            if user.id == current_user_id
                        ]
                    )
                    > 0
                )

        if not (is_allowed_user or is_manager_permission):
            if current_user_id:
                allowed_roles = [
                    TeamRoles.MAPPER.value,
                    TeamRoles.VALIDATOR.value,
                    TeamRoles.PROJECT_MANAGER.value,
                ]
                is_team_member = TeamService.check_team_membership(
                    project_id, allowed_roles, current_user_id
                )

        if is_allowed_user or is_manager_permission or is_team_member:
            return project.as_dto_for_mapping(current_user_id, locale, abbrev)
        else:
            return None

    @staticmethod
    def get_project_tasks(
        project_id,
        task_ids_str: str,
        order_by: str = None,
        order_by_type: str = "ASC",
        status: int = None,
    ):
        project = ProjectService.get_project_by_id(project_id)
        return project.tasks_as_geojson(task_ids_str, order_by, order_by_type, status)

    @staticmethod
    def get_project_aoi(project_id):
        project = ProjectService.get_project_by_id(project_id)
        return project.get_aoi_geometry_as_geojson()

    @staticmethod
    def get_project_priority_areas(project_id):
        project = ProjectService.get_project_by_id(project_id)
        geojson_areas = []
        for priority_area in project.priority_areas:
            geojson_areas.append(priority_area.get_as_geojson())
        return geojson_areas

    @staticmethod
    def get_task_for_logged_in_user(user_id: int):
        """if the user is working on a task in the project return it"""
        tasks = Task.get_locked_tasks_for_user(user_id)

        tasks_dto = tasks
        return tasks_dto

    @staticmethod
    def get_task_details_for_logged_in_user(user_id: int, preferred_locale: str):
        """if the user is working on a task in the project return it"""
        tasks = Task.get_locked_tasks_details_for_user(user_id)

        if len(tasks) == 0:
            raise NotFound(sub_code="TASK_NOT_FOUND")

        # TODO put the task details in to a DTO
        dtos = []
        for task in tasks:
            dtos.append(task.as_dto_with_instructions(preferred_locale))

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def is_user_in_the_allowed_list(allowed_users: list, current_user_id: int):
        """For private projects, check if user is present in the allowed list"""
        return (
            len([user.id for user in allowed_users if user.id == current_user_id]) > 0
        )

    @staticmethod
    def evaluate_mapping_permission(
        project_id: int, user_id: int, mapping_permission: int
    ):
        allowed_roles = [
            TeamRoles.MAPPER.value,
            TeamRoles.VALIDATOR.value,
            TeamRoles.PROJECT_MANAGER.value,
        ]
        is_team_member = TeamService.check_team_membership(
            project_id, allowed_roles, user_id
        )

        # mapping_permission = 1(level),2(teams),3(teamsAndLevel)
        if mapping_permission == MappingPermission.TEAMS.value:
            if not is_team_member:
                return False, MappingNotAllowed.USER_NOT_TEAM_MEMBER

        elif mapping_permission == MappingPermission.LEVEL.value:
            if not ProjectService._is_user_intermediate_or_advanced(user_id):
                return False, MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL

        elif mapping_permission == MappingPermission.TEAMS_LEVEL.value:
            if not ProjectService._is_user_intermediate_or_advanced(user_id):
                return False, MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL
            if not is_team_member:
                return False, MappingNotAllowed.USER_NOT_TEAM_MEMBER

    @staticmethod
    def is_user_permitted_to_map(project_id: int, user_id: int):
        """Check if the user is allowed to map the on the project in scope"""
        if UserService.is_user_blocked(user_id):
            return False, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = ProjectService.get_project_by_id(project_id)
        if project.license_id:
            if not UserService.has_user_accepted_license(user_id, project.license_id):
                return False, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE
        mapping_permission = project.mapping_permission

        is_manager_permission = (
            False  # is_admin or is_author or is_org_manager or is_manager_team
        )
        if ProjectAdminService.is_user_action_permitted_on_project(user_id, project_id):
            is_manager_permission = True

        # Draft (public/private) accessible only for is_manager_permission
        if (
            ProjectStatus(project.status) == ProjectStatus.DRAFT
            and not is_manager_permission
        ):
            return False, MappingNotAllowed.PROJECT_NOT_PUBLISHED

        is_restriction = None
        if not is_manager_permission and mapping_permission:
            is_restriction = ProjectService.evaluate_mapping_permission(
                project_id, user_id, mapping_permission
            )

        tasks = Task.get_locked_tasks_for_user(user_id)
        if len(tasks.locked_tasks) > 0:
            return False, MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        is_allowed_user = None
        if project.private and not is_manager_permission:
            # Check if user is in allowed user list
            is_allowed_user = ProjectService.is_user_in_the_allowed_list(
                project.allowed_users, user_id
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
    def _is_user_intermediate_or_advanced(user_id):
        """Helper method to determine if user level is not beginner"""
        user_mapping_level = UserService.get_mapping_level(user_id)
        if user_mapping_level not in [MappingLevel.INTERMEDIATE, MappingLevel.ADVANCED]:
            return False

        return True

    @staticmethod
    def evaluate_validation_permission(
        project_id: int, user_id: int, validation_permission: int
    ):
        allowed_roles = [TeamRoles.VALIDATOR.value, TeamRoles.PROJECT_MANAGER.value]
        is_team_member = TeamService.check_team_membership(
            project_id, allowed_roles, user_id
        )
        # validation_permission = 1(level),2(teams),3(teamsAndLevel)
        if validation_permission == ValidationPermission.TEAMS.value:
            if not is_team_member:
                return False, ValidatingNotAllowed.USER_NOT_TEAM_MEMBER

        elif validation_permission == ValidationPermission.LEVEL.value:
            if not ProjectService._is_user_intermediate_or_advanced(user_id):
                return False, ValidatingNotAllowed.USER_IS_BEGINNER

        elif validation_permission == ValidationPermission.TEAMS_LEVEL.value:
            if not ProjectService._is_user_intermediate_or_advanced(user_id):
                return False, ValidatingNotAllowed.USER_IS_BEGINNER
            if not is_team_member:
                return False, ValidatingNotAllowed.USER_NOT_TEAM_MEMBER

    @staticmethod
    def is_user_permitted_to_validate(project_id, user_id):
        """Check if the user is allowed to validate on the project in scope"""
        if UserService.is_user_blocked(user_id):
            return False, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = ProjectService.get_project_by_id(project_id)
        if project.license_id:
            if not UserService.has_user_accepted_license(user_id, project.license_id):
                return False, ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE
        validation_permission = project.validation_permission

        # is_admin or is_author or is_org_manager or is_manager_team
        is_manager_permission = False
        if ProjectAdminService.is_user_action_permitted_on_project(user_id, project_id):
            is_manager_permission = True

        # Draft (public/private) accessible only for is_manager_permission
        if (
            ProjectStatus(project.status) == ProjectStatus.DRAFT
            and not is_manager_permission
        ):
            return False, ValidatingNotAllowed.PROJECT_NOT_PUBLISHED

        is_restriction = None
        if not is_manager_permission and validation_permission:
            is_restriction = ProjectService.evaluate_validation_permission(
                project_id, user_id, validation_permission
            )

        tasks = Task.get_locked_tasks_for_user(user_id)
        if len(tasks.locked_tasks) > 0:
            return False, ValidatingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        is_allowed_user = None
        if project.private and not is_manager_permission:
            # Check if user is in allowed user list
            is_allowed_user = ProjectService.is_user_in_the_allowed_list(
                project.allowed_users, user_id
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

    @staticmethod
    @cached(summary_cache)
    def get_cached_project_summary(
        project_id: int, preferred_locale: str = "en"
    ) -> ProjectSummary:
        """Gets the project summary DTO"""
        project = ProjectService.get_project_by_id(project_id)
        # We don't want to cache the project stats, so we set calculate_completion to False
        return project.get_project_summary(preferred_locale, calculate_completion=False)

    @staticmethod
    def get_project_summary(
        project_id: int, preferred_locale: str = "en"
    ) -> ProjectSummary:
        """Gets the project summary DTO"""
        project = ProjectService.get_project_by_id(project_id)
        summary = ProjectService.get_cached_project_summary(
            project_id, preferred_locale
        )
        # Since we don't want to cache the project stats, we need to update them
        summary.percent_mapped = project.calculate_tasks_percent("mapped")
        summary.percent_validated = project.calculate_tasks_percent("validated")
        summary.percent_bad_imagery = project.calculate_tasks_percent("bad_imagery")
        return summary

    @staticmethod
    def set_project_as_featured(project_id: int):
        """Sets project as featured"""
        project = ProjectService.get_project_by_id(project_id)
        project.set_as_featured()

    @staticmethod
    def unset_project_as_featured(project_id: int):
        """Sets project as featured"""
        project = ProjectService.get_project_by_id(project_id)
        project.unset_as_featured()

    @staticmethod
    def get_featured_projects(preferred_locale):
        """Sets project as featured"""
        query = ProjectSearchService.create_search_query()
        projects = query.filter(Project.featured == true()).group_by(Project.id).all()

        # Get total contributors.
        contrib_counts = ProjectSearchService.get_total_contributions(projects)
        zip_items = zip(projects, contrib_counts)

        dto = ProjectSearchResultsDTO()
        dto.results = [
            ProjectSearchService.create_result_dto(p, preferred_locale, t)
            for p, t in zip_items
        ]

        return dto

    @staticmethod
    def is_favorited(project_id: int, user_id: int) -> bool:
        project = ProjectService.get_project_by_id(project_id)

        return project.is_favorited(user_id)

    @staticmethod
    def favorite(project_id: int, user_id: int):
        project = ProjectService.get_project_by_id(project_id)
        project.favorite(user_id)

    @staticmethod
    def unfavorite(project_id: int, user_id: int):
        project = ProjectService.get_project_by_id(project_id)
        project.unfavorite(user_id)

    @staticmethod
    def get_project_title(project_id: int, preferred_locale: str = "en") -> str:
        """Gets the project title DTO"""
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_title(preferred_locale)

    @staticmethod
    @cached(TTLCache(maxsize=1024, ttl=600))
    def get_project_stats(project_id: int) -> ProjectStatsDTO:
        """Gets the project stats DTO"""
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_stats()

    @staticmethod
    def get_project_user_stats(project_id: int, username: str) -> ProjectUserStatsDTO:
        """Gets the user stats for a specific project"""
        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_username(username)
        return project.get_project_user_stats(user.id)

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
    def send_email_on_project_progress(project_id):
        """Send email to all contributors on project progress"""
        if not current_app.config["SEND_PROJECT_EMAIL_UPDATES"]:
            return
        project = ProjectService.get_project_by_id(project_id)

        project_completion = project.calculate_tasks_percent("project_completion")
        if project_completion == 50 and project.progress_email_sent:
            return  # Don't send progress email if it's already sent
        if project_completion in [50, 100]:
            email_type = (
                EncouragingEmailType.PROJECT_COMPLETE.value
                if project_completion == 100
                else EncouragingEmailType.PROJECT_PROGRESS.value
            )
            project_title = ProjectInfo.get_dto_for_locale(
                project_id, project.default_locale
            ).name
            project.progress_email_sent = True
            project.save()
            threading.Thread(
                target=SMTPService.send_email_to_contributors_on_project_progress,
                args=(
                    email_type,
                    project_id,
                    project_title,
                    project_completion,
                ),
            ).start()

    @staticmethod
    def get_active_projects(interval):
        action_date = datetime.utcnow() - timedelta(hours=interval)
        history_result = (
            TaskHistory.query.with_entities(TaskHistory.project_id)
            .distinct()
            .filter((TaskHistory.action_date) >= action_date)
            .all()
        )
        project_ids = [row.project_id for row in history_result]
        chat_result = (
            ProjectChat.query.with_entities(ProjectChat.project_id)
            .distinct()
            .filter((ProjectChat.time_stamp) >= action_date)
            .all()
        )
        chat_project_ids = [row.project_id for row in chat_result]
        project_ids.extend(chat_project_ids)
        project_ids = list(set(project_ids))
        projects = (
            Project.query.with_entities(
                Project.id,
                Project.mapping_types,
                Project.geometry.ST_AsGeoJSON().label("geometry"),
            )
            .filter(
                Project.id.in_(project_ids),
            )
            .all()
        )
        features = []
        for project in projects:
            properties = {
                "project_id": project.id,
                "mapping_types": project.mapping_types,
            }
            feature = geojson.Feature(
                geometry=geojson.loads(project.geometry), properties=properties
            )
            features.append(feature)
        return geojson.FeatureCollection(features)
