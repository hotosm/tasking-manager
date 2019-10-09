from cachetools import TTLCache, cached
from flask import current_app
import datetime
from sqlalchemy import text, func, or_, desc, and_, distinct
from server import db
from server.models.dtos.project_dto import ProjectFavoritesDTO, ProjectSearchResultsDTO
from server.models.dtos.user_dto import (
    UserDTO,
    UserOSMDTO,
    UserFilterDTO,
    UserSearchQuery,
    UserSearchDTO,
    UserStatsDTO,
    UserContributionDTO,
    UserRegisterEmailDTO,
    UserCountryContributed,
    UserCountriesContributed,
)
from server.models.dtos.interests_dto import InterestsDTO, InterestDTO
from server.models.postgis.interests import Interest, projects_interests
from server.models.postgis.message import Message
from server.models.postgis.project import Project
from server.models.postgis.user import User, UserRole, MappingLevel, UserEmail
from server.models.postgis.task import TaskHistory, TaskAction, Task
from server.models.dtos.user_dto import UserTaskDTOs
from server.models.dtos.stats_dto import Pagination
from server.models.postgis.statuses import TaskStatus, ProjectStatus
from server.models.postgis.utils import NotFound
from server.services.users.osm_service import OSMService, OSMServiceError
from server.services.messaging.smtp_service import SMTPService
from server.services.messaging.template_service import get_template


user_filter_cache = TTLCache(maxsize=1024, ttl=600)
user_all_cache = TTLCache(maxsize=1024, ttl=600)


class UserServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when in the User Service """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class UserService:
    @staticmethod
    def get_user_by_id(user_id: int) -> User:
        user = User().get_by_id(user_id)

        if user is None:
            raise NotFound()

        return user

    @staticmethod
    def get_user_by_username(username: str) -> User:
        user = User.get_by_username(username)

        if user is None:
            raise NotFound()

        return user

    @staticmethod
    def get_contributions_by_day(user_id: int):
        # Validate that user exists.
        stats = (
            TaskHistory.query.with_entities(
                func.DATE(TaskHistory.action_date).label("day"),
                func.count(TaskHistory.action).label("cnt"),
            )
            .filter(TaskHistory.user_id == user_id)
            .filter(TaskHistory.action == TaskAction.STATE_CHANGE.name)
            .filter(
                func.DATE(TaskHistory.action_date)
                > datetime.date.today() - datetime.timedelta(days=365)
            )
            .group_by("day")
            .order_by(desc("day"))
        )

        contributions = [
            UserContributionDTO(dict(date=str(s[0]), count=s[1])) for s in stats
        ]

        return contributions

    @staticmethod
    def get_project_managers() -> User:
        users = User.query.filter(User.role == 2).all()

        if users is None:
            raise NotFound()

        return users

    @staticmethod
    def get_general_admins() -> User:
        users = User.query.filter(User.role == 1).all()

        if users is None:
            raise NotFound()

        return users

    @staticmethod
    def update_user(user_id: int, osm_username: str, picture_url: str) -> User:
        user = UserService.get_user_by_id(user_id)
        if user.username != osm_username:
            user.update_username(osm_username)

        if picture_url is not None and user.picture_url != picture_url:
            user.update_picture_url(picture_url)

        return user

    @staticmethod
    def get_projects_favorited(user_id: int) -> ProjectFavoritesDTO:
        user = UserService.get_user_by_id(user_id)
        projects_dto = [f.as_dto_for_admin(f.id) for f in user.favorites]

        fav_dto = ProjectFavoritesDTO()
        fav_dto.favorited_projects = projects_dto

        return fav_dto

    @staticmethod
    def get_projects_mapped(user_id: int):
        user = UserService.get_user_by_id(user_id)
        projects_mapped = user.projects_mapped

        # Return empty list if the user has no projects_mapped.
        if projects_mapped is None:
            return []

        return projects_mapped

    @staticmethod
    def register_user(osm_id, username, changeset_count, picture_url, email):
        """
        Creates user in DB
        :param osm_id: Unique OSM user id
        :param username: OSM Username
        :param changeset_count: OSM changeset count
        """
        new_user = User()
        new_user.id = osm_id
        new_user.username = username
        if picture_url is not None:
            new_user.picture_url = picture_url

        intermediate_level = current_app.config["MAPPER_LEVEL_INTERMEDIATE"]
        advanced_level = current_app.config["MAPPER_LEVEL_ADVANCED"]

        if changeset_count > advanced_level:
            new_user.mapping_level = MappingLevel.ADVANCED.value
        elif intermediate_level < changeset_count < advanced_level:
            new_user.mapping_level = MappingLevel.INTERMEDIATE.value
        else:
            new_user.mapping_level = MappingLevel.BEGINNER.value

        if email is not None:
            new_user.email_address = email

        new_user.create()
        return new_user

    @staticmethod
    def get_user_dto_by_username(
        requested_username: str, logged_in_user_id: int
    ) -> UserDTO:
        """Gets user DTO for supplied username """
        requested_user = UserService.get_user_by_username(requested_username)
        logged_in_user = UserService.get_user_by_id(logged_in_user_id)
        UserService.check_and_update_mapper_level(requested_user.id)

        return requested_user.as_dto(logged_in_user.username)

    @staticmethod
    def get_user_dto_by_id(requested_user: int) -> UserDTO:
        """Gets user DTO for supplied user id """
        requested_user = UserService.get_user_by_id(requested_user)

        return requested_user.as_dto(requested_user.username)

    @staticmethod
    def get_interests_stats(user_id):
        # Get all projects that the user has contributed.
        stmt = (
            TaskHistory.query.with_entities(TaskHistory.project_id)
            .distinct()
            .filter(TaskHistory.user_id == user_id)
        )

        interests = (
            Interest.query.with_entities(
                Interest.id,
                Interest.name,
                func.count(distinct(projects_interests.c.project_id)).label(
                    "count_projects"
                ),
            )
            .outerjoin(
                projects_interests,
                and_(
                    Interest.id == projects_interests.c.interest_id,
                    projects_interests.c.project_id.in_(stmt),
                ),
            )
            .group_by(Interest.id)
            .order_by(desc("count_projects"))
            .all()
        )

        interests_dto = [
            InterestDTO(dict(id=i.id, name=i.name, count_projects=i.count_projects))
            for i in interests
        ]

        return interests_dto

    @staticmethod
    def get_tasks_dto(
        user_id: int,
        start_date: datetime.datetime = None,
        end_date: datetime.datetime = None,
        task_status: str = None,
        project_status: str = None,
        project_id: int = None,
        page=1,
        page_size=10,
        sort_by: str = None,
    ) -> UserTaskDTOs:
        base_query = (
            TaskHistory.query.with_entities(
                TaskHistory.project_id,
                TaskHistory.task_id,
                func.max(TaskHistory.action_date),
            )
            .filter(TaskHistory.user_id == user_id)
            .group_by(TaskHistory.task_id, TaskHistory.project_id)
        )

        if start_date:
            base_query = base_query.filter(TaskHistory.action_date >= start_date)

        if end_date:
            base_query = base_query.filter(TaskHistory.action_date <= end_date)

        if sort_by == "action_date":
            base_query = base_query.order_by(func.max(TaskHistory.action_date))
        elif sort_by == "-action_date":
            base_query = base_query.order_by(desc(func.max(TaskHistory.action_date)))

        user_task_dtos = UserTaskDTOs()
        task_id_list = base_query.subquery()

        tasks = Task.query.join(
            task_id_list,
            and_(
                Task.id == task_id_list.c.task_id,
                Task.project_id == task_id_list.c.project_id,
            ),
        )
        tasks = tasks.add_column("max_1")

        if task_status:
            tasks = tasks.filter(
                Task.task_status == TaskStatus[task_status.upper()].value
            )

        if project_status:
            tasks = tasks.filter(
                Task.project_id == Project.id,
                Project.status == ProjectStatus[project_status.upper()].value,
            )

        if project_id:
            tasks = tasks.filter_by(project_id=project_id)

        results = tasks.paginate(page, page_size, True)

        task_list = []

        for task, action_date in results.items:
            task_list.append(task.as_dto(last_updated=action_date))

        user_task_dtos.user_tasks = task_list
        user_task_dtos.pagination = Pagination(results)
        return user_task_dtos

    @staticmethod
    def get_detailed_stats(username: str):
        user = UserService.get_user_by_username(username)
        stats_dto = UserStatsDTO()

        actions = TaskHistory.query.filter(  # noqa
            TaskHistory.user_id == user.id, TaskHistory.action_text != ""
        ).all()

        tasks_mapped = TaskHistory.query.filter(
            TaskHistory.user_id == user.id, TaskHistory.action_text == "MAPPED"
        ).count()
        tasks_validated = TaskHistory.query.filter(
            TaskHistory.user_id == user.id, TaskHistory.action_text == "VALIDATED"
        ).count()

        projects_mapped = UserService.get_projects_mapped(user.id)
        stats_dto.tasks_mapped = tasks_mapped
        stats_dto.tasks_validated = tasks_validated
        stats_dto.projects_mapped = len(projects_mapped)
        stats_dto.countries_contributed = UserService.get_countries_contributed(user.id)
        stats_dto.contributions_by_day = UserService.get_contributions_by_day(user.id)
        stats_dto.total_time_spent = 0
        stats_dto.time_spent_mapping = 0
        stats_dto.time_spent_validating = 0

        sql = """SELECT SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME) FROM task_history
                WHERE (action='LOCKED_FOR_VALIDATION' or action='AUTO_UNLOCKED_FOR_VALIDATION')
                and user_id = :user_id;"""
        total_validation_time = db.engine.execute(text(sql), user_id=user.id)
        for time in total_validation_time:
            total_validation_time = time[0]
            if total_validation_time:
                stats_dto.time_spent_validating = total_validation_time.total_seconds()
                stats_dto.total_time_spent += stats_dto.time_spent_validating

        sql = """SELECT SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME) FROM task_history
                WHERE (action='LOCKED_FOR_MAPPING' or action='AUTO_UNLOCKED_FOR_MAPPING')
                and user_id = :user_id;"""
        total_mapping_time = db.engine.execute(text(sql), user_id=user.id)
        for time in total_mapping_time:
            total_mapping_time = time[0]
            if total_mapping_time:
                stats_dto.time_spent_mapping = total_mapping_time.total_seconds()
                stats_dto.total_time_spent += stats_dto.time_spent_mapping

        stats_dto.contributions_interest = UserService.get_interests_stats(user.id)

        return stats_dto

    @staticmethod
    def update_user_details(user_id: int, user_dto: UserDTO) -> dict:
        """ Update user with info supplied by user, if they add or change their email address a verification mail
            will be sent """
        user = UserService.get_user_by_id(user_id)

        verification_email_sent = False
        if (
            user_dto.email_address
            and user.email_address != user_dto.email_address.lower()
        ):
            # Send user verification email if they are adding or changing their email address
            SMTPService.send_verification_email(
                user_dto.email_address.lower(), user.username
            )
            user.set_email_verified_status(is_verified=False)
            verification_email_sent = True

        user.update(user_dto)
        user_email = UserEmail.query.filter(
            UserEmail.email == user_dto.email_address
        ).one_or_none()
        if user_email is not None:
            user_email.delete()

        return dict(verificationEmailSent=verification_email_sent)

    @staticmethod
    @cached(user_all_cache)
    def get_all_users(query: UserSearchQuery) -> UserSearchDTO:
        """ Gets paginated list of users """
        return User.get_all_users(query)

    @staticmethod
    @cached(user_filter_cache)
    def filter_users(
        username: str, project_id: int, page: int, is_project_manager: bool = False
    ) -> UserFilterDTO:
        """ Gets paginated list of users, filtered by username, for autocomplete """
        return User.filter_users(username, project_id, page, is_project_manager)

    @staticmethod
    def is_user_a_project_manager(user_id: int) -> bool:
        """ Is the user a project manager """
        user = UserService.get_user_by_id(user_id)
        if UserRole(user.role) in [UserRole.ADMIN, UserRole.PROJECT_MANAGER]:
            return True

        return False

    @staticmethod
    def is_user_an_admin(user_id: int) -> bool:
        """ Is the user an admin """
        user = UserService.get_user_by_id(user_id)
        if UserRole(user.role) == UserRole.ADMIN:
            return True

        return False

    @staticmethod
    def is_user_the_project_author(user_id: int, author_id: int) -> bool:
        """ Is user the author of the project """
        return user_id == author_id

    @staticmethod
    def get_mapping_level(user_id: int):
        """ Gets mapping level user is at"""
        user = UserService.get_user_by_id(user_id)

        return MappingLevel(user.mapping_level)

    @staticmethod
    def is_user_validator(user_id: int) -> bool:
        """ Determines if user is a validator """
        user = UserService.get_user_by_id(user_id)

        if UserRole(user.role) in [
            UserRole.VALIDATOR,
            UserRole.ADMIN,
            UserRole.PROJECT_MANAGER,
        ]:
            return True

        return False

    @staticmethod
    def is_user_blocked(user_id: int) -> bool:
        """ Determines if a user is blocked """
        user = UserService.get_user_by_id(user_id)

        if UserRole(user.role) == UserRole.READ_ONLY:
            return True

        return False

    @staticmethod
    def get_countries_contributed(user_id: int):
        query = (
            TaskHistory.query.with_entities(
                func.unnest(Project.country).label("country"),
                TaskHistory.action_text,
                func.count(TaskHistory.action_text).label("count"),
            )
            .filter(TaskHistory.user_id == user_id)
            .filter(
                TaskHistory.action_text.in_(
                    [
                        TaskStatus.MAPPED.name,
                        TaskStatus.BADIMAGERY.name,
                        TaskStatus.VALIDATED.name,
                    ]
                )
            )
            .group_by("country", TaskHistory.action_text)
            .outerjoin(Project, Project.id == TaskHistory.project_id)
            .all()
        )
        countries = list(set([q.country for q in query]))
        result = []
        for country in countries:
            values = [q for q in query if q.country == country]

            # Filter element to sum mapped values.
            mapped = sum(
                [
                    v.count
                    for v in values
                    if v.action_text
                    in [TaskStatus.MAPPED.name, TaskStatus.BADIMAGERY.name]
                ]
            )
            validated = sum(
                [v.count for v in values if v.action_text == TaskStatus.VALIDATED.name]
            )
            dto = UserCountryContributed(
                dict(
                    name=country,
                    mapped=mapped,
                    validated=validated,
                    total=mapped + validated,
                )
            )
            result.append(dto)

        # Order by total
        result = sorted(result, reverse=True, key=lambda i: i.total)
        countries_dto = UserCountriesContributed()
        countries_dto.countries_contributed = result
        countries_dto.total = len(result)

        return countries_dto

    @staticmethod
    def upsert_mapped_projects(user_id: int, project_id: int):
        """ Add project to mapped projects if it doesn't exist, otherwise return """
        User.upsert_mapped_projects(user_id, project_id)

    @staticmethod
    def get_mapped_projects(user_name: str, preferred_locale: str):
        """ Gets all projects a user has mapped or validated on """
        user = UserService.get_user_by_username(user_name)
        return User.get_mapped_projects(user.id, preferred_locale)

    @staticmethod
    def get_recommended_projects(user_name: str, preferred_locale: str):
        """ Gets all projects a user has mapped or validated on """
        from server.services.project_search_service import ProjectSearchService

        limit = 20
        user = (
            User.query.with_entities(User.id, User.mapping_level)
            .filter(User.username == user_name)
            .one_or_none()
        )
        if user is None:
            raise NotFound()

        # Get all projects that the user has contributed
        sq = (
            TaskHistory.query.with_entities(TaskHistory.project_id.label("project_id"))
            .distinct(TaskHistory.project_id)
            .filter(TaskHistory.user_id == user.id)
            .subquery()
        )
        # Get all campaigns for all contributed projects.
        campaign_tags = (
            Project.query.with_entities(Project.campaign.label("tag"))
            .filter(or_(Project.author_id == user.id, Project.id == sq.c.project_id))
            .subquery()
        )
        # Get projects with given campaign tags but without user contributions.
        query = ProjectSearchService.create_search_query()
        projs = (
            query.filter(Project.campaign.any(campaign_tags.c.tag)).limit(limit).all()
        )

        # Get only user mapping level projects.
        len_projs = len(projs)
        if len_projs < limit:
            remaining_projs = (
                query.filter(Project.mapper_level == user.mapping_level)
                .limit(limit - len_projs)
                .all()
            )
            projs.extend(remaining_projs)

        dto = ProjectSearchResultsDTO()

        # Get all total contributions for each paginated project.
        contrib_counts = ProjectSearchService.get_total_contributions(projs)

        zip_items = zip(projs, contrib_counts)

        dto.results = [
            ProjectSearchService.create_result_dto(p, "en", t) for p, t in zip_items
        ]

        return dto

    @staticmethod
    def add_role_to_user(admin_user_id: int, username: str, role: str):
        """
        Add role to user
        :param admin_user_id: ID of admin attempting to add the role
        :param username: Username of user the role should be added to
        :param role: The requested role
        :raises UserServiceError
        """
        try:
            requested_role = UserRole[role.upper()]
        except KeyError:
            raise UserServiceError(
                f"Unknown role {role} accepted values are ADMIN, PROJECT_MANAGER, VALIDATOR"
            )

        admin = UserService.get_user_by_id(admin_user_id)
        admin_role = UserRole(admin.role)

        if admin_role == UserRole.PROJECT_MANAGER and requested_role == UserRole.ADMIN:
            raise UserServiceError(f"You must be an Admin to assign Admin role")

        if (
            admin_role == UserRole.PROJECT_MANAGER
            and requested_role == UserRole.PROJECT_MANAGER
        ):
            raise UserServiceError(
                f"You must be an Admin to assign Project Manager role"
            )

        user = UserService.get_user_by_username(username)
        user.set_user_role(requested_role)

    @staticmethod
    def set_user_mapping_level(username: str, level: str) -> User:
        """
        Sets the users mapping level
        :raises: UserServiceError
        """
        try:
            requested_level = MappingLevel[level.upper()]
        except KeyError:
            raise UserServiceError(
                f"Unknown role {level} accepted values are BEGINNER, INTERMEDIATE, ADVANCED"
            )

        user = UserService.get_user_by_username(username)
        user.set_mapping_level(requested_level)

        return user

    @staticmethod
    def set_user_is_expert(user_id: int, is_expert: bool) -> User:
        """
        Enabled or disables expert mode for the user
        :raises: UserServiceError
        """
        user = UserService.get_user_by_id(user_id)
        user.set_is_expert(is_expert)

        return user

    @staticmethod
    def accept_license_terms(user_id: int, license_id: int):
        """ Saves the fact user has accepted license terms """
        user = UserService.get_user_by_id(user_id)
        user.accept_license_terms(license_id)

    @staticmethod
    def has_user_accepted_license(user_id: int, license_id: int):
        """ Checks if user has accepted specified license """
        user = UserService.get_user_by_id(user_id)
        return user.has_user_accepted_licence(license_id)

    @staticmethod
    def get_osm_details_for_user(username: str) -> UserOSMDTO:
        """
        Gets OSM details for the user from OSM API
        :param username: username in scope
        :raises UserServiceError, NotFound
        """
        user = UserService.get_user_by_username(username)
        osm_dto = OSMService.get_osm_details_for_user(user.id)
        return osm_dto

    @staticmethod
    def check_and_update_mapper_level(user_id: int):
        """ Check users mapping level and update if they have crossed threshold """
        user = UserService.get_user_by_id(user_id)
        user_level = MappingLevel(user.mapping_level)

        if user_level == MappingLevel.ADVANCED:
            return  # User has achieved highest level, so no need to do further checking

        intermediate_level = current_app.config["MAPPER_LEVEL_INTERMEDIATE"]
        advanced_level = current_app.config["MAPPER_LEVEL_ADVANCED"]

        try:
            osm_details = OSMService.get_osm_details_for_user(user_id)
            if (
                osm_details.changeset_count > advanced_level
                and user.mapping_level != MappingLevel.ADVANCED.value
            ):
                user.mapping_level = MappingLevel.ADVANCED.value
                UserService.notify_level_upgrade(user_id, user.username, "ADVANCED")
            elif (
                intermediate_level < osm_details.changeset_count < advanced_level
                and user.mapping_level != MappingLevel.INTERMEDIATE.value
            ):
                user.mapping_level = MappingLevel.INTERMEDIATE.value
                UserService.notify_level_upgrade(user_id, user.username, "INTERMEDIATE")
        except OSMServiceError:
            # Swallow exception as we don't want to blow up the server for this
            current_app.logger.error("Error attempting to update mapper level")
            return

        user.save()
        return user

    @staticmethod
    def notify_level_upgrade(user_id: int, username: str, level: str):
        text_template = get_template("level_upgrade_message_en.txt")

        if username is not None:
            text_template = text_template.replace("[USERNAME]", username)

        text_template = text_template.replace("[LEVEL]", level)
        level_upgrade_message = Message()
        level_upgrade_message.to_user_id = user_id
        level_upgrade_message.subject = "Mapper Level Upgrade "
        level_upgrade_message.message = text_template
        level_upgrade_message.save()

    @staticmethod
    def refresh_mapper_level() -> int:
        """ Helper function to run thru all users in the DB and update their mapper level """
        users = User.get_all_users_not_pagainated()
        users_updated = 1
        total_users = len(users)

        for user in users:
            UserService.check_and_update_mapper_level(user.id)

            if users_updated % 50 == 0:
                print(f"{users_updated} users updated of {total_users}")

            users_updated += 1

        return users_updated

    @staticmethod
    def register_user_with_email(user: UserRegisterEmailDTO):
        new_user = UserEmail(email=user.email)
        new_user.create()

        return new_user

    @staticmethod
    def get_interests(user: User) -> InterestsDTO:
        dto = InterestsDTO()
        dto.interests = []
        for interest in Interest.query.all():
            int_dto = interest.as_dto()
            if interest in user.interests:
                int_dto.user_selected = True
            dto.interests.append(int_dto)

        return dto
