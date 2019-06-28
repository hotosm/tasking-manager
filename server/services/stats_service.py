from cachetools import TTLCache, cached
from sqlalchemy import func, text, or_
from sqlalchemy.orm import aliased
from flask import current_app

from server import db
from server.models.dtos.stats_dto import (
    ProjectContributionsDTO, UserContribution, Pagination, TaskHistoryDTO,
    ProjectActivityDTO, ProjectOverviewDTO, TaskOverviewDTO, HomePageStatsDTO,
    OrganizationStatsDTO, CampaignStatsDTO
    )

from server.models.postgis.project import Project
from server.models.postgis.statuses import ProjectStatus, TaskStatus
from server.models.postgis.task import TaskHistory, User, Task
from server.models.postgis.project_info import ProjectInfo
from server.models.postgis.utils import timestamp, NotFound
from server.services.project_service import ProjectService
from server.services.users.user_service import UserService


homepage_stats_cache = TTLCache(maxsize=4, ttl=30)


class StatsService:
    @staticmethod
    def update_stats_after_task_state_change(project_id: int, user_id: int, new_state: TaskStatus, task_id: int):
        """ Update stats when a task has had a state change """
        if new_state in [TaskStatus.READY, TaskStatus.LOCKED_FOR_VALIDATION, TaskStatus.LOCKED_FOR_MAPPING]:
            return  # No stats to record for these states

        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        if new_state == TaskStatus.MAPPED:
            StatsService._set_counters_after_mapping(project, user)
        elif new_state == TaskStatus.INVALIDATED:
            StatsService._set_counters_after_invalidated(task_id, project, user)
        elif new_state == TaskStatus.VALIDATED:
            StatsService._set_counters_after_validated(task_id, project, user)
        elif new_state == TaskStatus.BADIMAGERY:
            StatsService._set_counters_after_bad_imagery(project)

        UserService.upsert_mapped_projects(user_id, project_id)
        project.last_updated = timestamp()

        # Transaction will be saved when task is saved
        return project, user

    @staticmethod
    def _set_counters_after_mapping(project: Project, user: User):
        """ Set counters after user has mapped a task """
        project.tasks_mapped += 1
        user.tasks_mapped += 1

    @staticmethod
    def _set_counters_after_validated(task_id: int, project: Project, user: User):
        """ Set counters after user has validated a task """
        project.tasks_validated += 1
        user.tasks_validated += 1

        # If user is setting a task that wasn't fully mapped to valid, we need to also give
        # mapping credit since we wouldn't have before. Otherwise, if this validation is
        # undone or subsequently invalidated, the stats will be skewed as mapping credit will
        # be taken away despite never being awarded
        last_state = TaskHistory.get_last_status(project.id, task_id)
        if last_state == TaskStatus.BADIMAGERY:
            project.tasks_mapped += 1
            project.tasks_bad_imagery -= 1

    @staticmethod
    def _set_counters_after_bad_imagery(project: Project):
        """ Set counters after user has marked a task as Bad Imagery """
        project.tasks_bad_imagery += 1

    @staticmethod
    def set_counters_after_undo(project_id: int, user_id: int, current_state: TaskStatus, undo_state: TaskStatus):
        """ Resets counters after a user undoes their task"""
        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        # This is best endeavours to reset the stats and may have missed some edge cases, hopefully majority of
        # cases will be Mapped to Ready
        if current_state == TaskStatus.MAPPED and undo_state == TaskStatus.READY:
            project.tasks_mapped -= 1
            user.tasks_mapped -= 1
        if current_state == TaskStatus.MAPPED and undo_state == TaskStatus.INVALIDATED:
            user.tasks_mapped -= 1
            project.tasks_mapped -= 1
        elif current_state == TaskStatus.BADIMAGERY and undo_state == TaskStatus.READY:
            project.tasks_bad_imagery -= 1
        elif current_state == TaskStatus.BADIMAGERY and undo_state == TaskStatus.MAPPED:
            project.tasks_mapped += 1
            project.tasks_bad_imagery -= 1
        elif current_state == TaskStatus.BADIMAGERY and undo_state == TaskStatus.INVALIDATED:
            project.tasks_bad_imagery -= 1
        elif current_state == TaskStatus.BADIMAGERY and undo_state == TaskStatus.VALIDATED:
            project.tasks_bad_imagery -= 1
            project.tasks_validated += 1
            project.tasks_mapped += 1 # award mapping credit if validated
        elif current_state == TaskStatus.INVALIDATED and undo_state == TaskStatus.MAPPED:
            user.tasks_invalidated -= 1
            project.tasks_mapped += 1
        elif current_state == TaskStatus.INVALIDATED and undo_state == TaskStatus.VALIDATED:
            user.tasks_invalidated -= 1
            project.tasks_validated += 1
            project.tasks_mapped += 1
        elif current_state == TaskStatus.VALIDATED and undo_state == TaskStatus.MAPPED:
            user.tasks_validated -= 1
            project.tasks_validated -= 1
        elif current_state == TaskStatus.VALIDATED and undo_state == TaskStatus.BADIMAGERY:
            user.tasks_validated -= 1
            project.tasks_validated -= 1
            project.tasks_mapped -= 1
            project.tasks_bad_imagery += 1

    @staticmethod
    def _set_counters_after_invalidated(task_id: int, project: Project, user: User):
        """ Set counters after user has validated a task """

        last_state = TaskHistory.get_last_status(project.id, task_id)

        if last_state == TaskStatus.BADIMAGERY:
            project.tasks_bad_imagery -= 1
        elif last_state == TaskStatus.MAPPED:
            project.tasks_mapped -= 1
        elif last_state == TaskStatus.VALIDATED:
            project.tasks_mapped -= 1
            project.tasks_validated -= 1

        user.tasks_invalidated += 1

    @staticmethod
    def get_latest_overview(project_id: int, locale='en', page=1, page_size=10, sort_by=None, sort_direction=None, mapper_name=None, validator_name=None, status=None, project_name=None, all_results=False) -> ProjectOverviewDTO:
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
        latest_history_id = (db.session.query(latest_history.id) \
                                       .filter(latest_history.task_id == Task.id) \
                                       .filter(latest_history.project_id == Task.project_id) \
                                       .order_by(latest_history.action_date.desc()) \
                                       .order_by(latest_history.id.desc()) \
                                       .limit(1) \
                                       .correlate(Task) \
                                       .as_scalar())

        query = db.session.query(Task.id, Task.project_id, Task.task_status, \
                                 mapper.username.label("mapper_name"), validator.username.label("validator_name"), \
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

        overview_dto = ProjectOverviewDTO()
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

            overview_dto.tasks.append(task)

        overview_dto.pagination = Pagination(paginated_results) if paginated_results else None
        return overview_dto


    @staticmethod
    def get_latest_activity(project_id: int, locale='en', page=1, page_size=10, sort_by=None, sort_direction=None, username=None, status=None, project_name=None) -> ProjectActivityDTO:
        """ Gets all the activity on a project """
        sort_column = None if not sort_by else TaskHistory.__table__.columns.get(sort_by)
        if sort_column is None:
            sort_column = TaskHistory.action_date

        if sort_direction is not None and sort_direction.lower() == "asc":
            sort_column = sort_column.asc()
        else:
            sort_column = sort_column.desc()
        sort_column = sort_column.nullslast()

        relevant_actions = ('STATE_CHANGE', 'LOCKED_FOR_MAPPING', 'LOCKED_FOR_VALIDATION')

        query = db.session.query(TaskHistory.id, TaskHistory.project_id, TaskHistory.task_id, TaskHistory.action,
                                 TaskHistory.action_date, TaskHistory.action_text, User.username) \
                          .join(User) \
                          .filter(TaskHistory.action.in_(relevant_actions))

        if project_id is not None:
            query = query.filter(TaskHistory.project_id == project_id)
        else:
            # Include project name. Ignore draft and archived projects
            query = query.join(Project, TaskHistory.project_id == Project.id) \
                         .filter(Project.status == ProjectStatus.PUBLISHED.value) \
                         .add_columns(ProjectInfo.name.label('project_title')) \
                         .filter(Project.id == ProjectInfo.project_id) \
                         .filter(ProjectInfo.locale.in_([locale, 'en'])) \

            if project_name is not None:
                query = query.filter(ProjectInfo.name.ilike('%' + project_name.lower() + '%'))

        if username is not None:
            query = query.filter(User.username.ilike(username.lower() + '%'))

        if status is not None:
            if status == TaskStatus.LOCKED_FOR_MAPPING.value:
                query = query.filter(TaskHistory.action == 'LOCKED_FOR_MAPPING')
            elif status == TaskStatus.LOCKED_FOR_VALIDATION.value:
                query = query.filter(TaskHistory.action == 'LOCKED_FOR_VALIDATION')
            elif status == TaskStatus.MAPPED.value:
                query = query.filter(TaskHistory.action == 'STATE_CHANGE', TaskHistory.action_text == 'MAPPED')
            elif status == TaskStatus.VALIDATED.value:
                query = query.filter(TaskHistory.action == 'STATE_CHANGE', TaskHistory.action_text == 'VALIDATED')
            elif status == TaskStatus.INVALIDATED.value:
                query = query.filter(TaskHistory.action == 'STATE_CHANGE', TaskHistory.action_text == 'INVALIDATED')
            elif status == TaskStatus.BADIMAGERY.value:
                query = query.filter(TaskHistory.action == 'STATE_CHANGE', TaskHistory.action_text == 'BADIMAGERY')

        results = query.order_by(sort_column).paginate(page, page_size, True)
        if results.total == 0:
            raise NotFound()

        activity_dto = ProjectActivityDTO()
        for item in results.items:
            history = TaskHistoryDTO()
            history.history_id = item.id
            history.project_id = item.project_id
            if 'project_title' in item.keys():
                history.project_title = item.project_title

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
        contrib_query = '''select m.mapped_by, m.username, m.mapped, v.validated_by, v.username, v.validated
                             from (select t.mapped_by, u.username, count(t.mapped_by) mapped
                                     from tasks t,
                                          users u
                                    where t.mapped_by = u.id
                                      and t.project_id = {0}
                                      and t.mapped_by is not null
                                    group by t.mapped_by, u.username) m FULL OUTER JOIN
                                  (select t.validated_by, u.username, count(t.validated_by) validated
                                     from tasks t,
                                          users u
                                    where t.validated_by = u.id
                                      and t.project_id = {0}
                                      and t.validated_by is not null
                                    group by t.validated_by, u.username) v
                                       ON m.mapped_by = v.validated_by
        '''.format(project_id)

        results = db.engine.execute(contrib_query)
        if results.rowcount == 0:
            raise NotFound()

        contrib_dto = ProjectContributionsDTO()
        for row in results:
            if row[0]:
                user_contrib = UserContribution()
                user_contrib.username = row[1] if row[1] else row[4]
                user_contrib.mapped = row[2] if row[2] else 0
                user_contrib.validated = row[5] if row[5] else 0
                user_contrib.total_time_spent = 0
                user_contrib.time_spent_mapping = 0
                user_contrib.time_spent_validating = 0

                sql = """SELECT SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME) FROM task_history
                        WHERE action='LOCKED_FOR_MAPPING'
                        and user_id = {0} and project_id = {1};""".format(row[0], project_id)
                total_mapping_time = db.engine.execute(sql)
                for time in total_mapping_time:
                    total_mapping_time = time[0]
                    if total_mapping_time:
                        user_contrib.time_spent_mapping = total_mapping_time.total_seconds()
                        user_contrib.total_time_spent += user_contrib.time_spent_mapping

                sql = """SELECT SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME) FROM task_history
                        WHERE action='LOCKED_FOR_VALIDATION'
                        and user_id = {0} and project_id = {1};""".format(row[0], project_id)
                total_validation_time = db.engine.execute(sql)
                for time in total_validation_time:
                    total_validation_time = time[0]
                    if total_validation_time:
                        user_contrib.time_spent_validating = total_validation_time.total_seconds()
                        user_contrib.total_time_spent += user_contrib.time_spent_validating

                contrib_dto.user_contributions.append(user_contrib)

        return contrib_dto

    @staticmethod
    @cached(homepage_stats_cache)
    def get_homepage_stats() -> HomePageStatsDTO:
        """ Get overall TM stats to give community a feel for progress that's being made """
        dto = HomePageStatsDTO()

        dto.total_projects = Project.query.count()
        dto.mappers_online = Task.query.filter(
            Task.locked_by is not None
            ).distinct(Task.locked_by).count()
        dto.total_mappers = User.query.count()
        dto.total_validators = Task.query.filter(
            Task.task_status == TaskStatus.VALIDATED.value
            ).distinct(Task.validated_by).count()
        dto.tasks_mapped = Task.query.filter(
            Task.task_status.in_(
                (TaskStatus.MAPPED.value, TaskStatus.VALIDATED.value)
                )
            ).count()
        dto.tasks_validated = Task.query.filter(
            Task.task_status == TaskStatus.VALIDATED.value
            ).count()

        org_proj_count = db.session.query(
            Project.organisation_tag,
            func.count(Project.organisation_tag)
        ).group_by(Project.organisation_tag).all()

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
        tasks_mapped_result = db.engine.execute(text(tasks_mapped_sql), task_status=TaskStatus.MAPPED.value)

        dto.total_mapped_area = tasks_mapped_result.fetchone()['sum']

        tasks_validated_sql = "select coalesce(sum(ST_Area(geometry)), 0) as sum from public.tasks where task_status = :task_status"
        tasks_validated_result = db.engine.execute(text(tasks_validated_sql), task_status=TaskStatus.VALIDATED.value)

        dto.total_validated_area = tasks_validated_result.fetchone()['sum']

        campaign_count = db.session.query(Project.campaign_tag, func.count(Project.campaign_tag))\
            .group_by(Project.campaign_tag).all()
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
            no_campaign_proj = CampaignStatsDTO(('Untagged', no_campaign_count))
            dto.campaigns.append(no_campaign_proj)
        dto.total_campaigns = unique_campaigns


        org_proj_count = db.session.query(Project.organisation_tag, func.count(Project.organisation_tag))\
            .group_by(Project.organisation_tag).all()
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
            no_org_proj = OrganizationStatsDTO(('Untagged', no_org_count))
            dto.organizations.append(no_org_proj)
        dto.total_organizations = unique_orgs

        return dto
