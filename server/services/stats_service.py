from server import db
from server.models.dtos.stats_dto import ProjectContributionsDTO, UserContribution
from server.models.postgis.statuses import TaskStatus
from server.models.postgis.utils import timestamp, NotFound
from server.services.project_service import ProjectService
from server.services.user_service import UserService


class StatsService:

    @staticmethod
    def update_stats_after_task_state_change(project_id: int, user_id: int, task_status: TaskStatus):
        """ Update stats when a task has had a state change """
        if task_status in [TaskStatus.BADIMAGERY, TaskStatus.READY, TaskStatus.LOCKED_FOR_VALIDATION,
                           TaskStatus.LOCKED_FOR_MAPPING]:
            return  # No stats to record for these states

        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        if task_status == TaskStatus.MAPPED:
            project.tasks_mapped += 1
            user.tasks_mapped += 1
        elif task_status == TaskStatus.INVALIDATED:
            user.tasks_invalidated += 1
        elif task_status == TaskStatus.VALIDATED:
            project.tasks_validated += 1
            user.tasks_validated += 1

        project.last_updated = timestamp()
        project.save()  # Will also save user changes, as using same session

        return project, user

    @staticmethod
    def get_user_contributions(project_id: int):
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
            user_contrib = UserContribution()
            user_contrib.username = row[1] if row[1] else row[4]
            user_contrib.mapped = row[2] if row[2] else 0
            user_contrib.validated = row[5] if row[5] else 0

            contrib_dto.user_contributions.append(user_contrib)

        return contrib_dto
