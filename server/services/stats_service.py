from cachetools import TTLCache, cached

from sqlalchemy import func, text
from server import db
from server.models.dtos.stats_dto import (
    ProjectContributionsDTO,
    UserContribution,
    Pagination,
    TaskHistoryDTO,
    ProjectActivityDTO,
    HomePageStatsDTO,
    OrganizationStatsDTO,
    CampaignStatsDTO,
)
from server.models.postgis.project import Project
from server.models.postgis.statuses import TaskStatus
from server.models.postgis.task import TaskHistory, User, Task
from server.models.postgis.utils import timestamp, NotFound
from server.services.project_service import ProjectService
from server.services.users.user_service import UserService


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

        project, user = StatsService._update_tasks_stats(
            project, user, last_state, new_state, action
        )
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
            history.history_id = item.id
            history.task_id = item.task_id
            history.action = item.action
            history.action_text = item.action_text
            history.action_date = item.action_date
            history.action_by = item.username
            activity_dto.activity.append(history)

        activity_dto.pagination = Pagination(results)
        return activity_dto

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
            user_id = row[0] or row[3]
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

        org_proj_count = (
            db.session.query(
                Project.organisation_tag, func.count(Project.organisation_tag)
            )
            .group_by(Project.organisation_tag)
            .all()
        )

        untagged_count = 0

        # total_area = 0

        # dto.total_area = 0

        # total_area_sql = """select sum(ST_Area(geometry)) from public.projects as area"""

        # total_area_result = db.engine.execute(total_area_sql)
        # current_app.logger.debug(total_area_result)
        # for rowproxy in total_area_result:
        # rowproxy.items() returns an array like [(key0, value0), (key1, value1)]
        # for tup in rowproxy.items():
        # total_area += tup[1]
        # current_app.logger.debug(total_area)
        # dto.total_area = total_area

        tasks_mapped_sql = "select coalesce(sum(ST_Area(geometry)), 0) as sum from public.tasks where task_status = :task_status"
        tasks_mapped_result = db.engine.execute(
            text(tasks_mapped_sql), task_status=TaskStatus.MAPPED.value
        )

        dto.total_mapped_area = tasks_mapped_result.fetchone()["sum"]

        tasks_validated_sql = "select coalesce(sum(ST_Area(geometry)), 0) as sum from public.tasks where task_status = :task_status"
        tasks_validated_result = db.engine.execute(
            text(tasks_validated_sql), task_status=TaskStatus.VALIDATED.value
        )

        dto.total_validated_area = tasks_validated_result.fetchone()["sum"]

        campaign_count = (
            db.session.query(Project.campaign_tag, func.count(Project.campaign_tag))
            .group_by(Project.campaign_tag)
            .all()
        )
        no_campaign_count = 0
        unique_campaigns = 0

        for tup in campaign_count:
            campaign_stats = CampaignStatsDTO(tup)
            if campaign_stats.tag:
                dto.campaigns.append(campaign_stats)
                unique_campaigns += 1
            else:
                no_campaign_count += campaign_stats.projects_created

        if no_campaign_count:
            no_campaign_proj = CampaignStatsDTO(("Untagged", no_campaign_count))
            dto.campaigns.append(no_campaign_proj)
        dto.total_campaigns = unique_campaigns

        org_proj_count = (
            db.session.query(
                Project.organisation_tag, func.count(Project.organisation_tag)
            )
            .group_by(Project.organisation_tag)
            .all()
        )
        no_org_count = 0
        unique_orgs = 0

        for tup in org_proj_count:
            org_stats = OrganizationStatsDTO(tup)
            if org_stats.tag:
                dto.organizations.append(org_stats)
                unique_orgs += 1
            else:
                no_org_count += org_stats.projects_created

        if no_org_count:
            no_org_proj = OrganizationStatsDTO(("Untagged", no_org_count))
            dto.organizations.append(no_org_proj)
        dto.total_organizations = unique_orgs

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
