from cachetools import TTLCache, cached

from sqlalchemy import func, text, desc, cast, extract, or_
from sqlalchemy.types import Time
from server import db
from server.models.dtos.stats_dto import (
    ProjectContributionsDTO,
    UserContribution,
    Pagination,
    TaskHistoryDTO,
    TaskStatusDTO,
    ProjectActivityDTO,
    ProjectLastActivityDTO,
    HomePageStatsDTO,
    OrganizationStatsDTO,
    CampaignStatsDTO,
)

from server.models.dtos.project_dto import ProjectSearchResultsDTO
from server.models.postgis.project import Project
from server.models.postgis.statuses import TaskStatus
from server.models.postgis.task import TaskHistory, User, Task, TaskAction
from server.models.postgis.utils import timestamp, NotFound
from server.services.project_service import ProjectService
from server.services.project_search_service import ProjectSearchService
from server.services.users.user_service import UserService

from datetime import date, timedelta

homepage_stats_cache = TTLCache(maxsize=4, ttl=30)


class StatsService:
    @staticmethod
    def update_stats_after_task_state_change(
        project_id: int,
        user_id: int,
        last_state: TaskStatus,
        new_state: TaskStatus,
        action="change",
    ):
        """ Update stats when a task has had a state change """

        if new_state in [
            TaskStatus.READY,
            TaskStatus.LOCKED_FOR_VALIDATION,
            TaskStatus.LOCKED_FOR_MAPPING,
        ]:
            return  # No stats to record for these states

        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        StatsService._update_tasks_stats(project, user, last_state, new_state, action)
        UserService.upsert_mapped_projects(user_id, project_id)
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

    @staticmethod
    def get_latest_activity(project_id: int, page: int) -> ProjectActivityDTO:
        """ Gets all the activity on a project """

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
                TaskHistory.project_id == project_id, TaskHistory.action != "COMMENT"
            )
            .order_by(TaskHistory.action_date.desc())
            .paginate(page, 10, True)
        )

        if results.total == 0:
            raise NotFound()

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
        """ Get all projects ordered by task_history """
        rate_func = func.count(TaskHistory.user_id) / extract(
            "epoch", func.sum(cast(TaskHistory.action_date, Time))
        )

        query = TaskHistory.query.with_entities(
            TaskHistory.project_id.label("id"), rate_func.label("rate")
        )
        # Implement filters.
        query = (
            query.filter(TaskHistory.action_date >= date.today() - timedelta(days=90))
            .filter(
                or_(
                    TaskHistory.action == TaskAction.LOCKED_FOR_MAPPING.name,
                    TaskHistory.action == TaskAction.LOCKED_FOR_VALIDATION.name,
                )
            )
            .filter(TaskHistory.action_text is not None)
            .filter(TaskHistory.action_text != "")
        )
        # Group by and order by.
        sq = (
            query.group_by(TaskHistory.project_id)
            .order_by(desc("rate"))
            .limit(10)
            .subquery()
        )

        projects_query = ProjectSearchService.create_search_query()
        projects = projects_query.filter(Project.id == sq.c.id)

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
        """ Gets the last activity for a project's tasks """

        results = (
            db.session.query(
                Task.id,
                Task.project_id,
                Task.task_status,
                Task.locked_by,
                Task.mapped_by,
                Task.validated_by,
            )
            .filter(Task.project_id == project_id)
            .order_by(Task.id.asc())
        )

        last_activity_dto = ProjectLastActivityDTO()

        for item in results:
            latest = TaskStatusDTO()
            latest.task_id = item.id
            latest.task_status = TaskStatus(item.task_status).name
            latest_activity = (
                db.session.query(TaskHistory.action_date, User.username)
                .join(User)
                .filter(
                    TaskHistory.task_id == item.id,
                    TaskHistory.project_id == project_id,
                    User.id == TaskHistory.user_id,
                )
                .order_by(TaskHistory.id.desc())
                .first()
            )
            if latest_activity:
                latest.action_date = latest_activity[0]
                latest.action_by = latest_activity[1]
            last_activity_dto.activity.append(latest)

        return last_activity_dto

    @staticmethod
    def get_user_contributions(project_id: int) -> ProjectContributionsDTO:
        """ Get all user contributions on a project"""
        contrib_query = """select m.mapped_by, m.username, m.mapped, v.validated_by, v.username, v.validated
                             from (select t.mapped_by, u.username, count(t.mapped_by) mapped
                                     from tasks t,
                                          users u
                                    where t.mapped_by = u.id
                                      and t.project_id = :project_id
                                      and t.mapped_by is not null
                                    group by t.mapped_by, u.username) m FULL OUTER JOIN
                                  (select t.validated_by, u.username, count(t.validated_by) validated
                                     from tasks t,
                                          users u
                                    where t.validated_by = u.id
                                      and t.project_id = :project_id
                                      and t.validated_by is not null
                                    group by t.validated_by, u.username) v
                                       ON m.mapped_by = v.validated_by
        """

        results = db.engine.execute(text(contrib_query), project_id=project_id)
        if results.rowcount == 0:
            raise NotFound()

        contrib_dto = ProjectContributionsDTO()
        for row in results:
            # user_id = row[0] or row[3]
            user_contrib = UserContribution()
            user_contrib.username = row[1] if row[1] else row[4]
            user_contrib.mapped = row[2] if row[2] else 0
            user_contrib.validated = row[5] if row[5] else 0
            contrib_dto.user_contributions.append(user_contrib)
        return contrib_dto

    @staticmethod
    @cached(homepage_stats_cache)
    def get_homepage_stats() -> HomePageStatsDTO:
        """ Get overall TM stats to give community a feel for progress that's being made """
        dto = HomePageStatsDTO()

        dto.total_projects = Project.query.count()
        dto.mappers_online = (
            Task.query.filter(Task.locked_by is not None)
            .distinct(Task.locked_by)
            .count()
        )
        dto.total_mappers = User.query.count()
        dto.total_validators = (
            Task.query.filter(Task.task_status == TaskStatus.VALIDATED.value)
            .distinct(Task.validated_by)
            .count()
        )
        dto.tasks_mapped = Task.query.filter(
            Task.task_status.in_((TaskStatus.MAPPED.value, TaskStatus.VALIDATED.value))
        ).count()
        dto.tasks_validated = Task.query.filter(
            Task.task_status == TaskStatus.VALIDATED.value
        ).count()

        total_area_sql = """select coalesce(sum(ST_Area(geometry,true)/1000000),0) as sum
                              from public.projects as area"""
        total_area_result = db.engine.execute(total_area_sql)

        dto.total_area = total_area_result.fetchone()["sum"]

        tasks_mapped_sql = """select coalesce(sum(ST_Area(geometry, true)/1000000), 0) as sum from public.tasks
                             where task_status = :task_status"""
        tasks_mapped_result = db.engine.execute(
            text(tasks_mapped_sql), task_status=TaskStatus.MAPPED.value
        )

        dto.total_mapped_area = tasks_mapped_result.fetchone()["sum"]

        tasks_validated_sql = """select coalesce(sum(ST_Area(geometry, true)/1000000), 0) as sum from public.tasks
                                 where task_status = :task_status"""
        tasks_validated_result = db.engine.execute(
            text(tasks_validated_sql), task_status=TaskStatus.VALIDATED.value
        )

        dto.total_validated_area = tasks_validated_result.fetchone()["sum"]

        unique_campaigns_sql = "select count(name) as sum from Campaign"

        unique_campaigns = db.engine.execute(unique_campaigns_sql).fetchone()["sum"]

        linked_campaigns_sql = "select Campaign.name, count(campaign_projects.campaign_id) from Campaign INNER JOIN campaign_projects\
            ON Campaign.id=campaign_projects.campaign_id group by Campaign.id"

        linked_campaigns_count = db.engine.execute(linked_campaigns_sql).fetchall()

        no_campaign_count_sql = "select count(*) as project_count from projects where id not in \
            (select distinct project_id from campaign_projects order by project_id)"
        no_campaign_count = db.engine.execute(no_campaign_count_sql).fetchone()[
            "project_count"
        ]

        for tup in linked_campaigns_count:
            campaign_stats = CampaignStatsDTO(tup)
            dto.campaigns.append(campaign_stats)

        if no_campaign_count:
            no_campaign_proj = CampaignStatsDTO(("Unassociated", no_campaign_count))
            dto.campaigns.append(no_campaign_proj)

        dto.total_campaigns = unique_campaigns

        unique_orgs_sql = "select count(name) as sum from organisations"
        unique_orgs = db.engine.execute(unique_orgs_sql).fetchone()["sum"]

        linked_orgs_sql = "select organisations.name, count(projects.organisation_id) from projects INNER JOIN organisations\
            ON organisations.id=projects.organisation_id group by organisations.id"
        linked_orgs_count = db.engine.execute(linked_orgs_sql).fetchall()

        no_org_project_count = 0
        no_org_project_count_sql = "select count(*) as project_count from organisations where id not in \
            (select distinct organisation_id from projects order by organisation_id)"
        no_org_project_count = db.engine.execute(no_org_project_count_sql).fetchone()[
            "project_count"
        ]

        for tup in linked_orgs_count:
            org_stats = OrganizationStatsDTO(tup)
            dto.organizations.append(org_stats)

        if no_org_project_count:
            no_org_proj = OrganizationStatsDTO(("Unassociated", no_org_project_count))
            dto.organizations.append(no_org_proj)

        dto.total_organizations = unique_orgs

        return dto
