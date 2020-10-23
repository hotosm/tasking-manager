import re
import time
import datetime

from cachetools import TTLCache, cached
from typing import List
from flask import current_app
from sqlalchemy import text, func
from markdown import markdown

from backend import create_app, db
from backend.models.dtos.message_dto import MessageDTO, MessagesDTO
from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.message import Message, MessageType, NotFound
from backend.models.postgis.notification import Notification
from backend.models.postgis.project import Project
from backend.models.postgis.task import TaskStatus, TaskAction, TaskHistory
from backend.models.postgis.statuses import TeamRoles
from backend.services.messaging.smtp_service import SMTPService
from backend.services.messaging.template_service import (
    get_txt_template,
    template_var_replacing,
    clean_html,
)
from backend.services.users.user_service import UserService, User


message_cache = TTLCache(maxsize=512, ttl=30)


class MessageServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class MessageService:
    @staticmethod
    def send_welcome_message(user: User):
        """ Sends welcome message to all new users at Sign up"""
        org_code = current_app.config["ORG_CODE"]
        text_template = get_txt_template("welcome_message_en.txt")
        replace_list = [
            ["[USERNAME]", user.username],
            ["[ORG_CODE]", org_code],
            ["[ORG_NAME]", current_app.config["ORG_NAME"]],
            ["[SETTINGS_LINK]", MessageService.get_user_settings_link()],
        ]
        text_template = template_var_replacing(text_template, replace_list)

        welcome_message = Message()
        welcome_message.message_type = MessageType.SYSTEM.value
        welcome_message.to_user_id = user.id
        welcome_message.subject = "Welcome to the {} Tasking Manager".format(org_code)
        welcome_message.message = text_template
        welcome_message.save()

        return welcome_message.id

    @staticmethod
    def send_message_after_validation(
        status: int, validated_by: int, mapped_by: int, task_id: int, project_id: int
    ):
        """ Sends mapper a notification after their task has been marked valid or invalid """
        if validated_by == mapped_by:
            return  # No need to send a message to yourself

        user = UserService.get_user_by_id(mapped_by)
        text_template = get_txt_template(
            "invalidation_message_en.txt"
            if status == TaskStatus.INVALIDATED
            else "validation_message_en.txt"
        )
        status_text = (
            "marked invalid" if status == TaskStatus.INVALIDATED else "validated"
        )
        task_link = MessageService.get_task_link(project_id, task_id)
        replace_list = [
            ["[USERNAME]", user.username],
            ["[TASK_LINK]", task_link],
            ["[ORG_NAME]", current_app.config["ORG_NAME"]],
        ]
        text_template = template_var_replacing(text_template, replace_list)

        messages = []
        validation_message = Message()
        validation_message.message_type = (
            MessageType.INVALIDATION_NOTIFICATION.value
            if status == TaskStatus.INVALIDATED
            else MessageType.VALIDATION_NOTIFICATION.value
        )
        validation_message.project_id = project_id
        validation_message.task_id = task_id
        validation_message.from_user_id = validated_by
        validation_message.to_user_id = mapped_by
        validation_message.subject = (
            f"{task_link} mapped by you in Project {project_id} has been {status_text}"
        )
        validation_message.message = text_template
        messages.append(dict(message=validation_message, user=user))

        # For email alerts
        MessageService._push_messages(messages)

    @staticmethod
    def send_message_to_all_contributors(project_id: int, message_dto: MessageDTO):
        """Sends supplied message to all contributors on specified project.  Message all contributors can take
        over a minute to run, so this method is expected to be called on its own thread"""

        app = (
            create_app()
        )  # Because message-all run on background thread it needs it's own app context

        with app.app_context():
            contributors = Message.get_all_contributors(project_id)
            message_dto.message = "A message from {} managers:<br/><br/>{}".format(
                MessageService.get_project_link(project_id),
                markdown(message_dto.message, output_format="html"),
            )

            messages = []
            for contributor in contributors:
                message = Message.from_dto(contributor[0], message_dto)
                message.message_type = MessageType.BROADCAST.value
                message.project_id = project_id
                user = UserService.get_user_by_id(contributor[0])
                messages.append(dict(message=message, user=user))

            MessageService._push_messages(messages)

    @staticmethod
    def _push_messages(messages):
        if len(messages) == 0:
            return

        messages_objs = []
        for i, message in enumerate(messages):
            user = message.get("user")
            obj = message.get("message")
            # Store message in the database only if mentions option are disabled.
            if (
                user.mentions_notifications is False
                and obj.message_type == MessageType.MENTION_NOTIFICATION.value
            ):
                messages_objs.append(obj)
                continue
            if (
                user.projects_notifications is False
                and obj.message_type == MessageType.PROJECT_ACTIVITY_NOTIFICATION.value
            ):
                continue
            if (
                user.projects_notifications is False
                and obj.message_type == MessageType.BROADCAST.value
            ):
                continue
            if (
                user.teams_notifications is False
                and obj.message_type == MessageType.TEAM_BROADCAST.value
            ):
                messages_objs.append(obj)
                continue
            if user.comments_notifications is False and obj.message_type in (
                MessageType.TASK_COMMENT_NOTIFICATION.value,
                MessageType.PROJECT_CHAT_NOTIFICATION.value,
            ):
                continue
            if user.tasks_notifications is False and obj.message_type in (
                MessageType.VALIDATION_NOTIFICATION.value,
                MessageType.INVALIDATION_NOTIFICATION.value,
            ):
                messages_objs.append(obj)
                continue
            messages_objs.append(obj)

            SMTPService.send_email_alert(
                user.email_address,
                user.username,
                message["message"].id,
                UserService.get_user_by_id(message["message"].from_user_id).username,
                message["message"].project_id,
                clean_html(message["message"].subject),
                message["message"].message,
                obj.message_type,
            )

            if i + 1 % 10 == 0:
                time.sleep(0.5)

        # Flush messages to the database.
        if len(messages_objs) > 0:
            db.session.add_all(messages_objs)
            db.session.flush()
            db.session.commit()

    @staticmethod
    def send_message_after_comment(
        comment_from: int, comment: str, task_id: int, project_id: int
    ):
        """ Will send a canned message to anyone @'d in a comment """
        usernames = MessageService._parse_message_for_username(comment, project_id)
        if len(usernames) != 0:
            task_link = MessageService.get_task_link(project_id, task_id)

            messages = []
            for username in usernames:
                try:
                    user = UserService.get_user_by_username(username)
                except NotFound:
                    continue  # If we can't find the user, keep going no need to fail

                message = Message()
                message.message_type = MessageType.MENTION_NOTIFICATION.value
                message.project_id = project_id
                message.task_id = task_id
                message.from_user_id = comment_from
                message.to_user_id = user.id
                message.subject = f"You were mentioned in a comment in {task_link} of Project {project_id}"
                message.message = comment
                messages.append(dict(message=message, user=user))

            MessageService._push_messages(messages)

        # Notify all contributors except the user that created the comment.
        results = (
            TaskHistory.query.with_entities(TaskHistory.user_id.distinct())
            .filter(TaskHistory.project_id == project_id)
            .filter(TaskHistory.task_id == task_id)
            .filter(TaskHistory.user_id != comment_from)
            .filter(TaskHistory.action == TaskAction.STATE_CHANGE.name)
            .all()
        )
        contributed_users = [r[0] for r in results]

        if len(contributed_users) != 0:
            user_from = User.query.get(comment_from)
            if user_from is None:
                raise ValueError("Username not found")

            task_link = MessageService.get_task_link(project_id, task_id)
            messages = []
            for user_id in contributed_users:
                try:
                    user = UserService.get_user_dto_by_id(user_id)
                    # if user was mentioned, a message has already been sent to them,
                    # so we can skip
                    if user.username in usernames:
                        break
                except NotFound:
                    continue  # If we can't find the user, keep going no need to fail

                message = Message()
                message.message_type = MessageType.TASK_COMMENT_NOTIFICATION.value
                message.project_id = project_id
                message.from_user_id = comment_from
                message.task_id = task_id
                message.to_user_id = user.id
                message.subject = f"{user_from.username} left a comment in {task_link} of Project {project_id}"
                message.message = comment
                messages.append(dict(message=message, user=user))

            MessageService._push_messages(messages)

    @staticmethod
    def get_user_link(username: str):
        base_url = current_app.config["APP_BASE_URL"]
        return f'<a href="{base_url}/users/{username}">{username}</a>'

    @staticmethod
    def get_team_link(team_name: str, team_id: int, management: bool):
        base_url = current_app.config["APP_BASE_URL"]
        if management is True:
            return f'<a href="{base_url}/manage/teams/{team_id}/">{team_name}</a>'
        else:
            return f'<a href="{base_url}/teams/{team_id}/membership/">{team_name}</a>'

    @staticmethod
    def send_request_to_join_team(
        from_user: int, from_username: str, to_user: int, team_name: str, team_id: int
    ):
        message = Message()
        message.message_type = MessageType.REQUEST_TEAM_NOTIFICATION.value
        message.from_user_id = from_user
        message.to_user_id = to_user
        message.subject = "{} requested to join {}".format(
            MessageService.get_user_link(from_username),
            MessageService.get_team_link(team_name, team_id, True),
        )
        message.message = "{} has requested to join the {} team.\
            Access the team management page to accept or reject that request.".format(
            MessageService.get_user_link(from_username),
            MessageService.get_team_link(team_name, team_id, True),
        )
        message.add_message()
        message.save()

    @staticmethod
    def accept_reject_request_to_join_team(
        from_user: int,
        from_username: str,
        to_user: int,
        team_name: str,
        team_id: int,
        response: str,
    ):
        message = Message()
        message.message_type = MessageType.REQUEST_TEAM_NOTIFICATION.value
        message.from_user_id = from_user
        message.to_user_id = to_user
        message.subject = "Request to join {} was {}ed".format(
            MessageService.get_team_link(team_name, team_id, False), response
        )
        message.message = "{} has {}ed your request to join the {} team.".format(
            MessageService.get_user_link(from_username),
            response,
            MessageService.get_team_link(team_name, team_id, False),
        )
        message.add_message()
        message.save()

    @staticmethod
    def accept_reject_invitation_request_for_team(
        from_user: int,
        from_username: str,
        to_user: int,
        sending_member: str,
        team_name: str,
        team_id: int,
        response: str,
    ):
        message = Message()
        message.message_type = MessageType.INVITATION_NOTIFICATION.value
        message.from_user_id = from_user
        message.to_user_id = to_user
        message.subject = "{} {}ed to join {}".format(
            MessageService.get_user_link(from_username),
            response,
            MessageService.get_team_link(team_name, team_id, True),
        )
        message.message = "{} has {}ed {}'s invitation to join the {} team.".format(
            MessageService.get_user_link(from_username),
            response,
            sending_member,
            MessageService.get_team_link(team_name, team_id, True),
        )
        message.add_message()
        message.save()

    @staticmethod
    def send_invite_to_join_team(
        from_user: int, from_username: str, to_user: int, team_name: str, team_id: int
    ):
        message = Message()
        message.message_type = MessageType.INVITATION_NOTIFICATION.value
        message.from_user_id = from_user
        message.to_user_id = to_user
        message.subject = "Invitation to join {}".format(
            MessageService.get_team_link(team_name, team_id, False)
        )
        message.message = "{} has invited you to join the {} team.\
            Access the {}'s page to accept or reject that invitation.".format(
            MessageService.get_user_link(from_username),
            MessageService.get_team_link(team_name, team_id, False),
            MessageService.get_team_link(team_name, team_id, False),
        )
        message.add_message()
        message.save()

    @staticmethod
    def send_message_after_chat(chat_from: int, chat: str, project_id: int):
        """ Send alert to user if they were @'d in a chat message """
        # Because message-all run on background thread it needs it's own app context
        app = create_app()
        with app.app_context():
            usernames = MessageService._parse_message_for_username(chat, project_id)
            if len(usernames) == 0:
                return  # Nobody @'d so return

            link = MessageService.get_project_link(
                project_id, include_chat_section=True
            )

            messages = []
            for username in usernames:
                current_app.logger.debug(f"Searching for {username}")
                try:
                    user = UserService.get_user_by_username(username)
                except NotFound:
                    current_app.logger.error(f"Username {username} not found")
                    continue  # If we can't find the user, keep going no need to fail

                message = Message()
                message.message_type = MessageType.MENTION_NOTIFICATION.value
                message.project_id = project_id
                message.from_user_id = chat_from
                message.to_user_id = user.id
                message.subject = f"You were mentioned in {link} chat"
                message.message = chat
                messages.append(dict(message=message, user=user))

            MessageService._push_messages(messages)

            query = """ select user_id from project_favorites where project_id = :project_id"""
            result = db.engine.execute(text(query), project_id=project_id)
            favorited_users = [r[0] for r in result]

            if len(favorited_users) != 0:
                project_link = MessageService.get_project_link(
                    project_id, include_chat_section=True
                )
                # project_title = ProjectService.get_project_title(project_id)
                messages = []
                for user_id in favorited_users:

                    try:
                        user = UserService.get_user_dto_by_id(user_id)
                    except NotFound:
                        continue  # If we can't find the user, keep going no need to fail

                    message = Message()
                    message.message_type = MessageType.PROJECT_CHAT_NOTIFICATION.value
                    message.project_id = project_id
                    message.to_user_id = user.id
                    message.subject = f"{chat_from} left a comment in {project_link}"
                    message.message = chat
                    messages.append(dict(message=message, user=user))

                # it's important to keep that line inside the if to avoid duplicated emails
                MessageService._push_messages(messages)

    @staticmethod
    def send_favorite_project_activities(user_id: int):
        current_app.logger.debug("Sending Favorite Project Activities")
        favorited_projects = UserService.get_projects_favorited(user_id)
        contributed_projects = UserService.get_projects_mapped(user_id)
        if contributed_projects is None:
            contributed_projects = []

        for favorited_project in favorited_projects.favorited_projects:
            contributed_projects.append(favorited_project.project_id)

        recently_updated_projects = (
            Project.query.with_entities(
                Project.id, func.DATE(Project.last_updated).label("last_updated")
            )
            .filter(Project.id.in_(contributed_projects))
            .filter(
                func.DATE(Project.last_updated)
                > datetime.date.today() - datetime.timedelta(days=300)
            )
        )
        user = UserService.get_user_dto_by_id(user_id)
        messages = []
        for project in recently_updated_projects:
            activity_message = []
            query_last_active_users = """ select distinct(user_id) from
                                        (select user_id from task_history where project_id = :project_id
                                        order by action_date desc limit 15 ) t """
            last_active_users = db.engine.execute(
                text(query_last_active_users), project_id=project.id
            )

            for recent_user_id in last_active_users:
                recent_user_details = UserService.get_user_by_id(recent_user_id)
                user_profile_link = MessageService.get_user_profile_link(
                    recent_user_details.username
                )
                activity_message.append(user_profile_link)

            activity_message = str(activity_message)[1:-1]
            project_link = MessageService.get_project_link(project.id)
            message = Message()
            message.message_type = MessageType.PROJECT_ACTIVITY_NOTIFICATION.value
            message.project_id = project.id
            message.to_user_id = user.id
            message.subject = (
                "Recent activities from your contributed/favorited Projects"
            )
            message.message = (
                f"{activity_message} contributed to {project_link} recently"
            )
            messages.append(dict(message=message, user=user))

        MessageService._push_messages(messages)

    @staticmethod
    def resend_email_validation(user_id: int):
        """ Resends the email validation email to the logged in user """
        user = UserService.get_user_by_id(user_id)
        SMTPService.send_verification_email(user.email_address, user.username)

    @staticmethod
    def _get_managers(message: str, project_id: int) -> List[str]:
        parser = re.compile(r"((?<=#)\w+|\[.+?\])")
        parsed = parser.findall(message)

        project = None
        if "author" in parsed or "managers" in parsed:
            project = Project.query.get(project_id)

        if project is None:
            return []

        project_managers = [project.author.username]

        if "managers" not in parsed:
            return project_managers

        teams = [t for t in project.teams if t.role == TeamRoles.PROJECT_MANAGER.value]
        team_members = [
            [u.member.username for u in t.team.members if u.active is True]
            for t in teams
        ]

        team_members = [item for sublist in team_members for item in sublist]
        project_managers.extend(team_members)

        # Add organization managers.
        if project.organisation is not None:
            org_usernames = [u.username for u in project.organisation.managers]
            project_managers.extend(org_usernames)

        return project_managers

    @staticmethod
    def _parse_message_for_username(message: str, project_id: int) -> List[str]:
        """ Extracts all usernames from a comment looks for format @[user name] """

        parser = re.compile(r"((?<=@)\w+|\[.+?\])")

        usernames = []
        for username in parser.findall(message):
            username = username.replace("[", "", 1)
            index = username.rfind("]")
            username = username.replace("]", "", index)
            usernames.append(username)

        usernames.extend(MessageService._get_managers(message, project_id))

        usernames = list(set(usernames))
        return usernames

    @staticmethod
    @cached(message_cache)
    def has_user_new_messages(user_id: int) -> dict:
        """ Determines if the user has any unread messages """
        count = Notification.get_unread_message_count(user_id)

        new_messages = False
        if count > 0:
            new_messages = True

        return dict(newMessages=new_messages, unread=count)

    @staticmethod
    def get_all_messages(
        user_id: int,
        locale: str,
        page: int,
        page_size=10,
        sort_by=None,
        sort_direction=None,
        message_type=None,
        from_username=None,
        project=None,
        task_id=None,
        status=None,
    ):
        """ Get all messages for user """
        sort_column = Message.__table__.columns.get(sort_by)
        if sort_column is None:
            sort_column = Message.date
        sort_column = (
            sort_column.asc() if sort_direction.lower() == "asc" else sort_column.desc()
        )
        query = Message.query

        if project is not None:
            query = query.filter(Message.project_id == project)

        if task_id is not None:
            query = query.filter(Message.task_id == task_id)

        if status in ["read", "unread"]:
            query = query.filter(Message.read == (True if status == "read" else False))

        if message_type:
            message_type_filters = map(int, message_type.split(","))
            query = query.filter(Message.message_type.in_(message_type_filters))

        if from_username is not None:
            query = query.join(Message.from_user).filter(
                User.username.ilike(from_username + "%")
            )

        results = (
            query.filter(Message.to_user_id == user_id)
            .order_by(sort_column)
            .paginate(page, page_size, True)
        )
        # if results.total == 0:
        #     raise NotFound()

        messages_dto = MessagesDTO()
        for item in results.items:
            message_dto = None
            if isinstance(item, tuple):
                message_dto = item[0].as_dto()
                message_dto.project_title = item[1].name
            else:
                message_dto = item.as_dto()
                if item.project_id is not None:
                    message_dto.project_title = item.project.get_project_title(locale)

            messages_dto.user_messages.append(message_dto)

        messages_dto.pagination = Pagination(results)
        return messages_dto

    @staticmethod
    def get_message(message_id: int, user_id: int) -> Message:
        """ Gets the specified message """
        message = Message.query.get(message_id)

        if message is None:
            raise NotFound()

        if message.to_user_id != int(user_id):
            raise MessageServiceError(
                f"User {user_id} attempting to access another users message {message_id}"
            )

        return message

    @staticmethod
    def get_message_as_dto(message_id: int, user_id: int):
        """ Gets the selected message and marks it as read """
        message = MessageService.get_message(message_id, user_id)
        message.mark_as_read()
        return message.as_dto()

    @staticmethod
    def delete_message(message_id: int, user_id: int):
        """ Deletes the specified message """
        message = MessageService.get_message(message_id, user_id)
        message.delete()

    @staticmethod
    def delete_multiple_messages(message_ids: list, user_id: int):
        """ Deletes the specified messages to the user """
        Message.delete_multiple_messages(message_ids, user_id)

    @staticmethod
    def get_task_link(project_id: int, task_id: int, base_url=None) -> str:
        """ Helper method that generates a link to the task """
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]

        return f'<a href="{base_url}/projects/{project_id}/tasks/?search={task_id}">Task {task_id}</a>'

    @staticmethod
    def get_project_link(
        project_id: int, base_url=None, include_chat_section=False
    ) -> str:
        """ Helper method to generate a link to project chat"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]
        if include_chat_section:
            section = "#questionsAndComments"
        else:
            section = ""

        return f'<a href="{base_url}/projects/{project_id}{section}">Project {project_id}</a>'

    @staticmethod
    def get_user_profile_link(user_name: str, base_url=None) -> str:
        """ Helper method to generate a link to a user profile"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]

        return f'<a href="{base_url}/users/{user_name}">{user_name}</a>'

    @staticmethod
    def get_user_settings_link(section=None, base_url=None) -> str:
        """ Helper method to generate a link to a user profile"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]

        return f'<a href="{base_url}/settings#{section}">User Settings</a>'
