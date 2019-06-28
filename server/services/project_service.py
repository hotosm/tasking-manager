from cachetools import TTLCache, cached
from flask import current_app
from server import db
from sqlalchemy import or_
from sqlalchemy.orm import aliased
from server.models.dtos.mapping_dto import TaskDTOs
from server.models.dtos.stats_dto import Pagination
from server.models.dtos.project_dto import (
    ProjectDTO, LockedTasksForUser, ProjectSummary, ProjectStatsDTO,
    ProjectUserStatsDTO, ProjectTasksDTO, TaskOverviewDTO
)
from server.models.postgis.project import Project, ProjectInfo, ProjectStatus, MappingLevel
from server.models.postgis.statuses import MappingNotAllowed, ValidatingNotAllowed
from server.models.postgis.task import Task, TaskStatus, TaskHistory
from server.models.postgis.utils import NotFound
from server.services.users.user_service import User, UserService

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
    def get_project_dto_for_mapper(project_id, locale='en', abbrev=False) -> ProjectDTO:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises ProjectServiceError, NotFound
        """
        project = ProjectService.get_project_by_id(project_id)
        return project.as_dto_for_mapping(locale, abbrev)

    @staticmethod
    def get_project_tasks(project_id):
        project = ProjectService.get_project_by_id(project_id)
        return project.all_tasks_as_geojson()

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
    def get_latest_tasks(project_id: int, locale='en', page=1, page_size=10, sort_by=None, sort_direction=None, mapper_name=None, validator_name=None, status=None, project_name=None, all_results=False) -> ProjectTasksDTO:
        """ Gets the latest overview of project tasks status """
        sort_column = None if not sort_by else Task.__table__.columns.get(sort_by)
        if sort_column is None:
            sort_column = TaskHistory.action_date

        if sort_direction is not None and sort_direction.lower() == "asc":
            sort_column = sort_column.asc()
        else:
            sort_column = sort_column.desc()
        sort_column = sort_column.nullslast()

        mapper = aliased(User, name="mapper")
        lock_holder = aliased(User, name="lock_holder")
        validator = aliased(User, name="validator")
        latest_history = aliased(TaskHistory, name='latest')
        latest_history_id = (db.session.query(latest_history.id)
                                       .filter(latest_history.task_id == Task.id)
                                       .filter(latest_history.project_id == Task.project_id)
                                       .order_by(latest_history.action_date.desc())
                                       .order_by(latest_history.id.desc())
                                       .limit(1)
                                       .correlate(Task)
                                       .as_scalar())

        query = db.session.query(Task.id, Task.project_id, Task.task_status,
                                 mapper.username.label("mapper_name"), validator.username.label("validator_name"),
                                 lock_holder.username.label("lock_holder_name"), TaskHistory.action_date) \
                          .outerjoin(TaskHistory, Task.task_history) \
                          .filter(or_(TaskHistory.id == latest_history_id, TaskHistory.id.is_(None))) \
                          .outerjoin((mapper, Task.mapper), (validator, Task.validator), (lock_holder, Task.lock_holder))

        if project_id is not None:
            query = query.filter(Task.project_id == project_id)
        else:
            # Include project name. Ignore draft and archived projects
            query = query.join(Project, Task.project_id == Project.id) \
                         .filter(Project.status == ProjectStatus.PUBLISHED.value) \
                         .add_columns(ProjectInfo.name.label('project_title')) \
                         .filter(Project.id == ProjectInfo.project_id) \
                         .filter(ProjectInfo.locale.in_([locale, 'en'])) \

            if project_name is not None:
                query = query.filter(ProjectInfo.name.ilike('%' + project_name.lower() + '%'))

        if status is not None:
            query = query.filter(Task.task_status == status)

        if mapper_name is not None:
            # Filter on mapper, but also include lock holder if task is locked for mapping
            query = query.filter((mapper.username.ilike(mapper_name.lower() + '%')) | \
                                 ((Task.task_status == TaskStatus.LOCKED_FOR_MAPPING.value) & \
                                  (lock_holder.username.ilike(mapper_name.lower() + '%'))))

        if validator_name is not None:
            # Filter on validator, but also include lock holder if task is locked for validation
            query = query.filter((validator.username.ilike(validator_name.lower() + '%')) | \
                                 ((Task.task_status == TaskStatus.LOCKED_FOR_VALIDATION.value) & \
                                  (lock_holder.username.ilike(validator_name.lower() + '%'))))

        query = query.order_by(sort_column)
        paginated_results = query.paginate(page, page_size, True) if not all_results else None
        items = paginated_results.items if paginated_results else query.all()
        if len(items) == 0:
            raise NotFound()

        tasks_dto = ProjectTasksDTO()
        for item in items:
            task = TaskOverviewDTO()
            if 'project_title' in item.keys():
                task.project_title = item.project_title
            task.project_id = item.project_id
            task.task_id = item.id

            task.task_status = item.task_status
            task.status_name = TaskStatus(item.task_status).name
            task.updated_date = item.action_date

            if item.task_status == TaskStatus.LOCKED_FOR_MAPPING.value:
                task.mapper_name = item.lock_holder_name
            else:
                task.mapper_name = item.mapper_name

            if item.task_status == TaskStatus.LOCKED_FOR_VALIDATION.value:
                task.validator_name = item.lock_holder_name
            else:
                task.validator_name = item.validator_name

            tasks_dto.tasks.append(task)

        tasks_dto.pagination = Pagination(paginated_results) if paginated_results else None
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
        if UserService.is_user_blocked(user_id):
            return False, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = ProjectService.get_project_by_id(project_id)

        if ProjectStatus(project.status) != ProjectStatus.PUBLISHED and not UserService.is_user_a_project_manager(user_id):
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
        if UserService.is_user_blocked(user_id):
            return False, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = ProjectService.get_project_by_id(project_id)

        if ProjectStatus(project.status) != ProjectStatus.PUBLISHED and not UserService.is_user_a_project_manager(user_id):
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

    @staticmethod
    def get_project_title(project_id: int, preferred_locale: str = 'en') -> str:
        """ Gets the project title DTO """
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_title(preferred_locale)

    @staticmethod
    def get_project_stats(project_id: int) -> ProjectStatsDTO:
        """ Gets the project stats DTO """
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_stats()

    @staticmethod
    def get_project_user_stats(project_id: int, username: str) -> ProjectUserStatsDTO:
        """ Gets the user stats for a specific project """
        print(project_id)
        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_username(username)
        return project.get_project_user_stats(user.id)
