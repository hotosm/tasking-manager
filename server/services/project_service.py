from flask import current_app
from server.models.dtos.project_dto import ProjectDTO
from server.models.postgis.project import Project, ProjectStatus
from server.models.postgis.utils import NotFound


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

    def get_project_dto_for_mapper(self, locale='en') -> ProjectDTO:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises DatabaseError, MappingServiceError
        """
        if ProjectStatus(self.project.status) != ProjectStatus.PUBLISHED:
            raise ProjectServiceError(f'Project {self.project.id} is not published')

        return self.project.as_dto_for_mapping(locale)

    def is_user_permitted_to_lock_task(self, user_id):
        # TODO check if allowed user for private project
        # TODO check level if enforce mapper level

        task_count = self.project.get_task_count_for_user(user_id)

        if task_count > 0:
            return False, 'User already has a locked task on this project'
        return True, 'User allowed to lock task'
