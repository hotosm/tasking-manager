from cachetools import TTLCache, cached

import datetime
from loguru import logger
from sqlalchemy.sql.expression import literal
from sqlalchemy.sql import outerjoin
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
    text,
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
    async def get_user_by_username(username: str, db: Database) -> User:
        user = await User.get_by_username(username, db)

        if user is None:
            raise NotFound(sub_code="USER_NOT_FOUND", username=username)

        return user

    @staticmethod
    async def get_contributions_by_day(user_id: int, db: Database):
        # Validate that user exists.
        query = (
            select(
                func.DATE(TaskHistory.action_date).label("day"),
                func.count(TaskHistory.action).label("cnt"),
            )
            .where(TaskHistory.user_id == user_id)
            .where(TaskHistory.action == TaskAction.STATE_CHANGE.name)
            .where(
                func.DATE(TaskHistory.action_date)
                > datetime.date.today() - datetime.timedelta(days=365)
            )
            .group_by("day")
            .order_by(desc("day"))
        )

        # Execute the query and fetch all results
        results = await db.fetch_all(query)

        # Transform the results into a list of `UserContributionDTO` instances
        contributions = [
            UserContributionDTO(date=record["day"], count=record["cnt"])
            for record in results
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
        user_id: int, osm_username: str, picture_url: str, db: Database
    ) -> User:
        user = await UserService.get_user_by_id(user_id, db)
        if user.username != osm_username:
            await user.update_username(osm_username, db)

        if user.picture_url != picture_url:
            await user.update_picture_url(picture_url, db)

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
    async def get_projects_mapped(user_id: int, db: Database):
        user = await UserService.get_user_by_id(user_id, db)
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
    async def get_interests_stats(user_id: int, db: Database):
        # Get all projects that the user has contributed.
        stmt = (
            select(TaskHistory.project_id)
            .distinct()
            .where(TaskHistory.user_id == user_id)
        )

        # Prepare the query for interests
        interests_query = (
            select(
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
        )

        # Execute the query
        interests = await db.fetch_all(interests_query)

        # Map results to DTOs
        interests_dto = [
            InterestDTO(dict(id=i[0], name=i[1], count_projects=i[2]))
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
        # Base query to get the latest task history actions for a user
        base_query = (
            select(
                TaskHistory.project_id.label("project_id"),
                TaskHistory.task_id.label("task_id"),
                func.max(TaskHistory.action_date).label("max"),
            )
            .where(TaskHistory.user_id == user_id)
            .group_by(TaskHistory.task_id, TaskHistory.project_id)
        )

        if task_status:
            base_query = base_query.where(
                TaskHistory.action_text == TaskStatus[task_status.upper()].name
            )

        if start_date:
            base_query = base_query.where(TaskHistory.action_date >= start_date)

        if end_date:
            base_query = base_query.where(TaskHistory.action_date <= end_date)

        task_id_list = base_query.alias("task_id_list")

        # Query to get the number of comments per task
        comments_query = (
            select(
                TaskHistory.project_id,
                TaskHistory.task_id,
                func.count(TaskHistory.action).label("count"),
            )
            .where(TaskHistory.action == "COMMENT")
            .group_by(TaskHistory.task_id, TaskHistory.project_id)
        ).alias("comments_query")

        # Subquery for joining comments and task IDs
        sq = (
            select(
                func.coalesce(comments_query.c.count, 0).label("comments"),
                task_id_list.c.project_id,
                task_id_list.c.task_id,
                task_id_list.c.max,
            )
            .select_from(task_id_list)
            .outerjoin(
                comments_query,
                and_(
                    comments_query.c.task_id == task_id_list.c.task_id,
                    comments_query.c.project_id == task_id_list.c.project_id,
                ),
            )
        ).alias("sq")

        # Main task query joining with subquery
        tasks_query = (
            select(Task, sq.c.max, sq.c.comments)
            .select_from(Task)
            .join(
                sq,
                and_(
                    Task.id == sq.c.task_id,
                    Task.project_id == sq.c.project_id,
                ),
            )
        )

        if sort_by == "action_date":
            tasks_query = tasks_query.order_by(sq.c.max)
        elif sort_by == "-action_date":
            tasks_query = tasks_query.order_by(desc(sq.c.max))
        elif sort_by == "project_id":
            tasks_query = tasks_query.order_by(sq.c.project_id)
        elif sort_by == "-project_id":
            tasks_query = tasks_query.order_by(desc(sq.c.project_id))

        if project_status:
            tasks_query = tasks_query.where(
                and_(
                    Task.project_id == Project.id,
                    Project.status == ProjectStatus[project_status.upper()].value,
                )
            )

        if project_id:
            tasks_query = tasks_query.where(Task.project_id == project_id)

        # Pagination
        offset = (page - 1) * page_size
        tasks_query = tasks_query.limit(page_size).offset(offset)

        # Execute the query and fetch results
        rows = await db.fetch_all(tasks_query)

        # Create list of task DTOs from the results
        task_list = [
            await Task.task_as_dto(
                row, last_updated=row["max"], comments=row["comments"], db=db
            )
            for row in rows
        ]

        user_task_dtos = UserTaskDTOs()
        user_task_dtos.user_tasks = task_list
        user_task_dtos.pagination = Pagination(
            total_items=len(task_list), page=page, page_size=page_size
        )

        return user_task_dtos

    @staticmethod
    async def get_detailed_stats(username: str, db: Database) -> UserStatsDTO:
        stats_dto = UserStatsDTO()

        # Fetch user ID based on username
        user = await UserService.get_user_by_username(username, db)

        # Define actions
        actions = [
            TaskStatus.VALIDATED.name,
            TaskStatus.INVALIDATED.name,
            TaskStatus.MAPPED.name,
        ]

        # Get filtered actions
        filtered_actions_query = select(
            TaskHistory.user_id,
            TaskHistory.project_id,
            TaskHistory.task_id,
            TaskHistory.action_text,
        ).where(TaskHistory.action_text.in_(actions))

        filtered_actions = await db.fetch_all(filtered_actions_query)

        # Get user tasks
        user_tasks_query = (
            select(TaskHistory.project_id, TaskHistory.task_id, TaskHistory.action_text)
            .where(
                TaskHistory.user_id == user["id"],
                TaskHistory.action_text.in_(
                    [row["action_text"] for row in filtered_actions]
                ),
            )
            .distinct()
        )

        user_tasks = await db.fetch_all(user_tasks_query)

        # Get others' tasks
        others_tasks_query = (
            select(TaskHistory.project_id, TaskHistory.task_id, TaskHistory.action_text)
            .where(
                TaskHistory.user_id != user["id"],
                TaskHistory.task_id.in_([row["task_id"] for row in user_tasks]),
                TaskHistory.project_id.in_([row["project_id"] for row in user_tasks]),
                TaskHistory.action_text != TaskStatus.MAPPED.name,
            )
            .distinct()
        )

        others_tasks = await db.fetch_all(others_tasks_query)

        # Combine results for user stats
        user_stats = {action: 0 for action in actions}

        for task in user_tasks:
            user_stats[task["action_text"]] += 1

        # Combine results for others stats
        others_stats = {f"{action}_BY_OTHERS": 0 for action in actions}

        for task in others_tasks:
            try:
                others_stats[task["action_text"] + "_BY_OTHERS"] += 1
            except KeyError:
                pass

        # Combine user stats and others stats
        results = {**user_stats, **others_stats}

        projects_mapped = await UserService.get_projects_mapped(user["id"], db)

        stats_dto.tasks_mapped = results.get("MAPPED", 0)
        stats_dto.tasks_validated = results.get("VALIDATED", 0)
        stats_dto.tasks_invalidated = results.get("INVALIDATED", 0)
        stats_dto.tasks_validated_by_others = results.get("VALIDATED_BY_OTHERS", 0)
        stats_dto.tasks_invalidated_by_others = results.get("INVALIDATED_BY_OTHERS", 0)
        stats_dto.projects_mapped = len(projects_mapped)
        stats_dto.countries_contributed = await UserService.get_countries_contributed(
            user["id"], db
        )
        stats_dto.contributions_by_day = await UserService.get_contributions_by_day(
            user["id"], db
        )
        stats_dto.total_time_spent = 0
        stats_dto.time_spent_mapping = 0
        stats_dto.time_spent_validating = 0

        # Total validation time
        # Subquery to get max(action_date) grouped by minute
        subquery = (
            select(
                func.date_trunc("minute", TaskHistory.action_date).label("minute"),
                func.max(TaskHistory.action_date).label("max_action_date"),
            )
            .where(
                TaskHistory.user_id == user["id"],
                TaskHistory.action == "LOCKED_FOR_VALIDATION",
            )
            .group_by("minute")
            .subquery()
        )

        # Outer query to sum up the epoch values of the max action dates
        total_validation_time_query = select(
            func.sum(func.extract("epoch", subquery.c.max_action_date))
        )

        # Execute the query and fetch the result
        total_validation_time = await db.fetch_one(total_validation_time_query)

        if total_validation_time and total_validation_time[0]:
            stats_dto.time_spent_validating = total_validation_time[0]
            stats_dto.total_time_spent += stats_dto.time_spent_validating

        # Total mapping time
        total_mapping_time_query = select(
            func.sum(
                cast(func.to_timestamp(TaskHistory.action_text, "HH24:MI:SS"), Time)
            )
        ).where(
            or_(
                TaskHistory.action == TaskAction.LOCKED_FOR_MAPPING.name,
                TaskHistory.action == TaskAction.AUTO_UNLOCKED_FOR_MAPPING.name,
            ),
            TaskHistory.user_id == user["id"],
        )

        total_mapping_time = await db.fetch_one(total_mapping_time_query)

        if total_mapping_time and total_mapping_time[0]:
            stats_dto.time_spent_mapping = total_mapping_time[0].total_seconds()
            stats_dto.total_time_spent += stats_dto.time_spent_mapping

        stats_dto.contributions_interest = await UserService.get_interests_stats(
            user["id"], db
        )

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
            await SMTPService.send_verification_email(
                user_dto.email_address.lower(), user.username
            )
            await User.set_email_verified_status(user, is_verified=False, db=db)
            verification_email_sent = True

        await User.update(user, user_dto, db)
        query = select(UserEmail).filter(UserEmail.email == user_dto.email_address)
        user_email = await db.fetch_one(query=query)
        if user_email is not None:
            await UserEmail.delete(user, db)

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
    async def get_countries_contributed(user_id: int, db: Database):
        # Define the base query
        query = (
            select(
                func.unnest(Project.country).label("country"),
                TaskHistory.action_text,
                func.count(TaskHistory.action_text).label("count"),
            )
            .select_from(
                outerjoin(TaskHistory, Project, TaskHistory.project_id == Project.id)
            )  # Use `outerjoin` function to join TaskHistory with Project
            .where(TaskHistory.user_id == user_id)
            .where(
                TaskHistory.action_text.in_(
                    [
                        TaskStatus.MAPPED.name,
                        TaskStatus.BADIMAGERY.name,
                        TaskStatus.VALIDATED.name,
                    ]
                )
            )
            .group_by("country", TaskHistory.action_text)
        )

        results = await db.fetch_all(query)
        countries = list(set([q.country for q in results if q.country]))
        result = []
        for country in countries:
            values = [q for q in results if q.country == country]

            # Filter element to sum mapped values.
            mapped = sum(
                [
                    v["count"]
                    for v in values
                    if v.action_text
                    in [TaskStatus.MAPPED.name, TaskStatus.BADIMAGERY.name]
                ]
            )
            validated = sum(
                [
                    v["count"]
                    for v in values
                    if v.action_text == TaskStatus.VALIDATED.name
                ]
            )
            dto = UserCountryContributed(
                **dict(
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
    async def upsert_mapped_projects(user_id: int, project_id: int, db: Database):
        """Add project to mapped projects if it doesn't exist, otherwise return"""
        await User.upsert_mapped_projects(user_id, project_id, db)

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
        # 1. Retrieve the user information
        query = select(User.id, User.mapping_level).where(User.username == user_name)
        user = await db.fetch_one(query)
        if user is None:
            raise NotFound(sub_code="USER_NOT_FOUND", username=user_name)

        user_id = user["id"]
        user_mapping_level = user["mapping_level"]

        # 2. Get all project IDs the user has contributed to
        sq = (
            select(distinct(TaskHistory.project_id))
            .where(TaskHistory.user_id == user_id)
            .alias("contributed_projects")
        )

        # 3. Get all campaigns for the contributed projects or authored by the user
        campaign_tags_query = select(distinct(Project.campaign).label("tag")).where(
            or_(Project.author_id == user_id, Project.id.in_(sq))
        )
        campaign_tags = await db.fetch_all(campaign_tags_query)
        campaign_tags_list = [tag["tag"] for tag in campaign_tags]

        # 4. Get projects that match these campaign tags but exclude those already contributed
        query, params = await ProjectSearchService.create_search_query(db)

        # Prepare the campaign tags condition
        if campaign_tags_list:
            campaign_tags_placeholder = ", ".join(
                [f":tag{i}" for i in range(len(campaign_tags_list))]
            )
            campaign_tags_condition = (
                f" AND p.campaign IN ({campaign_tags_placeholder})"
            )
        else:
            campaign_tags_condition = ""  # No condition if list is empty

        # Modify the query to include the campaign tags condition and limit
        final_query = f"{query} {campaign_tags_condition} LIMIT :limit"

        campagin_params = params.copy()
        # Update params to include campaign tags
        for i, tag in enumerate(campaign_tags_list):
            campagin_params[f"tag{i}"] = tag
        campagin_params["limit"] = limit

        # Execute the final query with parameters
        projs = await db.fetch_all(final_query, campagin_params)
        project_ids = [proj["id"] for proj in projs]

        # 5. Get projects filtered by user's mapping level if fewer than the limit
        if len(projs) < limit:
            remaining_projs_query = f"""
                {query} 
                AND p.difficulty = :difficulty
                LIMIT :remaining_limit
            """

            params["difficulty"] = user_mapping_level
            params["remaining_limit"] = limit - len(projs)
            remaining_projs = await db.fetch_all(remaining_projs_query, params)
            remaining_projs_ids = [proj["id"] for proj in remaining_projs]
            project_ids.extend(remaining_projs_ids)
            projs.extend(remaining_projs)

        # 6. Create DTO for the results
        dto = ProjectSearchResultsDTO()

        # Get all total contributions for each project
        contrib_counts = await ProjectSearchService.get_total_contributions(
            project_ids, db
        )

        # Combine projects and their contribution counts
        zip_items = zip(projs, contrib_counts)
        dto.results = [
            await ProjectSearchService.create_result_dto(p, preferred_locale, t, db)
            for p, t in zip_items
        ]

        return dto

    @staticmethod
    async def add_role_to_user(
        admin_user_id: int, username: str, role: str, db: Database
    ):
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

        admin = await UserService.get_user_by_id(admin_user_id, db)
        admin_role = UserRole(admin.role)

        if admin_role != UserRole.ADMIN and requested_role == UserRole.ADMIN:
            raise UserServiceError(
                "NeedAdminRole- You must be an Admin to assign Admin role"
            )

        user = await UserService.get_user_by_username(username, db)
        await User.set_user_role(user, requested_role, db)

    @staticmethod
    async def set_user_mapping_level(username: str, level: str, db: Database) -> User:
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

        user = await UserService.get_user_by_username(username, db)
        await User.set_mapping_level(user, requested_level, db)

        return user

    @staticmethod
    async def set_user_is_expert(user_id: int, is_expert: bool, db: Database) -> User:
        """
        Enabled or disables expert mode for the user
        :raises: UserServiceError
        """
        user = await UserService.get_user_by_id(user_id, db)
        await User.set_is_expert(user, is_expert, db)

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
    async def register_user_with_email(user_dto: UserRegisterEmailDTO, db: Database):
        # Validate that user is not within the general users table.
        user_email = user_dto.email.lower()
        query = select(User).filter(func.lower(User.email_address) == user_email)
        user = await db.fetch_one(query)
        if user is not None:
            details_msg = f"Email address {user_email} already exists"
            raise ValueError(details_msg)

        query = select(UserEmail).filter(func.lower(UserEmail.email) == user_email)
        user = await db.fetch_one(query)
        if user is None:
            user = UserEmail(email=user_email)
            user = await user.create(db)

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
