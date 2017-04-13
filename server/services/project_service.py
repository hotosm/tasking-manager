from flask import current_app
from server.models.dtos.project_dto import ProjectDTO, ProjectSearchDTO, LockedTasksForUser
from server.models.postgis.project import Project, ProjectStatus, MappingLevel, MappingTypes
from server.models.postgis.utils import NotFound
from server.services.user_service import UserService


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
    def is_user_permitted_to_map(project_id: int, user_id: int):
        """ Check if the user is allowed to map the on the project in scope """
        # TODO check if allowed user for private project
        project = ProjectService.get_project_by_id(project_id)

        tasks = project.get_locked_tasks_for_user(user_id)

        if len(tasks) > 0:
            return False, 'User already has a locked task on this project'

        if project.enforce_mapper_level:
            if not ProjectService._is_user_mapping_level_at_or_above_level_requests(MappingLevel(project.mapper_level),
                                                                                                 user_id):
                return False, 'User is below required mapping level for this project'

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

        if project.enforce_validator_role and not UserService.is_user_validator(user_id):
            return False, 'User must be a validator to map on this project'

        return True, 'User allowed to validate'

    @staticmethod
    def get_projects_by_search_criteria(search_dto: ProjectSearchDTO):
        """ Find all projects that match the serach criteria"""
        # TODO going to have to look at caching here

        sql = ProjectService.generate_search_sql(search_dto)
        results = Project.get_projects_by_seach_criteria(sql, search_dto.preferred_locale)

        return results

    @staticmethod
    def generate_search_sql(search_dto: ProjectSearchDTO) -> str:

        sql = """select p.id, p.mapper_level, p.priority, p.default_locale, st_asgeojson(a.centroid)
                   from projects p,
                        areas_of_interest a
                  where p.id = a.id
                    and p.status = {0}""".format(ProjectStatus.PUBLISHED.value)

        if search_dto.mapper_level:
            sql = f'{sql} and p.mapper_level = {MappingLevel[search_dto.mapper_level].value}'

        if search_dto.mapping_types:
            count = 0
            mapping_type_array = ''
            for mapping_type in search_dto.mapping_types:
                if count > 0:
                    mapping_type_array += ','

                mapping_type_array += str(MappingTypes[mapping_type].value)
                count += 1

            sql = f'{sql} and ARRAY[{mapping_type_array}] && p.mapping_types'

        return sql
