import datetime

from celery import Celery
from backend import db
from backend.models.postgis.task import Task, TaskHistory
from backend.models.postgis.project import Project
from backend.models.postgis.statuses import TaskStatus

# from backend.models.postgis.message import Message, MessageType
# from backend.services.messaging.message_service import MessageService
from sqlalchemy import func
from backend import create_app


celery = Celery("tasks", broker="redis://localhost:6379")
application = create_app()


@celery.task
def send_email(users, message_dto):
    with application.app_context():
        messages = []
        for user in users:
            print(user)
            if user.user_id != message_dto.from_user_id:
                message = Message.from_dto(user.user_id, message_dto)
                message.message_type = MessageType.TEAM_BROADCAST.value
                message.save()
                user = UserService.get_user_by_id(user.user_id)
                messages.append(dict(message=message, user=user))

        MessageService._push_messages(messages)


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(30, update_task_stats)
    sender.add_periodic_task(50, auto_unlock_tasks)


@celery.task
def update_task_stats():
    with application.app_context():
        print("Started updating project stats...")
        projects = db.session.query(Project.id)
        for project_id in projects.all():
            project = Project.get(project_id)
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
        print("Project stats updated")


@celery.task
def auto_unlock_tasks():
    with application.app_context():
        # Identify distinct project IDs that were touched in the last 2 hours
        query = (
            TaskHistory.query.with_entities(TaskHistory.project_id)
            .filter(
                func.DATE(TaskHistory.action_date)
                > datetime.datetime.utcnow() - datetime.timedelta(minutes=130)
            )
            .distinct()
        )
        projects = query.all()
        # For each project update task history for tasks that were not manually unlocked
        for project in projects:
            project_id = project[0]
            Task.auto_unlock_tasks(project_id)
