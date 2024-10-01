import json

import geojson
from databases import Database
from fastapi import BackgroundTasks
from loguru import logger

from backend.config import settings
from backend.exceptions import NotFound
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectCommentsDTO,
    ProjectDTO,
    ProjectSearchDTO,
)
from backend.models.postgis.project import Project, ProjectStatus, Task
from backend.models.postgis.statuses import TaskCreationMode, TeamRoles
from backend.models.postgis.task import TaskAction, TaskHistory, TaskStatus
from backend.models.postgis.user import User
from backend.models.postgis.utils import InvalidData, InvalidGeoJson
from backend.services.grid.grid_service import GridService
from backend.services.license_service import LicenseService
from backend.services.messaging.message_service import MessageService
from backend.services.organisation_service import OrganisationService
from backend.services.team_service import TeamService
from backend.services.users.user_service import UserService


class ProjectAdminServiceError(Exception):
    """Custom Exception to notify callers an error occurred when validating a Project"""

    def __init__(self, message):
        logger.debug(message)


class ProjectStoreError(Exception):
    """Custom Exception to notify callers an error occurred with database CRUD operations"""

    def __init__(self, message):
        logger.debug(message)


class ProjectAdminService:
    @staticmethod
    async def create_draft_project(
        draft_project_dto: DraftProjectDTO, db: Database
    ) -> int:
        """
        Validates and then persists draft projects in the DB
        :param draft_project_dto: Draft Project DTO with data from API
        :raises InvalidGeoJson
        :returns ID of new draft project
        """
        user_id = draft_project_dto.user_id
        is_admin = await UserService.is_user_an_admin(user_id, db)
        user_orgs = await OrganisationService.get_organisations_managed_by_user_as_dto(
            user_id, db
        )
        is_org_manager = len(user_orgs.organisations) > 0

        # First things first, we need to validate that the author_id is a PM. issue #1715
        if not (is_admin or is_org_manager):
            user = await UserService.get_user_by_id(user_id, db)
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
            org = await OrganisationService.get_organisation_by_id(
                draft_project_dto.organisation, db
            )
            draft_project_dto.organisation = org

            draft_project.create_draft_project(draft_project_dto)

        await draft_project.set_project_aoi(draft_project_dto, db)

        # if arbitrary_tasks requested, create tasks from aoi otherwise use tasks in DTO
        if draft_project_dto.has_arbitrary_tasks:
            tasks = GridService.tasks_from_aoi_features(
                draft_project_dto.area_of_interest
            )
            draft_project.task_creation_mode = TaskCreationMode.ARBITRARY.value
        else:
            tasks = draft_project_dto.tasks
        await ProjectAdminService._attach_tasks_to_project(draft_project, tasks, db)

        draft_project.set_default_changeset_comment()
        draft_project.set_country_info()
        if draft_project_dto.cloneFromProjectId:
            draft_project.save()  # Update the clone
        else:
            project_id = await Project.create(
                draft_project, draft_project_dto.project_name, db
            )  # Create the new project

        return project_id

    @staticmethod
    def _set_default_changeset_comment(draft_project: Project):
        """Sets the default changesset comment when project created"""
        default_comment = settings.DEFAULT_CHANGESET_COMMENT
        draft_project.changeset_comment = f"{default_comment}-{draft_project.id}"
        draft_project.save()

    @staticmethod
    async def _get_project_by_id(project_id: int, db: Database) -> Project:
        project = await Project.get(project_id, db)

        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return project

    @staticmethod
    async def get_project_dto_for_admin(project_id: int, db: Database) -> ProjectDTO:
        """Get the project as DTO for project managers"""
        project = await Project.exists(project_id, db)
        return await Project.as_dto_for_admin(project_id, db)

    @staticmethod
    async def update_project(
        project_dto: ProjectDTO, authenticated_user_id: int, db: Database
    ):
        project_id = project_dto.project_id

        if project_dto.project_status == ProjectStatus.PUBLISHED.name:
            ProjectAdminService._validate_default_locale(
                project_dto.default_locale, project_dto.project_info_locales
            )

        if project_dto.license_id:
            ProjectAdminService._validate_imagery_licence(project_dto.license_id)

        # To be handled before reaching this function
        if await ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id, db
        ):
            project = await ProjectAdminService._get_project_by_id(project_id, db)
            await Project.update(project, project_dto, db)
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
    async def delete_project(project_id: int, authenticated_user_id: int, db: Database):
        """Deletes project if it has no completed tasks"""

        project = await ProjectAdminService._get_project_by_id(project_id, db)
        is_admin = await UserService.is_user_an_admin(authenticated_user_id, db)
        user_orgs = await OrganisationService.get_organisations_managed_by_user_as_dto(
            authenticated_user_id, db
        )
        is_org_manager = len(user_orgs.organisations) > 0

        if is_admin or is_org_manager:
            if await Project.can_be_deleted(project, db):
                await Project.delete(project, db)
            else:
                raise ProjectAdminServiceError(
                    "HasMappedTasks- Project has mapped tasks, cannot be deleted"
                )
        else:
            raise ProjectAdminServiceError(
                "DeletePermissionError- User does not have permissions to delete project"
            )

    @staticmethod
    async def reset_all_tasks(project_id: int, user_id: int, db: Database):
        """Resets all tasks on project, preserving history"""

        # Fetch tasks that are not in the READY state
        query = """
            SELECT id, task_status
            FROM tasks
            WHERE project_id = :project_id
            AND task_status != :ready_status
        """
        tasks_to_reset = await db.fetch_all(
            query=query,
            values={
                "project_id": project_id,
                "ready_status": TaskStatus.READY.value,
            },
        )

        # Reset each task and preserve history
        for task in tasks_to_reset:
            task_id = task["id"]

            # Add a history entry for the task reset
            await Task.set_task_history(
                task_id=task_id,
                project_id=project_id,
                user_id=user_id,
                action=TaskAction.COMMENT,
                db=db,
                comment="Task reset",
                new_state=TaskStatus.READY,
            )

            # Reset the task's status to READY
            await Task.reset_task(
                task_id=task_id, project_id=project_id, user_id=user_id, db=db
            )

        # Reset project counters using raw SQL
        project_update_query = """
            UPDATE projects
            SET tasks_mapped = 0,
                tasks_validated = 0,
                tasks_bad_imagery = 0
            WHERE id = :project_id
        """
        await db.execute(query=project_update_query, values={"project_id": project_id})

    @staticmethod
    def get_all_comments(project_id: int) -> ProjectCommentsDTO:
        """Gets all comments mappers, validators have added to tasks associated with project"""
        comments = TaskHistory.get_all_comments(project_id)

        if len(comments.comments) == 0:
            raise NotFound(sub_code="COMMENTS_NOT_FOUND", project_id=project_id)

        return comments

    @staticmethod
    async def _attach_tasks_to_project(
        draft_project: Project, tasks_geojson, db: Database
    ):
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
                task = await Task.from_geojson_feature(task_count, feature, db)
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
    async def get_projects_for_admin(
        admin_id: int, preferred_locale: str, search_dto: ProjectSearchDTO, db: Database
    ):
        """Get all projects for provided admin"""
        return await Project.get_projects_for_admin(
            admin_id, preferred_locale, search_dto, db
        )

    @staticmethod
    async def transfer_project_to(
        project_id: int,
        transfering_user_id: int,
        username: str,
        db: Database,
        background_tasks: BackgroundTasks,
    ):
        """Transfers project from old owner (transfering_user_id) to new owner (username)"""
        project = await ProjectAdminService._get_project_by_id(project_id, db)
        new_owner = await UserService.get_user_by_username(username, db)
        # No operation is required if the new owner is same as old owner
        if username == project.author.username:
            return

        # Check permissions for the user (transferring_user_id) who initiatied the action
        is_admin = await UserService.is_user_an_admin(transfering_user_id, db)
        is_author = UserService.is_user_the_project_author(
            transfering_user_id, project.author_id, db
        )
        is_org_manager = await OrganisationService.is_user_an_org_manager(
            project.organisation_id, transfering_user_id, db
        )
        if not (is_admin or is_author or is_org_manager):
            raise ProjectAdminServiceError(
                "TransferPermissionError- User does not have permissions to transfer project"
            )

        # Check permissions for the new owner - must be project's org manager
        is_new_owner_org_manager = await OrganisationService.is_user_an_org_manager(
            project.organisation_id, new_owner.id, db
        )
        is_new_owner_admin = await UserService.is_user_an_admin(new_owner.id, db)
        if not (is_new_owner_org_manager or is_new_owner_admin):
            error_message = (
                "InvalidNewOwner- New owner must be project's org manager or TM admin"
            )
            logger.debug(error_message)
            raise ValueError(error_message)
        else:
            transferred_by = User.get_by_id(transfering_user_id, db)
            transferred_by = transferred_by.username
            project.author_id = new_owner.id
            Project.save(project, db)
            # Adding the background task
            background_tasks.add_task(
                MessageService.send_project_transfer_message,
                project_id,
                username,
                transferred_by,
            )

    @staticmethod
    async def is_user_action_permitted_on_project(
        authenticated_user_id: int, project_id: int, db: Database
    ) -> bool:
        """Is user action permitted on project"""
        # Fetch the project details
        project_query = """
            SELECT author_id, organisation_id
            FROM projects
            WHERE id = :project_id
        """
        project = await db.fetch_one(
            query=project_query, values={"project_id": project_id}
        )
        if not project:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        author_id = project.author_id
        organisation_id = project.organisation_id

        is_admin = await UserService.is_user_an_admin(authenticated_user_id, db)

        # Check if the user is the project author
        is_author = authenticated_user_id == author_id
        is_org_manager = False
        is_manager_team = False
        # If the user is neither an admin nor the author, check further permissions
        if not (is_admin or is_author):
            if organisation_id:
                # Check if the user is an organisation manager
                is_org_manager = await OrganisationService.is_user_an_org_manager(
                    organisation_id, authenticated_user_id, db
                )
                if not is_org_manager:
                    # Check if the user is a project manager in the team
                    is_manager_team = await TeamService.check_team_membership(
                        project_id,
                        [TeamRoles.PROJECT_MANAGER.value],
                        authenticated_user_id,
                        db,
                    )

        return is_admin or is_author or is_org_manager or is_manager_team
