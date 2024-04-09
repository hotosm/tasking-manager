import re
import time
import datetime
import bleach

from cachetools import TTLCache, cached
from typing import List
from flask import current_app
from sqlalchemy import text, func
from markdown import markdown

from backend import db, create_app
from backend.exceptions import NotFound
from backend.models.dtos.message_dto import MessageDTO, MessagesDTO
from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.message import Message, MessageType
from backend.models.postgis.notification import Notification
from backend.models.postgis.project import Project, ProjectInfo
from backend.models.postgis.task import TaskStatus, TaskAction, TaskHistory
from backend.models.postgis.statuses import TeamRoles
from backend.services.messaging.smtp_service import SMTPService
from backend.services.messaging.template_service import (
    get_template,
    get_txt_template,
    template_var_replacing,
    clean_html,
)
from backend.services.organisation_service import OrganisationService
from backend.services.users.user_service import UserService, User


message_cache = TTLCache(maxsize=512, ttl=30)


class MessageServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class MessageService:
    @staticmethod
    def send_welcome_message(user: User):
        """Sends welcome message to new user at Sign up"""
        org_code = current_app.config["ORG_CODE"]
        text_template = get_txt_template("welcome_message_en.txt")
        hot_welcome_section = get_txt_template("hot_welcome_section_en.txt")
        replace_list = [
            ["[USERNAME]", user.username],
            ["[ORG_CODE]", org_code],
            ["[ORG_NAME]", current_app.config["ORG_NAME"]],
            ["[SETTINGS_LINK]", MessageService.get_user_settings_link()],
            ["[HOT_WELCOME]", hot_welcome_section if org_code == "HOT" else ""],
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
        """Sends mapper a notification after their task has been marked valid or invalid"""
        if validated_by == mapped_by:
            return  # No need to send a notification if you've verified your own task
        project = Project.get(project_id)
        project_name = ProjectInfo.get_dto_for_locale(
            project_id, project.default_locale
        ).name
        user = UserService.get_user_by_id(mapped_by)
        text_template = get_txt_template(
            "invalidation_message_en.txt"
            if status == TaskStatus.INVALIDATED
            else "validation_message_en.txt"
        )
        status_text = (
            "marked invalid" if status == TaskStatus.INVALIDATED else "validated"
        )
        task_link = MessageService.get_task_link(project_id, task_id, highlight=True)
        project_link = MessageService.get_project_link(project_id, project_name)

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
            f"{task_link} mapped by you in Project "
            + f"{project_link} has been {status_text}"
        )
        validation_message.message = text_template
        messages.append(
            dict(message=validation_message, user=user, project_name=project_name)
        )

        # For email alerts
        MessageService._push_messages(messages)

    @staticmethod
    def send_message_to_all_contributors(project_id: int, message_dto: MessageDTO):
        """Sends supplied message to all contributors on specified project.  Message all contributors can take
        over a minute to run, so this method is expected to be called on its own thread
        """

        app = (
            create_app()
        )  # Because message-all run on background thread it needs it's own app context

        with app.app_context():
            contributors = Message.get_all_contributors(project_id)
            project = Project.get(project_id)
            project_name = ProjectInfo.get_dto_for_locale(
                project_id, project.default_locale
            ).name
            message_dto.message = "A message from {} managers:<br/><br/>{}".format(
                MessageService.get_project_link(
                    project_id, project_name, highlight=True
                ),
                markdown(message_dto.message, output_format="html"),
            )

            messages = []
            for contributor in contributors:
                message = Message.from_dto(contributor[0], message_dto)
                message.message_type = MessageType.BROADCAST.value
                message.project_id = project_id
                user = UserService.get_user_by_id(contributor[0])
                messages.append(
                    dict(message=message, user=user, project_name=project_name)
                )

            MessageService._push_messages(messages)

    @staticmethod
    def _push_messages(messages):
        if len(messages) == 0:
            return

        messages_objs = []
        for i, message in enumerate(messages):
            user = message.get("user")
            obj = message.get("message")
            project_name = message.get("project_name")
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
                user.teams_announcement_notifications is False
                and obj.message_type == MessageType.TEAM_BROADCAST.value
            ):
                messages_objs.append(obj)
                continue
            if (
                user.projects_comments_notifications is False
                and obj.message_type == MessageType.PROJECT_CHAT_NOTIFICATION.value
            ):
                continue
            if (
                user.tasks_comments_notifications is False
                and obj.message_type == MessageType.TASK_COMMENT_NOTIFICATION.value
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
                user.is_email_verified,
                message["message"].id,
                UserService.get_user_by_id(message["message"].from_user_id).username,
                message["message"].project_id,
                message["message"].task_id,
                clean_html(message["message"].subject),
                message["message"].message,
                obj.message_type,
                project_name,
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
        """Will send a canned message to anyone @'d in a comment"""
        comment_from_user = UserService.get_user_by_id(comment_from)
        usernames = MessageService._parse_message_for_username(
            comment, project_id, task_id
        )
        if comment_from_user.username in usernames:
            usernames.remove(comment_from_user.username)
        project = Project.get(project_id)
        default_locale = project.default_locale if project else "en"
        project_name = ProjectInfo.get_dto_for_locale(project_id, default_locale).name
        if len(usernames) != 0:
            task_link = MessageService.get_task_link(project_id, task_id)
            project_link = MessageService.get_project_link(project_id, project_name)

            # Clean comment and convert to html
            allowed_tags = [
                "a",
                "b",
                "blockquote",
                "br",
                "code",
                "em",
                "h1",
                "h2",
                "h3",
                "img",
                "i",
                "li",
                "ol",
                "p",
                "pre",
                "strong",
                "ul",
            ]
            allowed_atrributes = {"a": ["href", "rel"], "img": ["src", "alt"]}
            clean_comment = bleach.clean(
                markdown(comment, output_format="html"),
                tags=allowed_tags,
                attributes=allowed_atrributes,
            )  # Bleach input to ensure no nefarious script tags etc
            clean_comment = bleach.linkify(clean_comment)

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
                message.subject = (
                    f"You were mentioned in a comment in {task_link} "
                    + f"of Project {project_link}"
                )
                message.message = clean_comment
                messages.append(
                    dict(message=message, user=user, project_name=project_name)
                )

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
            user_link = MessageService.get_user_link(user_from.username)

            task_link = MessageService.get_task_link(project_id, task_id)
            project_link = MessageService.get_project_link(project_id, project_name)

            messages = []
            for user_id in contributed_users:
                try:
                    user = UserService.get_user_by_id(user_id)
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
                message.subject = f"{user_link} left a comment in {task_link} of Project {project_link}"
                message.message = comment
                messages.append(
                    dict(message=message, user=user, project_name=project_name)
                )

            MessageService._push_messages(messages)

    @staticmethod
    def send_project_transfer_message(
        project_id: int,
        transferred_to: str,
        transferred_by: str,
    ):
        """Will send a message to the manager of the organization after a project is transferred"""
        app = (
            create_app()
        )  # Because message-all run on background thread it needs it's own app context

        with app.app_context():
            project = Project.get(project_id)
            project_name = project.get_project_title(project.default_locale)

            message = Message()
            message.message_type = MessageType.SYSTEM.value
            message.subject = f"Project {project_name} #{project_id} was transferred to {transferred_to}"
            message.message = (
                f"Project {project_name} #{project_id} associated with your"
                + f"organisation {project.organisation.name} was transferred to {transferred_to} by {transferred_by}."
            )
            values = {
                "PROJECT_ORG_NAME": project.organisation.name,
                "PROJECT_ORG_ID": project.organisation_id,
                "PROJECT_NAME": project_name,
                "PROJECT_ID": project_id,
                "TRANSFERRED_TO": transferred_to,
                "TRANSFERRED_BY": transferred_by,
            }
            html_template = get_template("project_transfer_alert_en.html", values)

            managers = OrganisationService.get_organisation_by_id_as_dto(
                project.organisation_id, User.get_by_username(transferred_by).id, False
            ).managers
            for manager in managers:
                manager = UserService.get_user_by_username(manager.username)
                message.to_user_id = manager.id
                message.save()
                if manager.email_address and manager.is_email_verified:
                    SMTPService._send_message(
                        manager.email_address,
                        message.subject,
                        html_template,
                        message.message,
                    )

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
        user_link = MessageService.get_user_link(from_username)
        team_link = MessageService.get_team_link(team_name, team_id, True)
        message.subject = f"{user_link} requested to join {team_link}"
        message.message = f"{user_link} has requested to join the {team_link} team.\
            Access the team management page to accept or reject that request."
        MessageService._push_messages(
            [dict(message=message, user=db.session.get(User, to_user))]
        )

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
        team_link = MessageService.get_team_link(team_name, team_id, False)
        user_link = MessageService.get_user_link(from_username)
        message.subject = f"Your request to join team {team_link} has been {response}ed"
        message.message = (
            f"{user_link} has {response}ed your request to join the {team_link} team."
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
    def send_team_join_notification(
        from_user: int,
        from_username: str,
        to_user: int,
        team_name: str,
        team_id: int,
        role: str,
    ):
        message = Message()
        message.message_type = MessageType.INVITATION_NOTIFICATION.value
        message.from_user_id = from_user
        message.to_user_id = to_user
        team_link = MessageService.get_team_link(team_name, team_id, False)
        user_link = MessageService.get_user_link(from_username)
        message.subject = f"You have been added to team {team_link}"
        message.message = f"You have been added  to the team {team_link} as {role} by {user_link}.\
            Access the {team_link}'s page to view more info about this team."

        message.add_message()
        message.save()

    @staticmethod
    def send_message_after_chat(
        chat_from: int, chat: str, project_id: int, project_name: str
    ):
        """Send alert to user if they were @'d in a chat message"""
        app = (
            create_app()
        )  # Because message-all run on background thread it needs it's own app context
        if (
            app.config["ENVIRONMENT"] == "test"
        ):  # Don't send in test mode as this will cause tests to fail.
            return
        with app.app_context():
            usernames = MessageService._parse_message_for_username(chat, project_id)
            if len(usernames) != 0:
                link = MessageService.get_project_link(
                    project_id, project_name, include_chat_section=True
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
                    message.subject = f"You were mentioned in Project {link} chat"
                    message.message = chat
                    messages.append(
                        dict(message=message, user=user, project_name=project_name)
                    )

                MessageService._push_messages(messages)

            query = f""" select user_id from project_favorites where project_id ={project_id}"""
            with db.engine.connect() as conn:
                favorited_users_results = conn.execute(text(query))
            favorited_users = [r[0] for r in favorited_users_results]

            # Notify all contributors except the user that created the comment.
            contributed_users_results = (
                TaskHistory.query.with_entities(TaskHistory.user_id.distinct())
                .filter(TaskHistory.project_id == project_id)
                .filter(TaskHistory.user_id != chat_from)
                .filter(TaskHistory.action == TaskAction.STATE_CHANGE.name)
                .all()
            )
            contributed_users = [r[0] for r in contributed_users_results]

            users_to_notify = list(set(contributed_users + favorited_users))

            if len(users_to_notify) != 0:
                from_user = User.query.get(chat_from)
                from_user_link = MessageService.get_user_link(from_user.username)
                project_link = MessageService.get_project_link(
                    project_id, project_name, include_chat_section=True
                )
                messages = []
                for user_id in users_to_notify:
                    try:
                        user = UserService.get_user_by_id(user_id)
                    except NotFound:
                        continue  # If we can't find the user, keep going no need to fail
                    message = Message()
                    message.message_type = MessageType.PROJECT_CHAT_NOTIFICATION.value
                    message.project_id = project_id
                    message.from_user_id = chat_from
                    message.to_user_id = user.id
                    message.subject = (
                        f"{from_user_link} left a comment in project {project_link}"
                    )
                    message.message = chat
                    messages.append(
                        dict(message=message, user=user, project_name=project_name)
                    )

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
        user = UserService.get_user_by_id(user_id)
        messages = []
        for project in recently_updated_projects:
            activity_message = []
            query_last_active_users = """ select distinct(user_id) from
                                        (select user_id from task_history where project_id = :project_id
                                        order by action_date desc limit 15 ) t """
            project_name = ProjectInfo.get_dto_for_locale(
                project.id, project.default_locale
            ).name
            with db.engine.connect() as conn:
                last_active_users = conn.execute(
                    text(query_last_active_users), project_id=project.id
                )

            for recent_user_id in last_active_users:
                recent_user_details = UserService.get_user_by_id(recent_user_id)
                user_profile_link = MessageService.get_user_profile_link(
                    recent_user_details.username
                )
                activity_message.append(user_profile_link)

            activity_message = str(activity_message)[1:-1]
            project_link = MessageService.get_project_link(project.id, project_name)
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
            messages.append(dict(message=message, user=user, project_name=project_name))

        MessageService._push_messages(messages)

    @staticmethod
    def resend_email_validation(user_id: int):
        """Resends the email validation email to the logged in user"""
        user = UserService.get_user_by_id(user_id)
        if user.email_address is None:
            raise ValueError("EmailNotSet- User does not have an email address")
        SMTPService.send_verification_email(user.email_address, user.username)

    @staticmethod
    def _parse_message_for_bulk_mentions(
        message: str, project_id: int, task_id: int = None
    ) -> List[str]:
        parser = re.compile(r"((?<=#)\w+|\[.+?\])")
        parsed = parser.findall(message)

        usernames = []
        project = db.session.get(Project, project_id)

        if project is None:
            return usernames
        if "author" in parsed or "managers" in parsed:
            usernames.append(project.author.username)
            if "managers" in parsed:
                teams = [
                    t
                    for t in project.teams
                    if t.role == TeamRoles.PROJECT_MANAGER.value
                ]
                team_members = [
                    [u.member.username for u in t.team.members if u.active is True]
                    for t in teams
                ]

                team_members = [item for sublist in team_members for item in sublist]
                usernames.extend(team_members)

        if task_id and "contributors" in parsed:
            contributors = Message.get_all_tasks_contributors(project_id, task_id)
            usernames.extend(contributors)
        return usernames

    @staticmethod
    def _parse_message_for_username(
        message: str, project_id: int, task_id: int = None
    ) -> List[str]:
        """Extracts all usernames from a comment looks for format @[user name]"""

        parser = re.compile(r"((?<=@)\w+|\[.+?\])")

        usernames = []
        for username in parser.findall(message):
            username = username.replace("[", "", 1)
            index = username.rfind("]")
            username = username.replace("]", "", index)
            usernames.append(username)

        usernames.extend(
            MessageService._parse_message_for_bulk_mentions(
                message, project_id, task_id
            )
        )
        usernames = list(set(usernames))
        return usernames

    @staticmethod
    @cached(message_cache)
    def has_user_new_messages(user_id: int) -> dict:
        """Determines if the user has any unread messages"""
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
        """Get all messages for user"""
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
            .paginate(page=page, per_page=page_size, error_out=True)
        )
        # if results.total == 0:
        #     raise NotFound()

        messages_dto = MessagesDTO()
        for item in results.items:
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
        """Gets the specified message"""
        message = db.session.get(Message, message_id)

        if message is None:
            raise NotFound(sub_code="MESSAGE_NOT_FOUND", message_id=message_id)

        if message.to_user_id != int(user_id):
            raise MessageServiceError(
                "AccessOtherUserMessage- "
                + f"User {user_id} attempting to access another users message {message_id}"
            )

        return message

    @staticmethod
    def mark_all_messages_read(user_id: int, message_type: str = None):
        """Marks all messages as read for the user
        -----------------------------------------
        :param user_id: The user id
        :param message_type: The message types to mark as read
        returns: None
        """
        if message_type is not None:
            # Wrap in list for unit tests to work
            message_type = list(map(int, message_type.split(",")))
        Message.mark_all_messages_read(user_id, message_type)

    @staticmethod
    def mark_multiple_messages_read(message_ids: list, user_id: int):
        """Marks the specified messages as read for the user
        ---------------------------------------------------
        :param message_ids: List of message ids to mark as read
        :param user_id: The user id
        returns: None
        """
        Message.mark_multiple_messages_read(message_ids, user_id)

    @staticmethod
    def get_message_as_dto(message_id: int, user_id: int):
        """Gets the selected message and marks it as read"""
        message = MessageService.get_message(message_id, user_id)
        message.mark_as_read()
        return message.as_dto()

    @staticmethod
    def delete_message(message_id: int, user_id: int):
        """Deletes the specified message"""
        message = MessageService.get_message(message_id, user_id)
        message.delete()

    @staticmethod
    def delete_multiple_messages(message_ids: list, user_id: int):
        """Deletes the specified messages to the user"""
        Message.delete_multiple_messages(message_ids, user_id)

    @staticmethod
    def delete_all_messages(user_id: int, message_type: str = None):
        """Deletes all messages to the user
        ----------------------------------
        :param user_id: The user id
        :param message_type: The message types to delete (comma separated)
        returns: None
        """
        if message_type is not None:
            # Wrap in list for unit tests to work
            message_type = list(map(int, message_type.split(",")))
        Message.delete_all_messages(user_id, message_type)

    @staticmethod
    def get_task_link(
        project_id: int, task_id: int, base_url=None, highlight=False
    ) -> str:
        """Helper method that generates a link to the task"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]
        style = ""
        if highlight:
            style = "color: #d73f3f"
        return f'<a style="{style}" href="{base_url}/projects/{project_id}/tasks/?search={task_id}">Task {task_id}</a>'

    @staticmethod
    def get_project_link(
        project_id: int,
        project_name: str,
        base_url=None,
        include_chat_section=False,
        highlight=False,
    ) -> str:
        """Helper method to generate a link to project chat"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]
        if include_chat_section:
            section = "#questionsAndComments"
        else:
            section = ""
        style = ""
        if highlight:
            style = "color: #d73f3f"

        return f'<a style="{style}" href="{base_url}/projects/{project_id}{section}">{project_name} #{project_id}</a>'

    @staticmethod
    def get_user_profile_link(user_name: str, base_url=None) -> str:
        """Helper method to generate a link to a user profile"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]

        return f'<a href="{base_url}/users/{user_name}">{user_name}</a>'

    @staticmethod
    def get_user_settings_link(section=None, base_url=None) -> str:
        """Helper method to generate a link to a user profile"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]

        return f'<a href="{base_url}/settings#{section}">User Settings</a>'

    @staticmethod
    def get_organisation_link(
        organisation_id: int, organisation_name: str, base_url=None
    ) -> str:
        """Helper method to generate a link to a user profile"""
        if not base_url:
            base_url = current_app.config["APP_BASE_URL"]

        return f'<a href="{base_url}/organisations/{organisation_id}">{organisation_name}</a>'
