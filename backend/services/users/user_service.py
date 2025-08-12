import json
import datetime

from databases import Database
from loguru import logger
from sqlalchemy import and_, desc, distinct, func, insert, select
from httpx import AsyncClient

from backend.config import Settings
from backend.exceptions import NotFound
from backend.models.dtos.interests_dto import InterestDTO, InterestsListDTO
from backend.models.dtos.project_dto import ProjectFavoritesDTO, ProjectSearchResultsDTO
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.user_dto import (
    UserContributionDTO,
    UserCountriesContributed,
    UserCountryContributed,
    UserDTO,
    UserFilterDTO,
    UserOSMDTO,
    UserRegisterEmailDTO,
    UserSearchDTO,
    UserSearchQuery,
    UserStatsDTO,
    UserTaskDTOs,
    UserNextLevelDTO,
)
from backend.models.postgis.interests import Interest, project_interests
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.postgis.message import MessageType
from backend.models.postgis.project import Project
from backend.models.postgis.statuses import ProjectStatus, TaskStatus
from backend.models.postgis.task import Task, TaskHistory
from backend.models.postgis.user import (
    User,
    UserEmail,
    UserRole,
    UserStats,
    UserNextLevel,
    UserLevelVote,
)
from backend.models.postgis.utils import timestamp
from backend.services.messaging.smtp_service import SMTPService
from backend.services.messaging.template_service import (
    get_txt_template,
    template_var_replacing,
)
from backend.services.users.osm_service import OSMService, OSMServiceError
from backend.services.mapping_levels import MappingLevelService

settings = Settings()


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
        # Define the query using raw SQL
        query = """
            SELECT
                DATE(action_date) AS day,
                COUNT(action) AS cnt
            FROM task_history
            WHERE user_id = :user_id
            AND action = 'STATE_CHANGE'
            AND DATE(action_date) > CURRENT_DATE - INTERVAL '1 year'
            GROUP BY day
            ORDER BY day DESC;
        """
        results = await db.fetch_all(query=query, values={"user_id": user_id})

        contributions = [
            UserContributionDTO(date=record["day"], count=record["cnt"])
            for record in results
        ]

        return contributions

    @staticmethod
    async def get_project_managers(db: Database):
        query = "SELECT * FROM users WHERE role = :role"
        users = await db.fetch_all(query, values={"role": 2})

        if not users:
            raise NotFound(sub_code="USER_NOT_FOUND")

        return users

    @staticmethod
    async def get_general_admins(db: Database):
        query = "SELECT * FROM users WHERE role = :role"
        users = await db.fetch_all(query, values={"role": 1})

        if not users:
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
    async def get_and_save_stats(user_id: int, db: Database) -> dict:
        hashtag = settings.DEFAULT_CHANGESET_COMMENT.replace("#", "")
        url = f"{settings.OHSOME_STATS_API_URL}/stats/user?hashtag={hashtag}-%2A&userId={user_id}&topics={settings.OHSOME_STATS_TOPICS}"
        osm_user_details_url = f"{settings.OSM_SERVER_URL}/api/0.6/user/{user_id}.json"
        headers = {"Authorization": f"Basic {settings.OHSOME_STATS_TOKEN}"}

        async with AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            changeset_response = await client.get(osm_user_details_url)

        if response.status_code != 200:
            raise UserServiceError("External-Error in Ohsome API")

        topic_data = response.json()

        if changeset_response.status_code != 200:
            raise UserServiceError("External-Error in OSM API")

        changeset_data = changeset_response.json()

        topic_data["result"]["topics"]["changeset"] = {
            "value": changeset_data["user"]["changesets"]["count"],
        }

        new_stats = await UserStats.update(user_id, topic_data, db)

        return new_stats

    @staticmethod
    async def register_user(osm_id, username, changeset_count, picture_url, email, db):
        """
        Creates user in DB
        :param osm_id: Unique OSM user id
        :param username: OSM Username
        :param changeset_count: OSM changeset count
        """
        mapping_level = (await MappingLevel.get_beginner_level(db)).id

        values = {
            "id": osm_id,
            "username": username,
            "role": 0,
            "mapping_level": mapping_level,
            "tasks_mapped": 0,
            "tasks_validated": 0,
            "tasks_invalidated": 0,
            "projects_mapped": [],
            "email_address": email,
            "is_email_verified": False,
            "is_expert": False,
            "picture_url": picture_url,
            "default_editor": "ID",
            "mentions_notifications": True,
            "projects_comments_notifications": False,
            "projects_notifications": True,
            "tasks_notifications": True,
            "tasks_comments_notifications": False,
            "teams_announcement_notifications": True,
            "date_registered": datetime.datetime.utcnow(),
        }

        query = insert(User).values(values)
        await db.execute(query)

        user_query = select(User).where(User.id == osm_id)
        new_user = await db.fetch_one(user_query)
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
        return await requested_user.as_dto(logged_in_user.username, db)

    @staticmethod
    async def get_user_dto_by_id(
        user_id: int, request_user: int, db: Database
    ) -> UserDTO:
        """Gets user DTO for supplied user id"""
        user = await UserService.get_user_by_id(user_id, db)
        request_user = await UserService.get_user_by_id(request_user, db)

        return await user.as_dto(request_user.username, db)

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
        interests_dto = [InterestDTO(**i) for i in interests]

        return interests_dto

    @staticmethod
    async def get_tasks_dto(
        user_id: int,
        start_date: datetime.datetime = None,
        end_date: datetime.datetime = None,
        task_status: str = None,
        project_status: str = None,
        project_id: int = None,
        page: int = 1,
        page_size: int = 10,
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
        paginated_tasks_query = tasks_query.limit(page_size).offset(offset)

        # Execute the query and fetch results
        all_tasks = await db.fetch_all(tasks_query)
        paginated_tasks = await db.fetch_all(paginated_tasks_query)

        # Create list of task DTOs from the results
        task_list = [
            await Task.task_as_dto(
                row, last_updated=row["max"], comments=row["comments"], db=db
            )
            for row in paginated_tasks
        ]

        user_task_dtos = UserTaskDTOs()
        user_task_dtos.user_tasks = task_list
        user_task_dtos.pagination = Pagination.from_total_count(
            page=int(page), per_page=int(page_size), total=len(all_tasks)
        )
        return user_task_dtos

    @staticmethod
    async def get_detailed_stats(username: str, db: Database) -> UserStatsDTO:
        stats_dto = UserStatsDTO()
        user_query = """
            SELECT id FROM users WHERE username = :username
        """
        user = await db.fetch_one(query=user_query, values={"username": username})
        if not user:
            raise NotFound(sub_code="USER_NOT_FOUND", username=username)
        user_id = user["id"]
        stats_query = """
            WITH user_actions AS (
                SELECT
                    action_text,
                    COUNT(DISTINCT (project_id, task_id)) AS action_count
                FROM task_history
                WHERE user_id = :user_id
                AND action_text IN ('VALIDATED', 'INVALIDATED', 'MAPPED')
                GROUP BY action_text
            ),
            others_actions AS (
                SELECT
                    action_text,
                    COUNT(DISTINCT (project_id, task_id)) AS action_count
                FROM task_history th
                WHERE (project_id, task_id) IN (
                    SELECT project_id, task_id
                    FROM task_history
                    WHERE user_id = :user_id
                    AND action_text IN ('VALIDATED', 'INVALIDATED', 'MAPPED')
                )
                AND user_id != :user_id
                AND action_text IN ('VALIDATED', 'INVALIDATED')
                GROUP BY action_text
            )
            SELECT
                CAST(COALESCE((SELECT SUM(action_count) FROM user_actions WHERE action_text = 'VALIDATED'), 0)
                    AS INTEGER) AS tasks_validated,
                CAST(COALESCE((SELECT SUM(action_count) FROM user_actions WHERE action_text = 'INVALIDATED'), 0)
                    AS INTEGER) AS tasks_invalidated,
                CAST(COALESCE((SELECT SUM(action_count) FROM user_actions WHERE action_text = 'MAPPED'), 0)
                    AS INTEGER) AS tasks_mapped,
                CAST(COALESCE((SELECT SUM(action_count) FROM others_actions WHERE action_text = 'VALIDATED'), 0)
                    AS INTEGER) AS tasks_validated_by_others,
                CAST(COALESCE((SELECT SUM(action_count) FROM others_actions WHERE action_text = 'INVALIDATED'), 0)
                    AS INTEGER) AS tasks_invalidated_by_others;
        """
        stats_result = await db.fetch_one(
            query=stats_query, values={"user_id": user_id}
        )
        stats_dto.tasks_mapped = stats_result["tasks_mapped"]
        stats_dto.tasks_validated = stats_result["tasks_validated"]
        stats_dto.tasks_invalidated = stats_result["tasks_invalidated"]
        stats_dto.tasks_validated_by_others = stats_result["tasks_validated_by_others"]
        stats_dto.tasks_invalidated_by_others = stats_result[
            "tasks_invalidated_by_others"
        ]

        projects_mapped_query = """
            SELECT COUNT(DISTINCT project_id) AS projects_count
            FROM task_history
            WHERE user_id = :user_id AND action_text = 'MAPPED';
        """
        projects_mapped = await db.fetch_one(
            query=projects_mapped_query, values={"user_id": user_id}
        )
        stats_dto.projects_mapped = projects_mapped["projects_count"]

        stats_dto.countries_contributed = await UserService.get_countries_contributed(
            user_id, db
        )

        stats_dto.contributions_by_day = await UserService.get_contributions_by_day(
            user_id, db
        )

        stats_dto.total_time_spent = 0
        stats_dto.time_spent_mapping = 0
        stats_dto.time_spent_validating = 0
        # Total validation time
        total_validation_time_query = """
            WITH max_action_text_per_minute AS (
                SELECT
                    date_trunc('minute', action_date) AS trn,
                    MAX(action_text) AS tm
                FROM task_history
                WHERE user_id = :user_id
                AND action = 'LOCKED_FOR_VALIDATION'
                GROUP BY date_trunc('minute', action_date)
            )
            SELECT
                SUM(EXTRACT(EPOCH FROM to_timestamp(tm, 'HH24:MI:SS') - to_timestamp('00:00:00', 'HH24:MI:SS')))
                AS total_time
            FROM max_action_text_per_minute
        """
        result = await db.fetch_one(
            total_validation_time_query, values={"user_id": user.id}
        )
        if result and result["total_time"]:
            stats_dto.time_spent_validating = int(result["total_time"])
            stats_dto.total_time_spent += stats_dto.time_spent_validating

        # Total mapping time
        total_mapping_time_query = """
            SELECT SUM(
                EXTRACT(
                    EPOCH FROM to_timestamp(action_text, 'HH24:MI:SS') -
                    to_timestamp('00:00:00', 'HH24:MI:SS')
                )
            ) AS total_mapping_time_seconds
            FROM task_history
            WHERE user_id = :user_id
            AND action IN ('LOCKED_FOR_MAPPING', 'AUTO_UNLOCKED_FOR_MAPPING')
        """
        result = await db.fetch_one(
            total_mapping_time_query, values={"user_id": user.id}
        )
        if result and result["total_mapping_time_seconds"]:
            stats_dto.time_spent_mapping = int(result["total_mapping_time_seconds"])
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
    # @cached(user_filter_cache)
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

        return await MappingLevelService.get_by_id(user.mapping_level, db)

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
        query = """
            WITH country_stats AS (
                SELECT
                    unnest(projects.country) AS country,
                    task_history.action_text,
                    COUNT(task_history.action_text) AS count
                FROM task_history
                LEFT JOIN projects ON task_history.project_id = projects.id
                WHERE task_history.user_id = :user_id
                AND task_history.action_text IN ('MAPPED', 'BADIMAGERY', 'VALIDATED')
                GROUP BY country, task_history.action_text
            ),
            aggregated_stats AS (
                SELECT
                    country,
                    SUM(CASE
                        WHEN action_text IN ('MAPPED', 'BADIMAGERY') THEN count
                        ELSE 0
                    END) AS mapped,
                    SUM(CASE
                        WHEN action_text = 'VALIDATED' THEN count
                        ELSE 0
                    END) AS validated
                FROM country_stats
                GROUP BY country
            )
            SELECT
                country AS name,
                COALESCE(mapped, 0) AS mapped,
                COALESCE(validated, 0) AS validated,
                COALESCE(mapped, 0) + COALESCE(validated, 0) AS total
            FROM aggregated_stats
            WHERE country IS NOT NULL
            ORDER BY total DESC;
        """

        results = await db.fetch_all(query=query, values={"user_id": user_id})
        countries_contributed = [UserCountryContributed(**record) for record in results]

        return UserCountriesContributed(
            countries_contributed=countries_contributed,
            total=len(countries_contributed),
        )

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
    ) -> ProjectSearchResultsDTO:
        from backend.services.project_search_service import ProjectSearchService

        """Gets all projects a user has mapped or validated on"""
        limit = 20

        # Get user details
        user_query = """
            SELECT id, mapping_level
            FROM users
            WHERE username = :user_name
        """
        user = await db.fetch_one(user_query, {"user_name": user_name})
        if not user:
            raise NotFound(sub_code="USER_NOT_FOUND", username=user_name)

        # Get all projects the user has contributed to
        contributed_projects_query = """
            SELECT DISTINCT project_id
            FROM task_history
            WHERE user_id = :user_id
        """
        contributed_projects = await db.fetch_all(
            contributed_projects_query, {"user_id": user["id"]}
        )
        contributed_project_ids = [row["project_id"] for row in contributed_projects]

        # Fetch campaign tags for contributed or authored projects
        campaign_tags_query = """
            SELECT DISTINCT c.name AS tag
            FROM campaigns c
            JOIN campaign_projects cp ON c.id = cp.campaign_id
            WHERE cp.project_id = ANY(:project_ids) OR :user_id IN (
                SELECT p.author_id
                FROM projects p
                WHERE p.id = cp.project_id
            )
        """
        campaign_tags = await db.fetch_all(
            query=campaign_tags_query,
            values={"user_id": user["id"], "project_ids": contributed_project_ids},
        )

        campaign_tags_set = {row["tag"] for row in campaign_tags}
        # Get projects with matching campaign tags but exclude user contributions
        recommended_projects_query = """
            SELECT DISTINCT
                p.*,
                o.name AS organisation_name,
                o.logo AS organisation_logo,
                u.name AS author_name,
                u.username AS author_username
            FROM projects p
            LEFT JOIN organisations o ON p.organisation_id = o.id
            LEFT JOIN users u ON u.id = p.author_id
            JOIN campaign_projects cp ON p.id = cp.project_id
            JOIN campaigns c ON cp.campaign_id = c.id
            WHERE c.name = ANY(:campaign_tags)
            AND p.author_id != :user_id
            LIMIT :limit
        """
        recommended_projects = await db.fetch_all(
            query=recommended_projects_query,
            values={
                "campaign_tags": list(campaign_tags_set),
                "user_id": user["id"],
                "limit": limit,
            },
        )
        # Get only projects matching the user's mapping level if needed
        len_projs = len(recommended_projects)
        if len_projs < limit:
            remaining_projects_query = """
                SELECT DISTINCT p.*, o.name AS organisation_name, o.logo AS organisation_logo,
                    u.name AS author_name, u.username AS author_username
                FROM projects p
                LEFT JOIN organisations o ON p.organisation_id = o.id
                LEFT JOIN users u ON u.id = p.author_id
                WHERE difficulty = :mapping_level
                LIMIT :remaining_limit
            """
            remaining_projects = await db.fetch_all(
                remaining_projects_query,
                {
                    "mapping_level": user["mapping_level"],
                    "remaining_limit": limit - len_projs,
                },
            )
            recommended_projects.extend(remaining_projects)

        dto = ProjectSearchResultsDTO()

        project_ids = [project["id"] for project in recommended_projects]
        contrib_counts = await ProjectSearchService.get_total_contributions(
            project_ids, db
        )

        dto.results = [
            await ProjectSearchService.create_result_dto(
                project, preferred_locale, contrib_count, db
            )
            for project, contrib_count in zip(recommended_projects, contrib_counts)
        ]
        dto.pagination = None

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
            requested_level = await MappingLevelService.get_by_name(level, db)
        except NotFound:
            raise UserServiceError(f"UnknownUserRole- Unknown role {level}")

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
    async def check_and_update_mapper_level(
        user_id: int, db: Database, stats: dict = None
    ):
        """Check user's mapping level and update if they have crossed threshold"""
        user = await UserService.get_user_by_id(user_id, db)
        user_level = await MappingLevel.get_by_id(user.mapping_level, db)

        if user_level.id == (await MappingLevel.get_max_level(db)).id:
            return  # User has achieved the highest level, no need to proceed

        async with db.transaction():
            # Update user stats
            if not stats:
                stats = await UserService.get_and_save_stats(user_id, db)

            # Assign badges based on stats
            # * get all badges that the user doesn't have
            badges = await MappingBadge.available_badges_for_user(user_id, db)
            # * compare each with stats, get list of assignable ids
            assignable_ids = []

            for badge in badges:
                if badge.all_requirements_satisfied(stats):
                    assignable_ids.append(badge.id)
            # * assign all badges
            await user.assign_badges(assignable_ids, db)

            # Assign levels based on badges
            next_level = await MappingLevel.get_next(user_level.ordering, db)

            if await MappingLevel.all_badges_satisfied(next_level.id, user.id, db):
                if next_level.approvals_required == 0:
                    await user.set_mapping_level(next_level, db)
                else:
                    await UserNextLevel.nominate(user.id, next_level.id, db)

    @staticmethod
    async def approve_level(user_id: int, voter_id: int, db: Database):
        if user_id == voter_id:
            raise UserServiceError("PermisisonError-User cannot vote for themselves")

        async with db.transaction():
            level_request = await UserNextLevel.get_for_user(user_id, db)

            if not level_request:
                return

            requested_level = await MappingLevel.get_by_id(level_request.level_id, db)
            await UserLevelVote.vote(user_id, requested_level.id, voter_id, db)

            votes = await UserLevelVote.count(user_id, requested_level.id, db)

            if votes >= requested_level.approvals_required:
                user = await User.get_by_id(user_id, db)
                await user.set_mapping_level(requested_level, db)
                await UserNextLevel.clear(user_id, requested_level.id, db)
                await UserLevelVote.clear(user_id, requested_level.id, db)

    @staticmethod
    async def next_level(user_id: int, db: Database) -> UserNextLevelDTO:
        user = await UserService.get_user_by_id(user_id, db)
        user_level = await MappingLevel.get_by_id(user.mapping_level, db)
        next_level = await MappingLevel.get_next(user_level.ordering, db)

        if not next_level:
            return UserNextLevelDTO(
                nextLevel=None,
                aggregatedGoal=None,
                aggregatedProgress=None,
                noun='',
            )

        badges = await MappingBadge.get_related_to_level(next_level.id, db)

        aggregatedGoal = 0
        relevant_keys = set()

        for badge in badges:
            requirements = json.loads(badge.requirements)
            aggregatedGoal += sum(v for v in requirements.values())
            relevant_keys.update(requirements.keys())

        stats = await UserStats.get_for_user(user_id, db)

        aggregatedProgress = sum(
            v for k, v in json.loads(stats.stats).items() if k in relevant_keys
        )

        return UserNextLevelDTO(
            nextLevel=next_level.name,
            aggregatedGoal=aggregatedGoal,
            aggregatedProgress=aggregatedProgress,
            metrics=list(relevant_keys),
        )

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
    async def refresh_mapper_level(db: Database) -> int:
        """Helper function to run thru all users in the DB and update their mapper level"""
        users = await User.get_all_users_not_paginated(db)
        users_updated = 1
        total_users = len(users)

        for user in users:
            await UserService.check_and_update_mapper_level(user.id, db)

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
        else:
            return user.id

    @staticmethod
    async def get_interests(user: User, db: Database) -> InterestsListDTO:
        query = """
            SELECT * FROM interests
        """
        interests = await db.fetch_all(query)
        interest_list_dto = InterestsListDTO()
        for interest in interests:
            int_dto = InterestDTO(**interest)
            if interest.name in user.interests:
                int_dto.user_selected = True
            interest_list_dto.interests.append(int_dto)
        return interest_list_dto
