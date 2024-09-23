from cachetools import TTLCache, cached

import datetime
from loguru import logger
from sqlalchemy.sql.expression import literal
from sqlalchemy import (
    func,
    or_,
    desc,
    and_,
    distinct,
    cast,
    Time,
    column,
    select,
    union,
    alias,
)
from databases import Database

from backend.exceptions import NotFound
from backend.models.dtos.project_dto import ProjectFavoritesDTO, ProjectSearchResultsDTO
from backend.models.dtos.user_dto import (
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
from backend.models.dtos.interests_dto import (
    InterestsListDTO,
    InterestDTO,
    ListInterestDTO,
)
from backend.models.postgis.interests import Interest, project_interests
from backend.models.postgis.message import MessageType
from backend.models.postgis.project import Project
from backend.models.postgis.user import User, UserRole, MappingLevel, UserEmail
from backend.models.postgis.task import TaskHistory, TaskAction, Task
from backend.models.postgis.utils import timestamp
from backend.models.postgis.statuses import TaskStatus, ProjectStatus
from backend.models.dtos.user_dto import UserTaskDTOs
from backend.models.dtos.stats_dto import Pagination
from backend.services.users.osm_service import OSMService, OSMServiceError
from backend.services.messaging.smtp_service import SMTPService
from backend.services.messaging.template_service import (
    get_txt_template,
    template_var_replacing,
)
from backend.db import get_session
from backend.config import Settings

settings = Settings()
session = get_session()
from databases import Database

user_filter_cache = TTLCache(maxsize=1024, ttl=600)


class UserServiceError(Exception):
    """Custom Exception to notify callers an error occurred when in the User Service"""

    def __init__(self, message):
        logger.debug(message)


class UserService:
    @staticmethod
    async def get_user_by_id(user_id: int, db: Database) -> User:
        user = await User.get_by_id(user_id, db)
        if user is None:
            raise NotFound(sub_code="USER_NOT_FOUND", user_id=user_id)
        return user

    @staticmethod
    async def get_user_by_username(username: str, db) -> User:
        user = await User.get_by_username(username, db)

        if user is None:
            raise NotFound(sub_code="USER_NOT_FOUND", username=username)

        return user

    @staticmethod
    def get_contributions_by_day(user_id: int):
        # Validate that user exists.
        stats = (
            session.query(TaskHistory)
            .with_entities(
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
        users = session.query(User).filter(User.role == 2).all()

        if users is None:
            raise NotFound(sub_code="USER_NOT_FOUND")

        return users

    @staticmethod
    def get_general_admins() -> User:
        users = session.query(User).filter(User.role == 1).all()

        if users is None:
            raise NotFound(sub_code="USER_NOT_FOUND")

        return users

    @staticmethod
    async def update_user(
        user_id: int, osm_username: str, picture_url: str, session
    ) -> User:
        user = await UserService.get_user_by_id(user_id)
        if user.username != osm_username:
            user.update_username(osm_username)

        if user.picture_url != picture_url:
            user.update_picture_url(picture_url)

        return user

    @staticmethod
    async def get_projects_favorited(user_id: int, db: Database) -> ProjectFavoritesDTO:
        # Query to get the project IDs favorited by the user
        project_ids_query = """
        SELECT project_id
        FROM project_favorites
        WHERE user_id = :user_id
        """
        project_ids_rows = await db.fetch_all(project_ids_query, {"user_id": user_id})
        if not project_ids_rows:
            return ProjectFavoritesDTO(favorited_projects=[])

        projects_dto = [
            await Project.as_dto_for_admin(row["project_id"], db)
            for row in project_ids_rows
        ]

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

        intermediate_level = settings.MAPPER_LEVEL_INTERMEDIATE
        advanced_level = settings.MAPPER_LEVEL_ADVANCED

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
    async def get_user_dto_by_username(
        requested_username: str, logged_in_user_id: int, db: Database
    ) -> UserDTO:
        """Gets user DTO for supplied username"""
        query = """
        SELECT * FROM users
        WHERE username = :username
        """
        result = await db.fetch_one(query, values={"username": requested_username})
        if result is None:
            raise NotFound(sub_code="USER_NOT_FOUND", username=requested_username)

        requested_user = User(**result)
        logged_in_user = await UserService.get_user_by_id(logged_in_user_id, db)
        await UserService.check_and_update_mapper_level(requested_user.id, db)
        return requested_user.as_dto(logged_in_user.username)

    @staticmethod
    async def get_user_dto_by_id(
        user_id: int, request_user: int, db: Database
    ) -> UserDTO:
        """Gets user DTO for supplied user id"""
        user = await UserService.get_user_by_id(user_id, db)
        if request_user:
            request_user = await UserService.get_user_by_id(request_user, db)
            return user.as_dto(request_user.username)
        return user.as_dto()

    @staticmethod
    def get_interests_stats(user_id):
        # Get all projects that the user has contributed.
        stmt = (
            session.query(TaskHistory)
            .with_entities(TaskHistory.project_id)
            .distinct()
            .filter(TaskHistory.user_id == user_id)
        )

        interests = (
            Interest.query.with_entities(
                Interest.id,
                Interest.name,
                func.count(distinct(project_interests.c.project_id)).label(
                    "count_projects"
                ),
            )
            .join(
                project_interests,
                and_(
                    Interest.id == project_interests.c.interest_id,
                    project_interests.c.project_id.in_(stmt),
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
    async def get_tasks_dto(
        user_id: int,
        start_date: datetime.datetime = None,
        end_date: datetime.datetime = None,
        task_status: str = None,
        project_status: str = None,
        project_id: int = None,
        page=1,
        page_size=10,
        sort_by: str = None,
        db: Database = None,
    ) -> UserTaskDTOs:
        base_query = (
            session.query(TaskHistory)
            .with_entities(
                TaskHistory.project_id.label("project_id"),
                TaskHistory.task_id.label("task_id"),
                func.max(TaskHistory.action_date).label("max"),
            )
            .filter(TaskHistory.user_id == user_id)
            .group_by(TaskHistory.task_id, TaskHistory.project_id)
        )

        if task_status:
            base_query = base_query.filter(
                TaskHistory.action_text == TaskStatus[task_status.upper()].name
            )

        if start_date:
            base_query = base_query.filter(TaskHistory.action_date >= start_date)

        if end_date:
            base_query = base_query.filter(TaskHistory.action_date <= end_date)

        user_task_dtos = UserTaskDTOs()
        task_id_list = base_query.subquery()

        comments_query = (
            session.query(TaskHistory)
            .with_entities(
                TaskHistory.project_id,
                TaskHistory.task_id,
                func.count(TaskHistory.action).label("count"),
            )
            .filter(TaskHistory.action == "COMMENT")
            .group_by(TaskHistory.task_id, TaskHistory.project_id)
        ).subquery()

        sq = (
            session.query(
                func.coalesce(comments_query.c.count, 0).label("comments"), task_id_list
            )
            .select_from(task_id_list)
            .outerjoin(
                comments_query,
                (comments_query.c.task_id == task_id_list.c.task_id)
                & (comments_query.c.project_id == task_id_list.c.project_id),
            )
            .subquery()
        )

        tasks = Task.query.join(
            sq,
            and_(
                Task.id == sq.c.task_id,
                Task.project_id == sq.c.project_id,
            ),
        )
        tasks = tasks.add_columns(column("max"), column("comments"))

        if sort_by == "action_date":
            tasks = tasks.order_by(sq.c.max)
        elif sort_by == "-action_date":
            tasks = tasks.order_by(desc(sq.c.max))
        elif sort_by == "project_id":
            tasks = tasks.order_by(sq.c.project_id)
        elif sort_by == "-project_id":
            tasks = tasks.order_by(desc(sq.c.project_id))

        if project_status:
            tasks = tasks.filter(
                Task.project_id == Project.id,
                Project.status == ProjectStatus[project_status.upper()].value,
            )

        if project_id:
            tasks = tasks.filter_by(project_id=project_id)

        results = tasks.paginate(page=page, per_page=page_size, error_out=True)

        task_list = []

        for task, action_date, comments in results.items:
            task_list.append(task.as_dto(last_updated=action_date, comments=comments))

        user_task_dtos.user_tasks = task_list
        user_task_dtos.pagination = Pagination(results)
        return user_task_dtos

    @staticmethod
    async def get_detailed_stats(username: str, db: Database) -> UserStatsDTO:
        user = await UserService.get_user_by_username(username, db)
        stats_dto = UserStatsDTO()

        actions = [
            TaskStatus.VALIDATED.name,
            TaskStatus.INVALIDATED.name,
            TaskStatus.MAPPED.name,
        ]

        actions_table = union(
            select(literal("VALIDATED").label("action_text")),
            select(literal("INVALIDATED").label("action_text")),
            select(literal("MAPPED").label("action_text")),
        ).alias("actions_table")

        # Get only rows with the given actions.
        # filtered_actions = (
        #     session.query(TaskHistory)
        #     .with_entities(
        #         TaskHistory.user_id,
        #         TaskHistory.project_id,
        #         TaskHistory.task_id,
        #         TaskHistory.action_text,
        #     )
        #     .filter(TaskHistory.action_text.in_(actions))
        #     .subquery()
        #     .alias("filtered_actions")
        # )
        filtered_actions = (
            select(
                TaskHistory.user_id,
                TaskHistory.project_id,
                TaskHistory.task_id,
                TaskHistory.action_text,
            )
            .where(TaskHistory.action_text.in_(["VALIDATED", "INVALIDATED", "MAPPED"]))
            .alias("filtered_actions")
        )

        # user_tasks = (
        #     session.query(filtered_actions)
        #     .filter(filtered_actions.c.user_id == user.id)
        #     .distinct(
        #         filtered_actions.c.project_id,
        #         filtered_actions.c.task_id,
        #         filtered_actions.c.action_text,
        #     )
        #     .subquery()
        #     .alias("user_tasks")
        # )
        user_tasks = (
            select(
                [
                    filtered_actions.c.user_id,
                    filtered_actions.c.project_id,
                    filtered_actions.c.task_id,
                    filtered_actions.c.action_text,
                ]
            )
            .where(filtered_actions.c.user_id == user.id)
            .distinct()
            .alias("user_tasks")
        )

        # others_tasks = (
        #     session.query(filtered_actions)
        #     .filter(filtered_actions.c.user_id != user.id)
        #     .filter(filtered_actions.c.task_id == user_tasks.c.task_id)
        #     .filter(filtered_actions.c.project_id == user_tasks.c.project_id)
        #     .filter(filtered_actions.c.action_text != TaskStatus.MAPPED.name)
        #     .distinct(
        #         filtered_actions.c.project_id,
        #         filtered_actions.c.task_id,
        #         filtered_actions.c.action_text,
        #     )
        #     .subquery()
        #     .alias("others_tasks")
        # )
        others_tasks = (
            select(
                [
                    filtered_actions.c.user_id,
                    filtered_actions.c.project_id,
                    filtered_actions.c.task_id,
                    filtered_actions.c.action_text,
                ]
            )
            .where(filtered_actions.c.user_id != user.id)
            .where(filtered_actions.c.task_id == user_tasks.c.task_id)
            .where(filtered_actions.c.project_id == user_tasks.c.project_id)
            .where(filtered_actions.c.action_text != "MAPPED")
            .distinct()
            .alias("others_tasks")
        )

        # user_stats = (
        #     session.query(
        #         actions_table.c.action_text, func.count(user_tasks.c.action_text)
        #     )
        #     .outerjoin(
        #         user_tasks, actions_table.c.action_text == user_tasks.c.action_text
        #     )
        #     .group_by(actions_table.c.action_text)
        # )
        user_stats = (
            select([actions_table.c.action_text, func.count(user_tasks.c.action_text)])
            .select_from(
                actions_table.outerjoin(
                    user_tasks, actions_table.c.action_text == user_tasks.c.action_text
                )
            )
            .group_by(actions_table.c.action_text)
        )

        # others_stats = (
        #     session.query(
        #         func.concat(actions_table.c.action_text, "_BY_OTHERS"),
        #         func.count(others_tasks.c.action_text),
        #     )
        #     .outerjoin(
        #         others_tasks, actions_table.c.action_text == others_tasks.c.action_text
        #     )
        #     .group_by(actions_table.c.action_text)
        # )
        others_stats = (
            select(
                [
                    func.concat(actions_table.c.action_text, "_BY_OTHERS"),
                    func.count(others_tasks.c.action_text),
                ]
            )
            .select_from(
                actions_table.outerjoin(
                    others_tasks,
                    actions_table.c.action_text == others_tasks.c.action_text,
                )
            )
            .group_by(actions_table.c.action_text)
        )
        combined_stats = user_stats.union_all(others_stats)

        res = await db.fetch_all(combined_stats)
        print(res)
        # res = user_stats.union(others_stats).all()
        results = {key: value for key, value in res}

        projects_mapped = UserService.get_projects_mapped(user.id)
        stats_dto.tasks_mapped = results["MAPPED"]
        stats_dto.tasks_validated = results["VALIDATED"]
        stats_dto.tasks_invalidated = results["INVALIDATED"]
        stats_dto.tasks_validated_by_others = results["VALIDATED_BY_OTHERS"]
        stats_dto.tasks_invalidated_by_others = results["INVALIDATED_BY_OTHERS"]
        stats_dto.projects_mapped = len(projects_mapped)
        stats_dto.countries_contributed = UserService.get_countries_contributed(user.id)
        stats_dto.contributions_by_day = UserService.get_contributions_by_day(user.id)
        stats_dto.total_time_spent = 0
        stats_dto.time_spent_mapping = 0
        stats_dto.time_spent_validating = 0

        query = (
            session.query(TaskHistory)
            .with_entities(
                func.date_trunc("minute", TaskHistory.action_date).label("trn"),
                func.max(TaskHistory.action_text).label("tm"),
            )
            .filter(TaskHistory.user_id == user.id)
            .filter(TaskHistory.action == "LOCKED_FOR_VALIDATION")
            .group_by("trn")
            .subquery()
        )
        total_validation_time = session.query(
            func.sum(cast(func.to_timestamp(query.c.tm, "HH24:MI:SS"), Time))
        ).scalar()

        if total_validation_time:
            stats_dto.time_spent_validating = total_validation_time.total_seconds()
            stats_dto.total_time_spent += stats_dto.time_spent_validating

        total_mapping_time = (
            session.query(
                func.sum(
                    cast(func.to_timestamp(TaskHistory.action_text, "HH24:MI:SS"), Time)
                )
            )
            .filter(
                or_(
                    TaskHistory.action == TaskAction.LOCKED_FOR_MAPPING.name,
                    TaskHistory.action == TaskAction.AUTO_UNLOCKED_FOR_MAPPING.name,
                )
            )
            .filter(TaskHistory.user_id == user.id)
            .scalar()
        )

        if total_mapping_time:
            stats_dto.time_spent_mapping = total_mapping_time.total_seconds()
            stats_dto.total_time_spent += stats_dto.time_spent_mapping

        stats_dto.contributions_interest = UserService.get_interests_stats(user.id)

        return stats_dto

    @staticmethod
    async def update_user_details(
        user_id: int, user_dto: UserDTO, db: Database
    ) -> dict:
        """Update user with info supplied by user, if they add or change their email address a verification mail
        will be sent"""
        user = await UserService.get_user_by_id(user_id, db)

        verification_email_sent = False
        if (
            user_dto.email_address
            and user.email_address != user_dto.email_address.lower()
        ):
            # Send user verification email if they are adding or changing their email address
            SMTPService.send_verification_email(
                user_dto.email_address.lower(), user.username
            )
            await User.set_email_verified_status(user, is_verified=False, db=db)
            verification_email_sent = True

        User.update(user, user_dto, db)
        query = select(UserEmail).filter(UserEmail.email == user_dto.email_address)
        user_email = await db.fetch_one(query=query)
        if user_email is not None:
            UserEmail.delete(user)

        return dict(verificationEmailSent=verification_email_sent)

    @staticmethod
    async def get_all_users(query: UserSearchQuery, db: Database) -> UserSearchDTO:
        """Gets paginated list of users"""
        return await User.get_all_users(query, db)

    @staticmethod
    @cached(user_filter_cache)
    async def filter_users(
        username: str, project_id: int, page: int, db: Database
    ) -> UserFilterDTO:
        """Gets paginated list of users, filtered by username, for autocomplete"""
        return await User.filter_users(username, project_id, page, db)

    @staticmethod
    async def is_user_an_admin(user_id: int, db: Database) -> bool:
        """Is the user an admin"""
        user = await UserService.get_user_by_id(user_id, db)
        if UserRole(user.role) == UserRole.ADMIN:
            return True

        return False

    @staticmethod
    def is_user_the_project_author(user_id: int, author_id: int) -> bool:
        """Is user the author of the project"""
        return user_id == author_id

    @staticmethod
    async def get_mapping_level(user_id: int, db: Database):
        """Gets mapping level user is at"""
        user = await UserService.get_user_by_id(user_id, db)
        return MappingLevel(user.mapping_level)

    @staticmethod
    def is_user_validator(user_id: int) -> bool:
        """Determines if user is a validator"""
        user = UserService.get_user_by_id(user_id)

        if UserRole(user.role) in [
            UserRole.ADMIN,
        ]:
            return True

        return False

    @staticmethod
    async def is_user_blocked(user_id: int, db: Database) -> bool:
        """Determines if a user is blocked"""
        user = await UserService.get_user_by_id(user_id, db)
        if UserRole(user.role) == UserRole.READ_ONLY:
            return True

        return False

    @staticmethod
    def get_countries_contributed(user_id: int):
        query = (
            session.query(TaskHistory)
            .with_entities(
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
        """Add project to mapped projects if it doesn't exist, otherwise return"""
        User.upsert_mapped_projects(user_id, project_id)

    @staticmethod
    async def get_mapped_projects(user_name: str, preferred_locale: str, db: Database):
        """Gets all projects a user has mapped or validated on"""
        user = await UserService.get_user_by_username(user_name, db)
        return await User.get_mapped_projects(user.id, preferred_locale, db)

    @staticmethod
    async def get_recommended_projects(
        user_name: str, preferred_locale: str, db: Database
    ):
        """Gets all projects a user has mapped or validated on"""
        from backend.services.project_search_service import ProjectSearchService

        limit = 20
        user = (
            session.query(User)
            .with_entities(User.id, User.mapping_level)
            .filter(User.username == user_name)
            .one_or_none()
        )
        if user is None:
            raise NotFound(sub_code="USER_NOT_FOUND", username=user_name)

        # Get all projects that the user has contributed
        sq = (
            session.query(TaskHistory)
            .with_entities(TaskHistory.project_id.label("project_id"))
            .distinct(TaskHistory.project_id)
            .filter(TaskHistory.user_id == user.id)
            .subquery()
        )
        # Get all campaigns for all contributed projects.
        campaign_tags = (
            session.query(Project)
            .with_entities(Project.campaign.label("tag"))
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
                query.filter(Project.difficulty == user.mapping_level)
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
                "UnknownAddRole- "
                + f"Unknown role {role} accepted values are ADMIN, PROJECT_MANAGER, VALIDATOR"
            )

        admin = UserService.get_user_by_id(admin_user_id)
        admin_role = UserRole(admin.role)

        if admin_role != UserRole.ADMIN and requested_role == UserRole.ADMIN:
            raise UserServiceError(
                "NeedAdminRole- You must be an Admin to assign Admin role"
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
                "UnknownUserRole- "
                + f"Unknown role {level} accepted values are BEGINNER, INTERMEDIATE, ADVANCED"
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
    async def accept_license_terms(user_id: int, license_id: int, db: Database):
        """Saves the fact user has accepted license terms"""
        user = await UserService.get_user_by_id(user_id, db)
        await user.accept_license_terms(user_id, license_id, db)

    @staticmethod
    async def has_user_accepted_license(
        user_id: int, license_id: int, db: Database
    ) -> bool:
        """Checks if a user has accepted the specified license."""
        query = """
        SELECT EXISTS (
            SELECT 1
            FROM user_licenses
            WHERE "user" = :user_id AND license = :license_id
        )
        """
        result = await db.fetch_one(
            query, values={"user_id": user_id, "license_id": license_id}
        )
        return result[0] if result else False

    @staticmethod
    async def get_osm_details_for_user(username: str, db: Database) -> UserOSMDTO:
        """
        Gets OSM details for the user from OSM API
        :param username: username in scope
        :raises UserServiceError, NotFound
        """
        user = await UserService.get_user_by_username(username, db)
        osm_dto = OSMService.get_osm_details_for_user(user.id)
        return osm_dto

    @staticmethod
    async def check_and_update_mapper_level(user_id: int, db: Database):
        """Check user's mapping level and update if they have crossed threshold"""
        user = await UserService.get_user_by_id(user_id, db)
        user_level = MappingLevel(user.mapping_level)

        if user_level == MappingLevel.ADVANCED:
            return  # User has achieved the highest level, no need to proceed

        intermediate_level = MappingLevel.INTERMEDIATE
        advanced_level = MappingLevel.ADVANCED

        try:
            osm_details = OSMService.get_osm_details_for_user(user_id)

            if (
                osm_details.changeset_count > advanced_level.value
                and user_level != MappingLevel.ADVANCED.value
            ):
                update_query = """
                    UPDATE users
                    SET mapping_level = :new_level
                    WHERE id = :user_id
                """
                await db.execute(
                    update_query,
                    {"new_level": MappingLevel.ADVANCED.value, "user_id": user_id},
                )
                await UserService.notify_level_upgrade(
                    user_id, user.username, "ADVANCED", db
                )

            elif (
                intermediate_level.value
                < osm_details.changeset_count
                < advanced_level.value
                and user_level != MappingLevel.INTERMEDIATE.value
            ):
                await db.execute(
                    update_query,
                    {"new_level": MappingLevel.INTERMEDIATE.value, "user_id": user_id},
                )
                await UserService.notify_level_upgrade(
                    user_id, user.username, "INTERMEDIATE", db
                )

        except OSMServiceError:
            # Log the error and move on; don't block the process
            logger.error("Error attempting to update mapper level for user %s", user_id)

    @staticmethod
    async def notify_level_upgrade(
        user_id: int, username: str, level: str, db: Database
    ):
        text_template = get_txt_template("level_upgrade_message_en.txt")

        replace_list = [
            ["[USERNAME]", username],
            ["[LEVEL]", level.capitalize()],
            ["[ORG_CODE]", settings.ORG_CODE],
        ]
        text_template = template_var_replacing(text_template, replace_list)

        subject = f"Congratulations🎉, You're now an {level} mapper."
        message_type = MessageType.SYSTEM.value

        insert_query = """
            INSERT INTO messages (to_user_id, subject, message, message_type, date, read)
            VALUES (:to_user_id, :subject, :message, :message_type, :date, :read)
        """
        await db.execute(
            insert_query,
            {
                "to_user_id": user_id,
                "subject": subject,
                "message": text_template,
                "message_type": message_type,
                "date": timestamp(),
                "read": False,
            },
        )

    @staticmethod
    def refresh_mapper_level() -> int:
        """Helper function to run thru all users in the DB and update their mapper level"""
        users = User.get_all_users_not_paginated()
        users_updated = 1
        total_users = len(users)

        for user in users:
            UserService.check_and_update_mapper_level(user.id)

            if users_updated % 50 == 0:
                print(f"{users_updated} users updated of {total_users}")

            users_updated += 1

        return users_updated

    @staticmethod
    def register_user_with_email(user_dto: UserRegisterEmailDTO, db: Database):
        # Validate that user is not within the general users table.
        user_email = user_dto.email.lower()
        query = select(User).filter(func.lower(User.email_address) == user_email)
        user = db.fetch_one(query)
        if user is not None:
            details_msg = f"Email address {user_email} already exists"
            raise ValueError(details_msg)

        query = select(UserEmail).filter(func.lower(UserEmail.email) == user_email)
        user = db.fetch_one(query)
        if user is None:
            user = UserEmail(email=user_email)
            user.create()

        return user

    @staticmethod
    async def get_interests(user: User, db: Database) -> InterestsListDTO:
        query = """
            SELECT * FROM interests
        """
        interests = await db.fetch_all(query)
        interest_list_dto = InterestsListDTO()

        for interest in interests:
            int_dto = ListInterestDTO(**interest)

            if interest in user.interests:
                int_dto.user_selected = True
            interest_list_dto.interests.append(int_dto)

        return interest_list_dto
