import datetime
from datetime import date, timedelta

from aiocache import Cache, cached
from databases import Database
from sqlalchemy import func, select

from backend.models.dtos.project_dto import ProjectSearchResultsDTO
from backend.models.dtos.stats_dto import (
    CampaignStatsDTO,
    GenderStatsDTO,
    HomePageStatsDTO,
    OrganizationListStatsDTO,
    Pagination,
    ProjectActivityDTO,
    ProjectContributionsDTO,
    ProjectLastActivityDTO,
    TaskHistoryDTO,
    TaskStatsDTO,
    TaskStatusDTO,
    UserContribution,
    UserStatsDTO,
)
from backend.models.postgis.campaign import Campaign, campaign_projects
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project import Project
from backend.models.postgis.statuses import MappingLevel, TaskStatus, UserGender
from backend.models.postgis.task import Task, TaskAction, User
from backend.models.postgis.utils import timestamp  # noqa: F401
from backend.services.project_search_service import ProjectSearchService
from backend.services.project_service import ProjectService
from backend.services.users.user_service import UserService


class StatsService:
    @staticmethod
    async def update_stats_after_task_state_change(
        project_id: int,
        user_id: int,
        last_state: TaskStatus,
        new_state: TaskStatus,
        db: Database,
        action: str = "change",
    ):
        """Update stats when a task has had a state change"""

        # No stats to record for these states
        if new_state in [
            TaskStatus.LOCKED_FOR_VALIDATION,
            TaskStatus.LOCKED_FOR_MAPPING,
        ]:
            return
        project = await ProjectService.get_project_by_id(project_id, db)
        user = await UserService.get_user_by_id(user_id, db)
        project, user = await StatsService._update_tasks_stats(
            project, user, last_state, new_state, db, action
        )
        # Upsert mapped projects for the user
        await UserService.upsert_mapped_projects(user_id, project_id, db)
        query = """
            UPDATE projects
            SET last_updated = :last_updated
            WHERE id = :project_id
        """
        await db.execute(
            query,
            values={
                "last_updated": datetime.datetime.utcnow(),
                "project_id": project_id,
            },
        )
        return project, user

    @staticmethod
    async def _update_tasks_stats(
        project: dict,
        user: dict,
        last_state: TaskStatus,
        new_state: TaskStatus,
        db: Database,
        action="change",
    ):
        if new_state == last_state:
            return project, user

        # Increment counters for the new state
        if new_state == TaskStatus.MAPPED:
            project.tasks_mapped += 1

        elif new_state == TaskStatus.VALIDATED:
            project.tasks_validated += 1
        elif new_state == TaskStatus.BADIMAGERY:
            project.tasks_bad_imagery += 1

        # Increment user stats if action is "change"
        if action == "change":
            if new_state == TaskStatus.MAPPED:
                user.tasks_mapped += 1
            elif new_state == TaskStatus.VALIDATED:
                user.tasks_validated += 1
            elif new_state == TaskStatus.INVALIDATED:
                user.tasks_invalidated += 1

        # Decrement counters for the old state
        if last_state == TaskStatus.MAPPED:
            project.tasks_mapped -= 1
        elif last_state == TaskStatus.VALIDATED:
            project.tasks_validated -= 1

        elif last_state == TaskStatus.BADIMAGERY:
            project.tasks_bad_imagery -= 1

        # Undo user stats if action is "undo"
        if action == "undo":
            if last_state == TaskStatus.MAPPED:
                user.tasks_mapped -= 1
            elif last_state == TaskStatus.VALIDATED:
                user.tasks_validated -= 1
            elif last_state == TaskStatus.INVALIDATED:
                user.tasks_invalidated -= 1

        # Update the project and user records in the database
        await db.execute(
            """
            UPDATE projects
            SET tasks_mapped = :tasks_mapped,
                tasks_validated = :tasks_validated,
                tasks_bad_imagery = :tasks_bad_imagery
            WHERE id = :project_id
        """,
            values={
                "tasks_mapped": project.tasks_mapped,
                "tasks_validated": project.tasks_validated,
                "tasks_bad_imagery": project.tasks_bad_imagery,
                "project_id": project.id,
            },
        )

        await db.execute(
            """
            UPDATE users
            SET tasks_mapped = :tasks_mapped,
                tasks_validated = :tasks_validated,
                tasks_invalidated = :tasks_invalidated
            WHERE id = :user_id
        """,
            values={
                "tasks_mapped": user.tasks_mapped,
                "tasks_validated": user.tasks_validated,
                "tasks_invalidated": user.tasks_invalidated,
                "user_id": user.id,
            },
        )
        return project, user

    @staticmethod
    async def get_latest_activity(
        project_id: int, page: int, db: Database
    ) -> ProjectActivityDTO:
        """Gets all the activity on a project"""

        # Pagination setup
        page_size = 10
        offset = (page - 1) * page_size

        # Query to fetch task history
        query = """
        SELECT
            th.id,
            th.task_id,
            th.action,
            th.action_date,
            th.action_text,
            u.username
        FROM task_history th
        JOIN users u ON th.user_id = u.id
        WHERE
            th.project_id = :project_id
            AND th.action != :comment_action
        ORDER BY th.action_date DESC
        LIMIT :limit OFFSET :offset
        """
        rows = await db.fetch_all(
            query,
            {
                "project_id": project_id,
                "comment_action": "COMMENT",
                "limit": page_size,
                "offset": offset,
            },
        )

        # Creating DTO
        activity_dto = ProjectActivityDTO(activity=[])
        for row in rows:
            history = TaskHistoryDTO(
                history_id=row["id"],
                task_id=row["task_id"],
                action=row["action"],
                action_text=row["action_text"],
                action_date=row["action_date"],
                action_by=row["username"],
            )
            activity_dto.activity.append(history)

        # Calculate total items for pagination
        total_query = """
        SELECT COUNT(*)
        FROM task_history th
        WHERE
            th.project_id = :project_id
            AND th.action != :comment_action
        """
        total_items_result = await db.fetch_one(
            total_query, {"project_id": project_id, "comment_action": "COMMENT"}
        )

        total_items = total_items_result["count"] if total_items_result else 0

        # Use the from_total_count method to correctly initialize the Pagination DTO
        activity_dto.pagination = Pagination.from_total_count(
            page=page, per_page=page_size, total=total_items
        )

        return activity_dto

    @staticmethod
    async def get_popular_projects(db: Database) -> ProjectSearchResultsDTO:
        """Get all projects ordered by task history."""

        # Query to calculate the "popularity" rate based on task history
        popularity_query = """
        SELECT
            th.project_id AS id,
            COUNT(th.user_id) / EXTRACT(EPOCH FROM SUM(th.action_date::time)) AS rate
        FROM task_history th
        WHERE th.action_date >= :start_date
        AND (th.action = :locked_for_mapping OR th.action = :locked_for_validation)
        AND th.action_text IS NOT NULL
        AND th.action_text != ''
        GROUP BY th.project_id
        ORDER BY rate DESC
        LIMIT 10
        """

        start_date = date.today() - timedelta(days=90)
        params = {
            "start_date": start_date,
            "locked_for_mapping": TaskAction.LOCKED_FOR_MAPPING.name,
            "locked_for_validation": TaskAction.LOCKED_FOR_VALIDATION.name,
        }

        # Fetch the popular projects based on the rate calculated above
        popular_projects = await db.fetch_all(popularity_query, params)
        project_ids = [row["id"] for row in popular_projects]

        if not project_ids:
            return ProjectSearchResultsDTO(results=[])

        # Use the existing `create_search_query` function to fetch detailed project data
        project_query, query_params = await ProjectSearchService.create_search_query(db)
        project_query += " AND p.id = ANY(:project_ids)"
        query_params["project_ids"] = project_ids

        projects = await db.fetch_all(project_query, query_params)

        # Get total contributors for each project
        contrib_counts = await ProjectSearchService.get_total_contributions(
            project_ids, db
        )
        zip_items = zip(projects, contrib_counts)

        # Prepare the final DTO with all project details
        dto = ProjectSearchResultsDTO()
        dto.results = [
            await ProjectSearchService.create_result_dto(p, "en", t, db)
            for p, t in zip_items
        ]

        return dto

    @staticmethod
    async def get_last_activity(
        project_id: int, db: Database
    ) -> ProjectLastActivityDTO:
        """Gets the last activity for a project's tasks"""

        # Subquery: Fetch latest actions for each task, excluding comments
        subquery_latest_action = """
        SELECT DISTINCT ON (th.task_id)
            th.task_id,
            th.action_date,
            th.user_id
        FROM task_history th
        WHERE th.project_id = :project_id
        AND th.action != :comment_action
        ORDER BY th.task_id, th.action_date DESC
        """

        # Main query: Join task statuses with latest actions and user details
        query_task_statuses = f"""
        SELECT
            t.id AS task_id,
            t.task_status,
            la.action_date,
            u.username AS action_by
        FROM tasks t
        LEFT JOIN ({subquery_latest_action}) la ON la.task_id = t.id
        LEFT JOIN users u ON u.id = la.user_id
        WHERE t.project_id = :project_id
        ORDER BY t.id
        """

        # Execute the query
        results = await db.fetch_all(
            query_task_statuses, {"project_id": project_id, "comment_action": "COMMENT"}
        )

        # Create DTO
        dto = ProjectLastActivityDTO(activity=[])
        for row in results:
            task_status_dto = TaskStatusDTO(
                task_id=row["task_id"],
                task_status=TaskStatus(row["task_status"]).name,
                action_date=row["action_date"],
                action_by=row["action_by"],
            )
            dto.activity.append(task_status_dto)

        return dto

    @staticmethod
    async def get_user_contributions(
        project_id: int, db: Database
    ) -> ProjectContributionsDTO:
        # Query to get user contributions
        query = """
            WITH mapped AS (
                SELECT
                    mapped_by AS user_id,
                    COUNT(mapped_by) AS count,
                    ARRAY_AGG(id) AS task_ids
                FROM tasks
                WHERE project_id = :project_id
                  AND task_status != :bad_imagery_status
                GROUP BY mapped_by
            ),
            badimagery AS (
                SELECT
                    mapped_by AS user_id,
                    COUNT(mapped_by) AS count,
                    ARRAY_AGG(id) AS task_ids
                FROM tasks
                WHERE project_id = :project_id
                  AND task_status = :bad_imagery_status
                GROUP BY mapped_by
            ),
            validated AS (
                SELECT
                    validated_by AS user_id,
                    COUNT(validated_by) AS count,
                    ARRAY_AGG(id) AS task_ids
                FROM tasks
                WHERE project_id = :project_id
                GROUP BY validated_by
            ),
            project_contributions AS (
                SELECT DISTINCT user_id
                FROM task_history
                WHERE project_id = :project_id
                  AND action != 'COMMENT'
            )
            SELECT
                u.id,
                u.username,
                u.name,
                u.mapping_level,
                u.picture_url,
                u.date_registered,
                COALESCE(m.count, 0) AS mapped,
                COALESCE(v.count, 0) AS validated,
                COALESCE(b.count, 0) AS bad_imagery,
                COALESCE(m.count, 0) + COALESCE(v.count, 0) + COALESCE(b.count, 0) AS total,
                COALESCE(m.task_ids, '{}') AS mapped_tasks,
                COALESCE(v.task_ids, '{}') AS validated_tasks,
                COALESCE(b.task_ids, '{}') AS bad_imagery_tasks
            FROM users u
            JOIN project_contributions pc ON u.id = pc.user_id
            LEFT JOIN mapped m ON u.id = m.user_id
            LEFT JOIN badimagery b ON u.id = b.user_id
            LEFT JOIN validated v ON u.id = v.user_id
            ORDER BY total DESC;
        """

        # Execute the query
        rows = await db.fetch_all(
            query,
            values={
                "project_id": project_id,
                "bad_imagery_status": TaskStatus.BADIMAGERY.value,
            },
        )

        # Process the results into DTO
        contrib_dto = ProjectContributionsDTO()
        user_contributions = [
            UserContribution(
                dict(
                    username=row["username"],
                    name=row["name"],
                    mapping_level=MappingLevel(row["mapping_level"]).name,
                    picture_url=row["picture_url"],
                    mapped=row["mapped"],
                    bad_imagery=row["bad_imagery"],
                    validated=row["validated"],
                    total=row["total"],
                    mapped_tasks=(
                        row["mapped_tasks"] if row["mapped_tasks"] is not None else []
                    ),
                    bad_imagery_tasks=(
                        row["bad_imagery_tasks"] if row["bad_imagery_tasks"] else []
                    ),
                    validated_tasks=(
                        row["validated_tasks"]
                        if row["validated_tasks"] is not None
                        else []
                    ),
                    date_registered=(
                        row["date_registered"].date()
                        if isinstance(row["date_registered"], datetime.datetime)
                        else None
                    ),
                )
            )
            for row in rows
        ]
        contrib_dto.user_contributions = user_contributions

        return contrib_dto

    def homepage_cache_key_builder(func, *args, **kwargs):
        args_without_db = args[:-1]
        return f"{func.__name__}:{args_without_db}:{kwargs}"

    @staticmethod
    @cached(cache=Cache.MEMORY, key_builder=homepage_cache_key_builder, ttl=600)
    async def get_homepage_stats(
        abbrev: bool = True, db: Database = None
    ) -> HomePageStatsDTO:
        """Get overall TM stats to give community a feel for progress that's being made"""
        dto = HomePageStatsDTO()
        # Total Projects
        query = select(func.count(Project.id))
        dto.total_projects = await db.fetch_val(query)

        # Mappers online (distinct users who locked tasks)
        query = select(func.count(Task.locked_by.distinct())).where(
            Task.locked_by.isnot(None)
        )
        dto.mappers_online = await db.fetch_val(query)

        # Total Mappers
        query = select(func.count(User.id))
        dto.total_mappers = await db.fetch_val(query)

        # Tasks mapped (status: MAPPED, VALIDATED)
        query = select(func.count()).where(
            Task.task_status.in_([TaskStatus.MAPPED.value, TaskStatus.VALIDATED.value])
        )
        dto.tasks_mapped = await db.fetch_val(query)

        if not abbrev:
            # Total Validators
            query = select(func.count(Task.validated_by.distinct())).where(
                Task.task_status == TaskStatus.VALIDATED.value
            )
            dto.total_validators = await db.fetch_val(query)

            # Tasks Validated
            query = select(func.count()).where(
                Task.task_status == TaskStatus.VALIDATED.value
            )
            dto.tasks_validated = await db.fetch_val(query)

            # Total Area (sum of project areas in km²)
            query = select(
                func.coalesce(func.sum(func.ST_Area(Project.geometry, True) / 1000000))
            )
            dto.total_area = await db.fetch_val(query)

            # Total Mapped Area
            query = select(
                func.coalesce(func.sum(func.ST_Area(Task.geometry, True) / 1000000))
            ).where(Task.task_status == TaskStatus.MAPPED.value)
            dto.total_mapped_area = await db.fetch_val(query)

            # Total Validated Area
            query = select(
                func.coalesce(func.sum(func.ST_Area(Task.geometry, True) / 1000000))
            ).where(Task.task_status == TaskStatus.VALIDATED.value)
            dto.total_validated_area = await db.fetch_val(query)

            # Campaign Stats
            query = select(func.count(Campaign.id))
            unique_campaigns = await db.fetch_val(query)

            query = (
                select([Campaign.name, func.count()])
                .select_from(Campaign.join(campaign_projects))
                .group_by(Campaign.id)
            )
            linked_campaigns_count = await db.fetch_all(query)

            subquery = select(campaign_projects.c.project_id.distinct()).subquery()
            query = select(func.count()).where(~Project.id.in_(subquery))
            no_campaign_count = await db.fetch_val(query)

            dto.campaigns = [CampaignStatsDTO(row) for row in linked_campaigns_count]
            if no_campaign_count:
                dto.campaigns.append(
                    CampaignStatsDTO(("Unassociated", no_campaign_count))
                )

            dto.total_campaigns = unique_campaigns

            # Organisation Stats
            query = select(func.count(Organisation.id))
            unique_orgs = await db.fetch_val(query)

            query = (
                select([Organisation.name, func.count(Project.organisation_id)])
                .join(Project.organisation)
                .group_by(Organisation.id)
            )
            linked_orgs_count = await db.fetch_all(query)

            subquery = select(Project.organisation_id.distinct()).subquery()
            query = select(func.count()).where(~Organisation.id.in_(subquery))
            no_org_project_count = await db.fetch_val(query)

            dto.organisations = [
                OrganizationListStatsDTO(row) for row in linked_orgs_count
            ]

            if no_org_project_count:
                no_org_proj = OrganizationListStatsDTO(
                    ("Unassociated", no_org_project_count)
                )
                dto.organisations.append(no_org_proj)

            dto.total_organisations = unique_orgs
        else:
            # Clear null attributes for abbreviated call
            clear_attrs = [
                "total_validators",
                "tasks_validated",
                "total_area",
                "total_mapped_area",
                "total_validated_area",
                "campaigns",
                "total_campaigns",
                "organisations",
                "total_organisations",
            ]

            for attr in clear_attrs:
                delattr(dto, attr)

        return dto

    @staticmethod
    async def update_all_project_stats(db: Database):
        query = "SELECT id FROM projects"
        project_ids = await db.fetch_all(query)

        for record in project_ids:
            await StatsService.update_project_stats(record["id"])

    @staticmethod
    async def update_project_stats(project_id: int, db: Database):
        # Fetch task counts
        await db.execute(
            """
            UPDATE projects
            SET total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id),
                tasks_mapped = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 2),
                tasks_validated = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 4),
                tasks_bad_imagery = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 6)
            WHERE id = :project_id;
            """,
            {"project_id": project_id},
        )
        await db.execute(
            """
            UPDATE users
            SET projects_mapped = array_append(projects_mapped, :project_id)
            WHERE id IN (
                SELECT DISTINCT user_id
                FROM task_history
                WHERE action = 'STATE_CHANGE' AND project_id = :project_id
            );
            """,
            {"project_id": project_id},
        )

    @staticmethod
    async def get_all_users_statistics(start_date: date, end_date: date, db: Database):
        # Base query for users within the date range
        base_query = select(User).filter(
            User.date_registered >= start_date, User.date_registered <= end_date
        )

        # Execute total user count
        stats_dto = UserStatsDTO()
        total_count_query = select(func.count()).select_from(base_query.subquery())
        result = await db.execute(total_count_query)
        stats_dto.total = result

        # Beginner count
        beginner_count_query = select(func.count()).select_from(
            base_query.filter(
                User.mapping_level == MappingLevel.BEGINNER.value
            ).subquery()
        )
        result = await db.execute(beginner_count_query)
        stats_dto.beginner = result

        # Intermediate count
        intermediate_count_query = select(func.count()).select_from(
            base_query.filter(
                User.mapping_level == MappingLevel.INTERMEDIATE.value
            ).subquery()
        )
        result = await db.execute(intermediate_count_query)
        stats_dto.intermediate = result

        # Advanced count
        advanced_count_query = select(func.count()).select_from(
            base_query.filter(
                User.mapping_level == MappingLevel.ADVANCED.value
            ).subquery()
        )
        result = await db.execute(advanced_count_query)
        stats_dto.advanced = result

        # Contributed count (those with projects mapped)
        contributed_count_query = select(func.count()).select_from(
            base_query.filter(User.projects_mapped.isnot(None)).subquery()
        )
        result = await db.execute(contributed_count_query)
        stats_dto.contributed = result

        # Email verified count
        email_verified_count_query = select(func.count()).select_from(
            base_query.filter(User.is_email_verified.is_(True)).subquery()
        )
        result = await db.execute(email_verified_count_query)
        stats_dto.email_verified = result

        # Gender stats
        gender_stats = GenderStatsDTO()

        # Male count
        male_count_query = select(func.count()).select_from(
            base_query.filter(User.gender == UserGender.MALE.value).subquery()
        )
        result = await db.execute(male_count_query)
        gender_stats.male = result

        # Female count
        female_count_query = select(func.count()).select_from(
            base_query.filter(User.gender == UserGender.FEMALE.value).subquery()
        )
        result = await db.execute(female_count_query)
        gender_stats.female = result

        # Self-describe count
        self_describe_count_query = select(func.count()).select_from(
            base_query.filter(User.gender == UserGender.SELF_DESCRIBE.value).subquery()
        )
        result = await db.execute(self_describe_count_query)
        gender_stats.self_describe = result

        # Prefer not to say count
        prefer_not_count_query = select(func.count()).select_from(
            base_query.filter(User.gender == UserGender.PREFER_NOT.value).subquery()
        )
        result = await db.execute(prefer_not_count_query)
        gender_stats.prefer_not = result

        # Set gender stats in the stats_dto
        stats_dto.genders = gender_stats

        return stats_dto

    @staticmethod
    def set_task_stats(row):
        return {
            "date": row["date"],
            "mapped": row["mapped"],
            "validated": row["validated"],
            "bad_imagery": row["bad_imagery"],
        }

    def cache_key_builder(func, *args, **kwargs):
        args_without_first = args[1:]
        return f"{func.__name__}:{args_without_first}:{kwargs}"

    @staticmethod
    @cached(cache=Cache.MEMORY, key_builder=cache_key_builder, ttl=3600)
    async def get_task_stats(
        db: Database,
        start_date,
        end_date,
        org_id=None,
        org_name=None,
        campaign=None,
        project_id=None,
        country=None,
    ):
        """Creates task stats for a period using the TaskStatsDTO"""
        # Base query components
        base_query = """
            WITH filtered_projects AS (
                SELECT id FROM projects
                WHERE 1 = 1
                {filters}
            ),
            aggregated_stats AS (
                SELECT
                    DATE(action_date) AS day,
                    action_text,
                    COUNT(*) AS count
                FROM task_history
                WHERE action = 'STATE_CHANGE'
                AND action_text IN ('MAPPED', 'VALIDATED', 'BADIMAGERY')
                AND project_id IN (SELECT id FROM filtered_projects)
                GROUP BY DATE(action_date), action_text
            ),
            date_series AS (
                SELECT generate_series(
                    CAST(:start_date AS DATE),
                    CAST(:end_date AS DATE),
                    INTERVAL '1 day'
                )::DATE AS date
            )
            SELECT
                TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,  -- Cast date to string
                COALESCE(SUM(CASE WHEN ag.action_text = 'MAPPED' THEN ag.count END), 0) AS mapped,
                COALESCE(SUM(CASE WHEN ag.action_text = 'VALIDATED' THEN ag.count END), 0) AS validated,
                COALESCE(SUM(CASE WHEN ag.action_text = 'BADIMAGERY' THEN ag.count END), 0) AS bad_imagery
            FROM date_series ds
            LEFT JOIN aggregated_stats ag ON ds.date = ag.day
            GROUP BY ds.date
            HAVING
                COALESCE(SUM(CASE WHEN ag.action_text = 'MAPPED' THEN ag.count END), 0) > 0 OR
                COALESCE(SUM(CASE WHEN ag.action_text = 'VALIDATED' THEN ag.count END), 0) > 0 OR
                COALESCE(SUM(CASE WHEN ag.action_text = 'BADIMAGERY' THEN ag.count END), 0) > 0
            ORDER BY ds.date;
        """

        filters = []
        values = {"start_date": start_date, "end_date": end_date}

        if org_id:
            filters.append("AND organisation_id = :org_id")
            values["org_id"] = int(org_id)

        if org_name:
            filters.append(
                """
                AND organisation_id = (
                    SELECT id FROM organisations WHERE name = :org_name
                )
            """
            )
            values["org_name"] = org_name

        if campaign:
            filters.append(
                """
                AND id IN (
                    SELECT project_id FROM campaign_projects
                    WHERE campaign_id = (
                        SELECT id FROM campaigns WHERE name = :campaign
                    )
                )
            """
            )
            values["campaign"] = campaign

        if project_id:
            filters.append("AND id = ANY(:project_id)")
            values["project_id"] = project_id

        if country:
            filters.append(
                """
                AND EXISTS (
                    SELECT 1
                    FROM unnest(country) AS c
                    WHERE c ILIKE :country
                )
            """
            )
            values["country"] = f"%{country}%"

        final_query = base_query.format(filters=" ".join(filters))

        results = await db.fetch_all(query=final_query, values=values)

        stats_dicts = [dict(row) for row in results]

        return TaskStatsDTO(stats=stats_dicts)
