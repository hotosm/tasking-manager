import json
import threading
import geojson
from flask import current_app

from backend.exceptions import NotFound
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectDTO,
    ProjectCommentsDTO,
    ProjectSearchDTO,
)
from backend.models.postgis.project import Project, Task, ProjectStatus
from backend.models.postgis.statuses import TaskCreationMode, TeamRoles
from backend.models.postgis.task import TaskHistory, TaskStatus, TaskAction
from backend.models.postgis.user import User
from backend.models.postgis.utils import InvalidData, InvalidGeoJson
from backend.services.grid.grid_service import GridService
from backend.services.license_service import LicenseService
from backend.services.messaging.message_service import MessageService
from backend.services.users.user_service import UserService
from backend.services.organisation_service import OrganisationService
from backend.services.team_service import TeamService


class ProjectAdminServiceError(Exception):
    """Custom Exception to notify callers an error occurred when validating a Project"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class ProjectStoreError(Exception):
    """Custom Exception to notify callers an error occurred with database CRUD operations"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class ProjectAdminService:
    @staticmethod
    def create_draft_project(draft_project_dto: DraftProjectDTO) -> int:
        """
        Validates and then persists draft projects in the DB
        :param draft_project_dto: Draft Project DTO with data from API
        :raises InvalidGeoJson
        :returns ID of new draft project
        """
        user_id = draft_project_dto.user_id
        is_admin = UserService.is_user_an_admin(user_id)
        user_orgs = OrganisationService.get_organisations_managed_by_user_as_dto(
            user_id
        )
        is_org_manager = len(user_orgs.organisations) > 0

        # First things first, we need to validate that the author_id is a PM. issue #1715
        if not (is_admin or is_org_manager):
            user = UserService.get_user_by_id(user_id)
            raise (
                ProjectAdminServiceError(
                    f"NotPermittedToCreate- User {user.username} is not permitted to create project"
                )
            )

        # If we're cloning we'll copy all the project details from the clone, otherwise create brand new project
        if draft_project_dto.cloneFromProjectId:
            draft_project = Project.clone(draft_project_dto.cloneFromProjectId, user_id)
        else:
            draft_project = Project()
            org = OrganisationService.get_organisation_by_id(
                draft_project_dto.organisation
            )
            draft_project_dto.organisation = org
            draft_project.create_draft_project(draft_project_dto)

        draft_project.set_project_aoi(draft_project_dto)

        # if arbitrary_tasks requested, create tasks from aoi otherwise use tasks in DTO
        if draft_project_dto.has_arbitrary_tasks:
            tasks = GridService.tasks_from_aoi_features(
                draft_project_dto.area_of_interest
            )
            draft_project.task_creation_mode = TaskCreationMode.ARBITRARY.value
        else:
            tasks = draft_project_dto.tasks
        ProjectAdminService._attach_tasks_to_project(draft_project, tasks)

        if draft_project_dto.cloneFromProjectId:
            draft_project.save()  # Update the clone
        else:
            draft_project.create()  # Create the new project

        draft_project.set_default_changeset_comment()
        draft_project.set_country_info()
        return draft_project.id

    @staticmethod
    def _set_default_changeset_comment(draft_project: Project):
        """Sets the default changesset comment when project created"""
        default_comment = current_app.config["DEFAULT_CHANGESET_COMMENT"]
        draft_project.changeset_comment = f"{default_comment}-{draft_project.id}"
        draft_project.save()

    @staticmethod
    def _get_project_by_id(project_id: int) -> Project:
        project = Project.get(project_id)

        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return project

    @staticmethod
    def get_project_dto_for_admin(project_id: int) -> ProjectDTO:
        """Get the project as DTO for project managers"""
        project = ProjectAdminService._get_project_by_id(project_id)
        return project.as_dto_for_admin(project_id)

    @staticmethod
    def update_project(project_dto: ProjectDTO, authenticated_user_id: int):
        project_id = project_dto.project_id

        if project_dto.project_status == ProjectStatus.PUBLISHED.name:
            ProjectAdminService._validate_default_locale(
                project_dto.default_locale, project_dto.project_info_locales
            )

        if project_dto.license_id:
            ProjectAdminService._validate_imagery_licence(project_dto.license_id)

        # To be handled before reaching this function
        if ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id
        ):
            project = ProjectAdminService._get_project_by_id(project_id)
            project.update(project_dto)
        else:
            raise ValueError(
                str(project_id)
                + " :Project can only be updated by admins or by the owner"
            )

        return project

    @staticmethod
    def _validate_imagery_licence(license_id: int):
        """Ensures that the suppliced license Id actually exists"""
        try:
            LicenseService.get_license_as_dto(license_id)
        except NotFound:
            raise ProjectAdminServiceError(
                f"RequireLicenseId- LicenseId {license_id} not found"
            )

    @staticmethod
    def delete_project(project_id: int, authenticated_user_id: int):
        """Deletes project if it has no completed tasks"""

        project = ProjectAdminService._get_project_by_id(project_id)
        is_admin = UserService.is_user_an_admin(authenticated_user_id)
        user_orgs = OrganisationService.get_organisations_managed_by_user_as_dto(
            authenticated_user_id
        )
        is_org_manager = len(user_orgs.organisations) > 0

        if is_admin or is_org_manager:
            if project.can_be_deleted():
                project.delete()
            else:
                raise ProjectAdminServiceError(
                    "HasMappedTasks- Project has mapped tasks, cannot be deleted"
                )
        else:
            raise ProjectAdminServiceError(
                "DeletePermissionError- User does not have permissions to delete project"
            )

    @staticmethod
    def reset_all_tasks(project_id: int, user_id: int):
        """Resets all tasks on project, preserving history"""
        tasks_to_reset = Task.query.filter(
            Task.project_id == project_id,
            Task.task_status != TaskStatus.READY.value,
        ).all()

        for task in tasks_to_reset:
            task.set_task_history(
                TaskAction.COMMENT, user_id, "Task reset", TaskStatus.READY
            )
            task.reset_task(user_id)

        # Reset project counters
        project = ProjectAdminService._get_project_by_id(project_id)
        project.tasks_mapped = 0
        project.tasks_validated = 0
        project.tasks_bad_imagery = 0
        project.save()

    @staticmethod
    def get_all_comments(project_id: int) -> ProjectCommentsDTO:
        """Gets all comments mappers, validators have added to tasks associated with project"""
        comments = TaskHistory.get_all_comments(project_id)

        if len(comments.comments) == 0:
            raise NotFound(sub_code="COMMENTS_NOT_FOUND", project_id=project_id)

        return comments

    @staticmethod
    def _attach_tasks_to_project(draft_project: Project, tasks_geojson):
        """
        Validates then iterates over the array of tasks and attach them to the draft project
        :param draft_project: Draft project in scope
        :param tasks_geojson: GeoJSON feature collection of mapping tasks
        :raises InvalidGeoJson, InvalidData
        """
        tasks = geojson.loads(json.dumps(tasks_geojson))

        if type(tasks) is not geojson.FeatureCollection:
            raise InvalidGeoJson(
                "MustBeFeatureCollection- Invalid: GeoJson must be FeatureCollection"
            )

        if not tasks.is_valid:
            raise InvalidGeoJson(
                "InvalidFeatureCollection - " + ", ".join(tasks.errors())
            )

        task_count = 1
        for feature in tasks["features"]:
            try:
                task = Task.from_geojson_feature(task_count, feature)
            except (InvalidData, InvalidGeoJson) as e:
                raise e

            draft_project.tasks.append(task)
            task_count += 1

        task_count -= 1  # Remove last increment before falling out loop
        draft_project.total_tasks = task_count

    @staticmethod
    def _validate_default_locale(default_locale, project_info_locales):
        """
        Validates that all fields for the default project info locale have been completed
        :param default_locale: Admin supplied default locale
        :param project_info_locales: All locales supplied by admin
        :raises ProjectAdminServiceError
        :return: True if valid
        """
        default_info = None
        for info in project_info_locales:
            if info.locale.lower() == default_locale.lower():
                default_info = info
                break

        if default_info is None:
            raise ProjectAdminServiceError(
                "InfoForLocaleRequired- Project Info for Default Locale not provided"
            )

        for attr, value in default_info.items():
            if attr == "per_task_instructions":
                continue  # Not mandatory field

            if not value:
                raise (
                    ProjectAdminServiceError(
                        f"MissingRequiredAttribute- {attr} not provided for Default Locale"
                    )
                )

        return True  # Indicates valid default locale for unit testing

    @staticmethod
    def get_projects_for_admin(
        admin_id: int, preferred_locale: str, search_dto: ProjectSearchDTO
    ):
        """Get all projects for provided admin"""
        return Project.get_projects_for_admin(admin_id, preferred_locale, search_dto)

    @staticmethod
    def transfer_project_to(project_id: int, transfering_user_id: int, username: str):
        """Transfers project from old owner (transfering_user_id) to new owner (username)"""
        project = ProjectAdminService._get_project_by_id(project_id)
        new_owner = UserService.get_user_by_username(username)
        # No operation is required if the new owner is same as old owner
        if username == project.author.username:
            return

        # Check permissions for the user (transferring_user_id) who initiatied the action
        is_admin = UserService.is_user_an_admin(transfering_user_id)
        is_author = UserService.is_user_the_project_author(
            transfering_user_id, project.author_id
        )
        is_org_manager = OrganisationService.is_user_an_org_manager(
            project.organisation_id, transfering_user_id
        )
        if not (is_admin or is_author or is_org_manager):
            raise ProjectAdminServiceError(
                "TransferPermissionError- User does not have permissions to transfer project"
            )

        # Check permissions for the new owner - must be project's org manager
        is_new_owner_org_manager = OrganisationService.is_user_an_org_manager(
            project.organisation_id, new_owner.id
        )
        is_new_owner_admin = UserService.is_user_an_admin(new_owner.id)
        if not (is_new_owner_org_manager or is_new_owner_admin):
            error_message = (
                "InvalidNewOwner- New owner must be project's org manager or TM admin"
            )
            if current_app:
                current_app.logger.debug(error_message)
            raise ValueError(error_message)
        else:
            transferred_by = User.get_by_id(transfering_user_id).username
            project.author_id = new_owner.id
            project.save()
            threading.Thread(
                target=MessageService.send_project_transfer_message,
                args=(project_id, username, transferred_by),
            ).start()

    @staticmethod
    def is_user_action_permitted_on_project(
        authenticated_user_id: int, project_id: int
    ) -> bool:
        """Is user action permitted on project"""
        project = Project.get(project_id)
        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)
        author_id = project.author_id
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]

        is_admin = UserService.is_user_an_admin(authenticated_user_id)
        is_author = UserService.is_user_the_project_author(
            authenticated_user_id, author_id
        )
        is_org_manager = False
        is_manager_team = False
        if not (is_admin or is_author):
            if hasattr(project, "organisation_id") and project.organisation_id:
                org_id = project.organisation_id
                is_org_manager = OrganisationService.is_user_an_org_manager(
                    org_id, authenticated_user_id
                )
                if not is_org_manager:
                    is_manager_team = TeamService.check_team_membership(
                        project_id, allowed_roles, authenticated_user_id
                    )

        return is_admin or is_author or is_org_manager or is_manager_team
