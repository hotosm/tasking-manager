from cachetools import TTLCache, cached
from datetime import date, timedelta
from sqlalchemy import func, desc, cast, extract, or_
from sqlalchemy.sql.functions import coalesce
from sqlalchemy.types import Time

from backend import db
from backend.exceptions import NotFound
from backend.models.dtos.stats_dto import (
    ProjectContributionsDTO,
    UserContribution,
    Pagination,
    TaskHistoryDTO,
    TaskStatusDTO,
    ProjectActivityDTO,
    ProjectLastActivityDTO,
    HomePageStatsDTO,
    OrganizationListStatsDTO,
    CampaignStatsDTO,
    TaskStats,
    TaskStatsDTO,
    GenderStatsDTO,
    UserStatsDTO,
)

from backend.models.dtos.project_dto import ProjectSearchResultsDTO
from backend.models.postgis.campaign import Campaign, campaign_projects
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project import Project
from backend.models.postgis.statuses import TaskStatus, MappingLevel, UserGender
from backend.models.postgis.task import TaskHistory, User, Task, TaskAction
from backend.models.postgis.utils import timestamp  # noqa: F401
from backend.services.project_service import ProjectService
from backend.services.project_search_service import ProjectSearchService
from backend.services.users.user_service import UserService
from backend.services.organisation_service import OrganisationService
from backend.services.campaign_service import CampaignService

homepage_stats_cache = TTLCache(maxsize=4, ttl=30)


class StatsService:
    @staticmethod
    def update_stats_after_task_state_change(
        project_id: int,
        user_id: int,
        last_state: TaskStatus,
        new_state: TaskStatus,
        action="change",
        local_session=None,
    ):
        """Update stats when a task has had a state change"""

        if new_state in [
            TaskStatus.LOCKED_FOR_VALIDATION,
            TaskStatus.LOCKED_FOR_MAPPING,
        ]:
            return  # No stats to record for these states

        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        project, user = StatsService._update_tasks_stats(
            project, user, last_state, new_state, action
        )
        UserService.upsert_mapped_projects(
            user_id, project_id, local_session=local_session
        )
        project.last_updated = timestamp()

        # Transaction will be saved when task is saved
        return project, user

    @staticmethod
    def _update_tasks_stats(
        project: Project,
        user: User,
        last_state: TaskStatus,
        new_state: TaskStatus,
        action="change",
    ):
        # Make sure you are aware that users table has it as incrementing counters,
        # while projects table reflect the actual state, and both increment and decrement happens
        if new_state == last_state:
            return project, user

        # Set counters for new state
        if new_state == TaskStatus.MAPPED:
            project.tasks_mapped += 1
        elif new_state == TaskStatus.VALIDATED:
            project.tasks_validated += 1
        elif new_state == TaskStatus.BADIMAGERY:
            project.tasks_bad_imagery += 1

        if action == "change":
            if new_state == TaskStatus.MAPPED:
                user.tasks_mapped += 1
            elif new_state == TaskStatus.VALIDATED:
                user.tasks_validated += 1
            elif new_state == TaskStatus.INVALIDATED:
                user.tasks_invalidated += 1

        # Remove counters for old state
        if last_state == TaskStatus.MAPPED:
            project.tasks_mapped -= 1
        elif last_state == TaskStatus.VALIDATED:
            project.tasks_validated -= 1
        elif last_state == TaskStatus.BADIMAGERY:
            project.tasks_bad_imagery -= 1

        if action == "undo":
            if last_state == TaskStatus.MAPPED:
                user.tasks_mapped -= 1
            elif last_state == TaskStatus.VALIDATED:
                user.tasks_validated -= 1
            elif last_state == TaskStatus.INVALIDATED:
                user.tasks_invalidated -= 1

        return project, user

    @staticmethod
    def get_latest_activity(project_id: int, page: int) -> ProjectActivityDTO:
        """Gets all the activity on a project"""

        if not ProjectService.exists(project_id):
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        results = (
            db.session.query(
                TaskHistory.id,
                TaskHistory.task_id,
                TaskHistory.action,
                TaskHistory.action_date,
                TaskHistory.action_text,
                User.username,
            )
            .join(User)
            .filter(
                TaskHistory.project_id == project_id,
                TaskHistory.action != TaskAction.COMMENT.name,
            )
            .order_by(TaskHistory.action_date.desc())
            .paginate(page=page, per_page=10, error_out=True)
        )

        activity_dto = ProjectActivityDTO()
        for item in results.items:
            history = TaskHistoryDTO()
            history.task_id = item.id
            history.task_id = item.task_id
            history.action = item.action
            history.action_text = item.action_text
            history.action_date = item.action_date
            history.action_by = item.username
            activity_dto.activity.append(history)

        activity_dto.pagination = Pagination(results)
        return activity_dto

    @staticmethod
    def get_popular_projects() -> ProjectSearchResultsDTO:
        """Get all projects ordered by task_history"""

        rate_func = func.count(TaskHistory.user_id) / extract(
            "epoch", func.sum(cast(TaskHistory.action_date, Time))
        )

        query = (
            TaskHistory.query.with_entities(
                TaskHistory.project_id.label("id"), rate_func.label("rate")
            )
            .filter(TaskHistory.action_date >= date.today() - timedelta(days=90))
            .filter(
                or_(
                    TaskHistory.action == TaskAction.LOCKED_FOR_MAPPING.name,
                    TaskHistory.action == TaskAction.LOCKED_FOR_VALIDATION.name,
                )
            )
            .filter(TaskHistory.action_text is not None)
            .filter(TaskHistory.action_text != "")
            .group_by(TaskHistory.project_id)
            .order_by(desc("rate"))
            .limit(10)
            .subquery()
        )

        projects_query = ProjectSearchService.create_search_query()
        projects = projects_query.filter(Project.id == query.c.id).all()
        # Get total contributors.
        contrib_counts = ProjectSearchService.get_total_contributions(projects)
        zip_items = zip(projects, contrib_counts)

        dto = ProjectSearchResultsDTO()
        dto.results = [
            ProjectSearchService.create_result_dto(p, "en", t) for p, t in zip_items
        ]

        return dto

    @staticmethod
    def get_last_activity(project_id: int) -> ProjectLastActivityDTO:
        """Gets the last activity for a project's tasks"""
        sq = (
            TaskHistory.query.with_entities(
                TaskHistory.task_id,
                TaskHistory.action_date,
                TaskHistory.user_id,
            )
            .filter(TaskHistory.project_id == project_id)
            .filter(TaskHistory.action != TaskAction.COMMENT.name)
            .order_by(TaskHistory.task_id, TaskHistory.action_date.desc())
            .distinct(TaskHistory.task_id)
            .subquery()
        )

        sq_statuses = (
            Task.query.with_entities(Task.id, Task.task_status)
            .filter(Task.project_id == project_id)
            .subquery()
        )
        results = (
            db.session.query(
                sq_statuses.c.id,
                sq.c.action_date,
                sq_statuses.c.task_status,
                User.username,
            )
            .outerjoin(sq, sq.c.task_id == sq_statuses.c.id)
            .outerjoin(User, User.id == sq.c.user_id)
            .order_by(sq_statuses.c.id)
            .all()
        )

        dto = ProjectLastActivityDTO()
        dto.activity = [
            TaskStatusDTO(
                dict(
                    task_id=r.id,
                    task_status=TaskStatus(r.task_status).name,
                    action_date=r.action_date,
                    action_by=r.username,
                )
            )
            for r in results
        ]

        return dto

    @staticmethod
    def get_user_contributions(project_id: int) -> ProjectContributionsDTO:
        """Get all user contributions on a project"""

        mapped_stmt = (
            Task.query.with_entities(
                Task.mapped_by,
                func.count(Task.mapped_by).label("count"),
                func.array_agg(Task.id).label("task_ids"),
            )
            .filter(Task.project_id == project_id)
            .filter(Task.task_status != TaskStatus.BADIMAGERY.value)
            .group_by(Task.mapped_by)
            .subquery()
        )
        badimagery_stmt = (
            Task.query.with_entities(
                Task.mapped_by,
                func.count(Task.mapped_by).label("count"),
                func.array_agg(Task.id).label("task_ids"),
            )
            .filter(Task.project_id == project_id)
            .filter(Task.task_status == TaskStatus.BADIMAGERY.value)
            .group_by(Task.mapped_by)
            .subquery()
        )
        validated_stmt = (
            Task.query.with_entities(
                Task.validated_by,
                func.count(Task.validated_by).label("count"),
                func.array_agg(Task.id).label("task_ids"),
            )
            .filter(Task.project_id == project_id)
            .group_by(Task.validated_by)
            .subquery()
        )

        project_contributions = (
            TaskHistory.query.with_entities(TaskHistory.user_id)
            .filter(
                TaskHistory.project_id == project_id, TaskHistory.action != "COMMENT"
            )
            .distinct(TaskHistory.user_id)
            .subquery()
        )

        results = (
            db.session.query(
                User.id,
                User.username,
                User.name,
                User.mapping_level,
                User.picture_url,
                User.date_registered,
                coalesce(mapped_stmt.c.count, 0).label("mapped"),
                coalesce(validated_stmt.c.count, 0).label("validated"),
                coalesce(badimagery_stmt.c.count, 0).label("bad_imagery"),
                (
                    coalesce(mapped_stmt.c.count, 0)
                    + coalesce(validated_stmt.c.count, 0)
                    + coalesce(badimagery_stmt.c.count, 0)
                ).label("total"),
                mapped_stmt.c.task_ids.label("mapped_tasks"),
                validated_stmt.c.task_ids.label("validated_tasks"),
                badimagery_stmt.c.task_ids.label("bad_imagery_tasks"),
            )
            .join(project_contributions, User.id == project_contributions.c.user_id)
            .outerjoin(mapped_stmt, User.id == mapped_stmt.c.mapped_by)
            .outerjoin(badimagery_stmt, User.id == badimagery_stmt.c.mapped_by)
            .outerjoin(validated_stmt, User.id == validated_stmt.c.validated_by)
            .group_by(
                User.id,
                User.username,
                User.name,
                User.mapping_level,
                User.picture_url,
                User.date_registered,
                mapped_stmt.c.count,
                mapped_stmt.c.task_ids,
                badimagery_stmt.c.count,
                badimagery_stmt.c.task_ids,
                validated_stmt.c.count,
                validated_stmt.c.task_ids,
            )
            .order_by(desc("total"))
            .all()
        )

        contrib_dto = ProjectContributionsDTO()
        user_contributions = [
            UserContribution(
                dict(
                    username=r.username,
                    name=r.name,
                    mapping_level=MappingLevel(r.mapping_level).name,
                    picture_url=r.picture_url,
                    mapped=r.mapped,
                    bad_imagery=r.bad_imagery,
                    validated=r.validated,
                    total=r.total,
                    mapped_tasks=r.mapped_tasks if r.mapped_tasks is not None else [],
                    bad_imagery_tasks=r.bad_imagery_tasks
                    if r.bad_imagery_tasks
                    else [],
                    validated_tasks=r.validated_tasks
                    if r.validated_tasks is not None
                    else [],
                    date_registered=r.date_registered.date(),
                )
            )
            for r in results
        ]
        contrib_dto.user_contributions = user_contributions

        return contrib_dto

    @staticmethod
    @cached(homepage_stats_cache)
    def get_homepage_stats(abbrev=True) -> HomePageStatsDTO:
        """Get overall TM stats to give community a feel for progress that's being made"""
        dto = HomePageStatsDTO()
        dto.total_projects = Project.query.with_entities(
            func.count(Project.id)
        ).scalar()
        dto.mappers_online = (
            Task.query.with_entities(func.count(Task.locked_by.distinct()))
            .filter(Task.locked_by.isnot(None))
            .scalar()
        )
        dto.total_mappers = User.query.with_entities(func.count(User.id)).scalar()
        dto.tasks_mapped = (
            Task.query.with_entities(func.count())
            .filter(
                Task.task_status.in_(
                    (TaskStatus.MAPPED.value, TaskStatus.VALIDATED.value)
                )
            )
            .scalar()
        )
        if not abbrev:
            dto.total_validators = (
                Task.query.filter(Task.task_status == TaskStatus.VALIDATED.value)
                .distinct(Task.validated_by)
                .count()
            )
            dto.tasks_validated = Task.query.filter(
                Task.task_status == TaskStatus.VALIDATED.value
            ).count()

            dto.total_area = Project.query.with_entities(
                func.coalesce(func.sum(func.ST_Area(Project.geometry, True) / 1000000))
            ).scalar()

            dto.total_mapped_area = (
                Task.query.with_entities(
                    func.coalesce(func.sum(func.ST_Area(Task.geometry, True) / 1000000))
                )
                .filter(Task.task_status == TaskStatus.MAPPED.value)
                .scalar()
            )

            dto.total_validated_area = (
                Task.query.with_entities(
                    func.coalesce(func.sum(func.ST_Area(Task.geometry, True) / 1000000))
                )
                .filter(Task.task_status == TaskStatus.VALIDATED.value)
                .scalar()
            )

            unique_campaigns = Campaign.query.with_entities(
                func.count(Campaign.id)
            ).scalar()

            linked_campaigns_count = (
                Campaign.query.join(
                    campaign_projects, Campaign.id == campaign_projects.c.campaign_id
                )
                .with_entities(
                    Campaign.name, func.count(campaign_projects.c.campaign_id)
                )
                .group_by(Campaign.id)
                .all()
            )

            subquery = (
                db.session.query(campaign_projects.c.project_id.distinct())
                .order_by(campaign_projects.c.project_id)
                .subquery()
            )
            no_campaign_count = (
                Project.query.with_entities(func.count())
                .filter(~Project.id.in_(subquery))
                .scalar()
            )
            dto.campaigns = [CampaignStatsDTO(row) for row in linked_campaigns_count]
            if no_campaign_count:
                dto.campaigns.append(
                    CampaignStatsDTO(("Unassociated", no_campaign_count))
                )

            dto.total_campaigns = unique_campaigns
            unique_orgs = Organisation.query.with_entities(
                func.count(Organisation.id)
            ).scalar()

            linked_orgs_count = (
                db.session.query(Organisation.name, func.count(Project.organisation_id))
                .join(Project.organisation)
                .group_by(Organisation.id)
                .all()
            )

            subquery = (
                db.session.query(Project.organisation_id.distinct())
                .order_by(Project.organisation_id)
                .subquery()
            )
            no_org_project_count = (
                Organisation.query.with_entities(func.count())
                .filter(~Organisation.id.in_(subquery))
                .scalar()
            )
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
    def update_all_project_stats():
        projects = db.session.query(Project.id)
        for project_id in projects.all():
            StatsService.update_project_stats(project_id)

    @staticmethod
    def update_project_stats(project_id: int):
        project = ProjectService.get_project_by_id(project_id)
        tasks = Task.query.filter(Task.project_id == project_id)

        project.total_tasks = tasks.count()
        project.tasks_mapped = tasks.filter(
            Task.task_status == TaskStatus.MAPPED.value
        ).count()
        project.tasks_validated = tasks.filter(
            Task.task_status == TaskStatus.VALIDATED.value
        ).count()
        project.tasks_bad_imagery = tasks.filter(
            Task.task_status == TaskStatus.BADIMAGERY.value
        ).count()
        project.save()

    @staticmethod
    def get_all_users_statistics(start_date: date, end_date: date):
        users = User.query.filter(
            User.date_registered >= start_date,
            User.date_registered <= end_date,
        )

        stats_dto = UserStatsDTO()
        stats_dto.total = users.count()
        stats_dto.beginner = users.filter(
            User.mapping_level == MappingLevel.BEGINNER.value
        ).count()
        stats_dto.intermediate = users.filter(
            User.mapping_level == MappingLevel.INTERMEDIATE.value
        ).count()
        stats_dto.advanced = users.filter(
            User.mapping_level == MappingLevel.ADVANCED.value
        ).count()
        stats_dto.contributed = users.filter(User.projects_mapped.isnot(None)).count()
        stats_dto.email_verified = users.filter(
            User.is_email_verified.is_(True)
        ).count()

        gender_stats = GenderStatsDTO()
        gender_stats.male = users.filter(User.gender == UserGender.MALE.value).count()
        gender_stats.female = users.filter(
            User.gender == UserGender.FEMALE.value
        ).count()
        gender_stats.self_describe = users.filter(
            User.gender == UserGender.SELF_DESCRIBE.value
        ).count()
        gender_stats.prefer_not = users.filter(
            User.gender == UserGender.PREFER_NOT.value
        ).count()

        stats_dto.genders = gender_stats
        return stats_dto

    @staticmethod
    def set_task_stats(result_row):
        date_dto = TaskStats(
            {
                "date": result_row[0],
                "mapped": result_row[1],
                "validated": result_row[2],
                "bad_imagery": result_row[3],
            }
        )
        return date_dto

    @staticmethod
    def get_task_stats(
        start_date, end_date, org_id, org_name, campaign, project_id, country
    ):
        """Creates tasks stats for a period using the TaskStatsDTO"""

        query = (
            db.session.query(
                TaskHistory.task_id,
                TaskHistory.project_id,
                TaskHistory.action_text,
                func.DATE(TaskHistory.action_date).label("day"),
            )
            .distinct(
                TaskHistory.project_id, TaskHistory.task_id, TaskHistory.action_text
            )
            .filter(
                TaskHistory.action == "STATE_CHANGE",
                or_(
                    TaskHistory.action_text == "MAPPED",
                    TaskHistory.action_text == "VALIDATED",
                    TaskHistory.action_text == "BADIMAGERY",
                ),
            )
            .order_by(
                TaskHistory.project_id,
                TaskHistory.task_id,
                TaskHistory.action_text,
                TaskHistory.action_date,
            )
        )

        if org_id:
            query = query.join(Project, Project.id == TaskHistory.project_id).filter(
                Project.organisation_id == org_id
            )
        if org_name:
            try:
                organisation_id = OrganisationService.get_organisation_by_name(
                    org_name
                ).id
            except NotFound:
                organisation_id = None
            query = query.join(Project, Project.id == TaskHistory.project_id).filter(
                Project.organisation_id == organisation_id
            )
        if campaign:
            try:
                campaign_id = CampaignService.get_campaign_by_name(campaign).id
            except NotFound:
                campaign_id = None
            query = query.join(
                campaign_projects,
                campaign_projects.c.project_id == TaskHistory.project_id,
            ).filter(campaign_projects.c.campaign_id == campaign_id)
        if project_id:
            query = query.filter(TaskHistory.project_id.in_(project_id))
        if country:
            # Unnest country column array.
            sq = Project.query.with_entities(
                Project.id, func.unnest(Project.country).label("country")
            ).subquery()

            query = query.filter(sq.c.country.ilike("%{}%".format(country))).filter(
                TaskHistory.project_id == sq.c.id
            )

        query = query.subquery()

        date_query = db.session.query(
            func.DATE(
                func.generate_series(start_date, end_date, timedelta(days=1))
            ).label("d_day")
        ).subquery()

        grouped_dates = (
            db.session.query(
                date_query.c.d_day,
                query.c.action_text,
                func.count(query.c.action_text).label("cnt"),
            )
            .join(date_query, date_query.c.d_day == query.c.day)
            .group_by(date_query.c.d_day, query.c.action_text)
            .order_by(date_query.c.d_day)
        ).subquery()

        mapped = (
            db.session.query(
                grouped_dates.c.d_day, grouped_dates.c.action_text, grouped_dates.c.cnt
            )
            .select_from(grouped_dates)
            .filter(grouped_dates.c.action_text == "MAPPED")
            .subquery()
        )
        validated = (
            db.session.query(
                grouped_dates.c.d_day, grouped_dates.c.action_text, grouped_dates.c.cnt
            )
            .select_from(grouped_dates)
            .filter(grouped_dates.c.action_text == "VALIDATED")
            .subquery()
        )
        badimagery = (
            db.session.query(
                grouped_dates.c.d_day, grouped_dates.c.action_text, grouped_dates.c.cnt
            )
            .select_from(grouped_dates)
            .filter(grouped_dates.c.action_text == "BADIMAGERY")
            .subquery()
        )

        result = (
            db.session.query(
                func.to_char(grouped_dates.c.d_day, "YYYY-MM-DD"),
                func.coalesce(mapped.c.cnt, 0).label("mapped"),
                func.coalesce(validated.c.cnt, 0).label("validated"),
                func.coalesce(badimagery.c.cnt, 0).label("badimagery"),
            )
            .select_from(grouped_dates)
            .distinct(grouped_dates.c.d_day)
            .filter(grouped_dates.c.d_day is not None)
            .outerjoin(mapped, mapped.c.d_day == grouped_dates.c.d_day)
            .outerjoin(validated, validated.c.d_day == grouped_dates.c.d_day)
            .outerjoin(badimagery, badimagery.c.d_day == grouped_dates.c.d_day)
        )

        day_stats_dto = list(map(StatsService.set_task_stats, result))

        results_dto = TaskStatsDTO()
        results_dto.stats = day_stats_dto

        return results_dto
