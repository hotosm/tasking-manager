from cachetools import TTLCache, cached
from flask import current_app

from server.models.dtos.mapping_dto import TaskDTOs
from server.models.dtos.project_dto import ProjectDTO, LockedTasksForUser, ProjectSummary
from server.models.postgis.project import Project, ProjectStatus, MappingLevel
from server.models.postgis.statuses import MappingNotAllowed, ValidatingNotAllowed
from server.models.postgis.task import Task
from server.models.postgis.utils import NotFound
from server.services.users.user_service import UserService

summary_cache = TTLCache(maxsize=1024, ttl=600)


class ProjectServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ProjectService:
    @staticmethod
    def get_project_by_id(project_id: int) -> Project:
        project = Project.get(project_id)

        if project is None:
            raise NotFound()

        return project

    @staticmethod
    def auto_unlock_tasks(project_id: int):
        Task.auto_unlock_tasks(project_id)

    @staticmethod
    def get_project_dto_for_mapper(project_id, locale='en') -> ProjectDTO:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises ProjectServiceError, NotFound
        """
        project = ProjectService.get_project_by_id(project_id)
        return project.as_dto_for_mapping(locale)

    @staticmethod
    def get_project_aoi(project_id):
        project = ProjectService.get_project_by_id(project_id)
        return project.get_aoi_geometry_as_geojson()

    @staticmethod
    def get_task_for_logged_in_user(project_id: int, user_id: int):
        """ if the user is working on a task in the project return it """
        project = ProjectService.get_project_by_id(project_id)

        tasks = project.get_locked_tasks_for_user(user_id)

        if len(tasks) == 0:
            raise NotFound()

        tasks_dto = LockedTasksForUser()
        tasks_dto.locked_tasks = tasks
        return tasks_dto

    @staticmethod
    def get_task_details_for_logged_in_user(project_id: int, user_id: int, preferred_locale: str):
        """ if the user is working on a task in the project return it """
        project = ProjectService.get_project_by_id(project_id)

        tasks = project.get_locked_tasks_details_for_user(user_id)

        if len(tasks) == 0:
            raise NotFound()

        # TODO put the task details in to a DTO
        dtos = []
        for task in tasks:
            dtos.append(task.as_dto_with_instructions(preferred_locale))

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def is_user_permitted_to_map(project_id: int, user_id: int):
        """ Check if the user is allowed to map the on the project in scope """
        project = ProjectService.get_project_by_id(project_id)

        if ProjectStatus(project.status) != ProjectStatus.PUBLISHED:
            return False, MappingNotAllowed.PROJECT_NOT_PUBLISHED

        tasks = project.get_locked_tasks_for_user(user_id)

        if len(tasks) > 0:
            return False, MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        if project.enforce_mapper_level:
            if not ProjectService._is_user_mapping_level_at_or_above_level_requests(MappingLevel(project.mapper_level),
                                                                                    user_id):
                return False, MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL

        if project.license_id:
            if not UserService.has_user_accepted_license(user_id, project.license_id):
                return False, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        if project.private:
            # Check user is in allowed users
            try:
                next(user for user in project.allowed_users if user.id == user_id)
            except StopIteration:
                return False, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        return True, 'User allowed to map'

    @staticmethod
    def _is_user_mapping_level_at_or_above_level_requests(requested_level, user_id):
        """ Helper method to determine if user level at or above requested level """
        user_mapping_level = UserService.get_mapping_level(user_id)

        if requested_level == MappingLevel.INTERMEDIATE:
            if user_mapping_level not in [MappingLevel.INTERMEDIATE, MappingLevel.ADVANCED]:
                return False
        elif requested_level == MappingLevel.ADVANCED:
            if user_mapping_level != MappingLevel.ADVANCED:
                return False

        return True

    @staticmethod
    def is_user_permitted_to_validate(project_id, user_id):
        """ Check if the user is allowed to validate on the project in scope """
        project = ProjectService.get_project_by_id(project_id)

        if ProjectStatus(project.status) != ProjectStatus.PUBLISHED:
            return False, ValidatingNotAllowed.PROJECT_NOT_PUBLISHED

        if project.enforce_validator_role and not UserService.is_user_validator(user_id):
            return False, ValidatingNotAllowed.USER_NOT_VALIDATOR

        if project.license_id:
            if not UserService.has_user_accepted_license(user_id, project.license_id):
                return False, ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        if project.private:
            # Check user is in allowed users
            try:
                next(user for user in project.allowed_users if user.id == user_id)
            except StopIteration:
                return False, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        return True, 'User allowed to validate'

    @staticmethod
    @cached(summary_cache)
    def get_project_summary(project_id: int, preferred_locale: str = 'en') -> ProjectSummary:
        """ Gets the project summary DTO """
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_summary(preferred_locale)
