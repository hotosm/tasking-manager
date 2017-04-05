from flask import current_app
from server.models.dtos.project_dto import ProjectDTO, ProjectSearchDTO
from server.models.postgis.project import Project, ProjectStatus
from server.models.postgis.utils import NotFound
from server.services.user_service import UserService


class ProjectServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ProjectService:

    project = Project

    @classmethod
    def from_project_id(cls, project_id):
        """
        Constructs service for supplied project
        :param project_id: ID of project in scope
        :raises NotFound if project doesn't exist in the DB
        """
        cls.project = Project.get(project_id)

        if cls.project is None:
            raise NotFound()

        return cls()

    @staticmethod
    def get_project_by_id(project_id: int) -> Project:
        project = Project.get(project_id)

        if project is None:
            raise NotFound()

        return project

    @staticmethod
    def get_project_dto_for_mapper(project_id, locale='en') -> ProjectDTO:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises ProjectServiceError, NotFound
        """
        project = ProjectService.get_project_by_id(project_id)

        if ProjectStatus(project.status) != ProjectStatus.PUBLISHED:
            raise ProjectServiceError(f'Project {project.id} is not published')

        return project.as_dto_for_mapping(locale)

    @staticmethod
    def is_user_permitted_to_map(project_id: int, user_id: int):
        """ Check if the user is allowed to map the on the project in scope """
        # TODO check if allowed user for private project
        # TODO check level if enforce mapper level
        project = ProjectService.get_project_by_id(project_id)

        task_count = project.get_task_count_for_user(user_id)

        if task_count > 0:
            return False, 'User already has a locked task on this project'
        return True, 'User allowed to map'

    @staticmethod
    def is_user_permitted_to_validate(project_id, user_id):
        """ Check if the user is allowed to validate on the project in scope """
        project = ProjectService.get_project_by_id(project_id)

        if project.enforce_validator_role and not UserService.is_user_validator(user_id):
            return False, 'User must be a validator to map on this project'

        return True, 'User allowed to validate'

    @staticmethod
    def get_projects_by_search_criteria(search_dto: ProjectSearchDTO):
        test = Project.get_projects_by_seach_criteria(search_dto)
