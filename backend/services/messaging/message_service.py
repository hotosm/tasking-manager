import datetime
import re
import time
from typing import List

import bleach
from cachetools import TTLCache
from databases import Database
from loguru import logger
from markdown import markdown
from sqlalchemy import insert

from backend.config import settings
from backend.db import db_connection
from backend.exceptions import NotFound
from backend.models.dtos.message_dto import MessageDTO, MessagesDTO
from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.message import Message, MessageType
from backend.models.postgis.notification import Notification
from backend.models.postgis.project import Project, ProjectInfo
from backend.models.postgis.statuses import TeamRoles
from backend.models.postgis.task import TaskAction, TaskStatus
from backend.models.postgis.utils import timestamp
from backend.services.messaging.smtp_service import SMTPService
from backend.services.messaging.template_service import (
    clean_html,
    get_template,
    get_txt_template,
    template_var_replacing,
)
from backend.services.organisation_service import OrganisationService
from backend.services.users.user_service import User, UserService

message_cache = TTLCache(maxsize=512, ttl=30)


class MessageServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        logger.debug(message)


class MessageService:
    @staticmethod
    async def send_welcome_message(user: User, db: Database):
        """Sends welcome message to new user at Sign up"""
        org_code = settings.ORG_CODE
        text_template = get_txt_template("welcome_message_en.txt")
        hot_welcome_section = get_txt_template("hot_welcome_section_en.txt")
        replace_list = [
            ["[USERNAME]", user.username],
            ["[ORG_CODE]", org_code],
            ["[ORG_NAME]", settings.ORG_NAME],
            ["[SETTINGS_LINK]", MessageService.get_user_settings_link()],
            ["[HOT_WELCOME]", hot_welcome_section if org_code == "HOT" else ""],
        ]
        text_template = template_var_replacing(text_template, replace_list)

        welcome_message = Message()
        welcome_message.message_type = MessageType.SYSTEM.value
        welcome_message.to_user_id = user.id
        welcome_message.subject = "Welcome to the {} Tasking Manager".format(org_code)
        welcome_message.message = text_template
        welcome_message.date = timestamp()
        welcome_message.read = False
        await Message.save(welcome_message, db)

    @staticmethod
    async def send_message_after_validation(
        status: int,
        validated_by: int,
        mapped_by: int,
        task_id: int,
        project_id: int,
        db: Database,
    ):
        """Sends mapper a notification after their task has been marked valid or invalid"""
        if validated_by == mapped_by:
            return  # No need to send a notification if you've verified your own task
        project = await Project.get(project_id, db)
        project_name_query = """
            SELECT name
            FROM project_info
            WHERE project_id = :project_id AND locale = :locale
        """
        project_name = await db.fetch_val(
            project_name_query,
            values={"project_id": project_id, "locale": project.default_locale},
        )
        user = await UserService.get_user_by_id(mapped_by, db)
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
            ["[ORG_NAME]", settings.ORG_NAME],
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
        await MessageService._push_messages(messages, db)

    @staticmethod
    async def send_message_to_all_contributors(
        project_id: int, message_dto: MessageDTO
    ):
        """Sends supplied message to all contributors on specified project.  Message all contributors can take
        over a minute to run, so this method is expected to be called on its own thread
        """
        async with db_connection.database.connection() as conn:
            contributors = await Message.get_all_contributors(project_id, conn)
            project = await Project.get(project_id, conn)
            project_info = await ProjectInfo.get_dto_for_locale(
                conn, project_id, project.default_locale
            )
            message_dto.message = "A message from {} managers:<br/><br/>{}".format(
                MessageService.get_project_link(
                    project_id, project_info.name, highlight=True
                ),
                markdown(message_dto.message, output_format="html"),
            )
            messages = []
            for contributor in contributors:
                message = Message.from_dto(contributor, message_dto)
                message.message_type = MessageType.BROADCAST.value
                message.project_id = project_id
                user = await UserService.get_user_by_id(contributor, conn)
                messages.append(
                    dict(message=message, user=user, project_name=project_info.name)
                )
            await MessageService._push_messages(messages, conn)

    @staticmethod
    async def _push_messages(messages: list, db: Database):
        if len(messages) == 0:
            return
        messages_objs = []
        for i, message in enumerate(messages):
            user = message.get("user")
            obj = message.get("message")
            project_name = message.get("project_name")

            # Skipping message if certain notifications are disabled
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
            # If the notification is enabled, send an email
            messages_objs.append(obj)
            await SMTPService.send_email_alert(
                user.email_address,
                user.username,
                user.is_email_verified,
                message["message"].id,
                (
                    await UserService.get_user_by_id(
                        message["message"].from_user_id, db
                    )
                ).username,
                message["message"].project_id,
                message["message"].task_id,
                clean_html(message["message"].subject),
                message["message"].message,
                obj.message_type,
                project_name,
            )

            if (i + 1) % 10 == 0:
                time.sleep(0.5)

        if messages_objs:
            insert_values = [
                {
                    "message": msg.message,
                    "subject": msg.subject,
                    "from_user_id": msg.from_user_id,
                    "to_user_id": msg.to_user_id,
                    "project_id": msg.project_id,
                    "task_id": msg.task_id,
                    "message_type": msg.message_type,
                    "date": timestamp(),
                    "read": False,
                }
                for msg in messages_objs
            ]

            # Insert the messages into the database
            query = insert(Message).values(insert_values)
            await db.execute(query)

    @staticmethod
    async def send_message_after_comment(
        comment_from: int, comment: str, task_id: int, project_id: int, db: Database
    ):
        """Will send a canned message to anyone @'d in a comment"""
        # Fetch the user who made the comment
        comment_from_user = await UserService.get_user_by_id(comment_from, db)
        # Parse the comment for mentions
        usernames = await MessageService._parse_message_for_username(
            comment, project_id, task_id, db
        )
        if comment_from_user.username in usernames:
            usernames.remove(comment_from_user.username)

        # Fetch project details
        project = await db.fetch_one(
            "SELECT * FROM projects WHERE id = :project_id", {"project_id": project_id}
        )
        default_locale = project["default_locale"] if project else "en"

        # Get the project info DTO using the get_dto_for_locale function
        project_info_dto = await ProjectInfo.get_dto_for_locale(
            db, project_id, default_locale
        )
        project_name = project_info_dto.name  # Use the `name` field from the DTO

        if usernames:
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
            allowed_attributes = {"a": ["href", "rel"], "img": ["src", "alt"]}

            # Convert comment to HTML using markdown and sanitize it with bleach
            clean_comment = bleach.clean(
                markdown(comment, output_format="html"),
                tags=allowed_tags,
                attributes=allowed_attributes,
            )
            clean_comment = bleach.linkify(clean_comment)  # Linkify URLs in the comment

            messages = []
            for username in usernames:
                try:
                    user = await UserService.get_user_by_username(username, db)
                except NotFound:
                    continue

                message = Message()
                message.message_type = MessageType.MENTION_NOTIFICATION.value
                message.project_id = project_id
                message.task_id = task_id
                message.from_user_id = comment_from
                message.to_user_id = user["id"]
                message.subject = f"You were mentioned in a comment in {task_link} of Project {project_link}"
                message.message = clean_comment
                message.date = timestamp()
                message.read = False
                messages.append(
                    dict(message=message, user=user, project_name=project_name)
                )

            await MessageService._push_messages(messages, db)

        # Notify all contributors except the comment author
        results = await db.fetch_all(
            """
            SELECT DISTINCT user_id
            FROM task_history
            WHERE project_id = :project_id
            AND task_id = :task_id
            AND user_id != :comment_from
            AND action = 'STATE_CHANGE'
            """,
            {
                "project_id": project_id,
                "task_id": task_id,
                "comment_from": comment_from,
            },
        )

        contributed_users = [r["user_id"] for r in results]

        if contributed_users:
            user_from = await UserService.get_user_by_id(comment_from, db)
            user_link = MessageService.get_user_link(user_from.username)
            task_link = MessageService.get_task_link(project_id, task_id)
            project_link = MessageService.get_project_link(project_id, project_name)

            messages = []
            for user_id in contributed_users:
                try:
                    user = await UserService.get_user_by_id(user_id, db)
                    if user.username in usernames:
                        break
                except NotFound:
                    continue

                message = Message()
                message.message_type = MessageType.TASK_COMMENT_NOTIFICATION.value
                message.project_id = project_id
                message.task_id = task_id
                message.from_user_id = comment_from
                message.to_user_id = user.id
                message.subject = f"{user_link} left a comment in {task_link} of Project {project_link}"
                message.message = comment
                message.date = timestamp()
                message.read = False
                messages.append(
                    dict(message=message, user=user, project_name=project_name)
                )
            await MessageService._push_messages(messages, db)

    @staticmethod
    async def send_project_transfer_message(
        project_id: int,
        transferred_to: str,
        transferred_by: str,
    ):
        """Will send a message to the manager of the organization after a project is transferred"""
        async with db_connection.database.connection() as db:
            project = await Project.get(project_id, db)
            project_name = await project.get_project_title(
                db, project.id, project.default_locale
            )
            from_user = await User.get_by_username(transferred_by, db)
            organisation = await OrganisationService.get_organisation_by_id_as_dto(
                project.organisation_id, from_user.id, False, db
            )
            message = Message()
            message.message_type = MessageType.SYSTEM.value
            message.date = timestamp()
            message.read = False
            message.subject = f"Project {project_name} #{project_id} was transferred to {transferred_to}"
            message.message = (
                f"Project {project_name} #{project_id} associated with your"
                + f"organisation {organisation.name} was transferred to {transferred_to} by {transferred_by}."
            )
            values = {
                "PROJECT_ORG_NAME": organisation.name,
                "PROJECT_ORG_ID": project.organisation_id,
                "PROJECT_NAME": project_name,
                "PROJECT_ID": project_id,
                "TRANSFERRED_TO": transferred_to,
                "TRANSFERRED_BY": transferred_by,
            }
            html_template = get_template("project_transfer_alert_en.html", values)
            managers = organisation.managers
            for manager in managers:
                manager = await UserService.get_user_by_username(manager.username, db)
                message.to_user_id = manager.id
                await message.save(db)
                if manager.email_address and manager.is_email_verified:
                    await SMTPService._send_message(
                        manager.email_address,
                        message.subject,
                        html_template,
                        message.message,
                    )

    @staticmethod
    def get_user_link(username: str):
        base_url = settings.APP_BASE_URL
        return f'<a href="{base_url}/users/{username}">{username}</a>'

    @staticmethod
    def get_team_link(team_name: str, team_id: int, management: bool):
        base_url = settings.APP_BASE_URL
        if management is True:
            return f'<a href="{base_url}/manage/teams/{team_id}/">{team_name}</a>'
        else:
            return f'<a href="{base_url}/teams/{team_id}/membership/">{team_name}</a>'

    @staticmethod
    async def send_request_to_join_team(
        from_user: int,
        from_username: str,
        to_user: int,
        team_name: str,
        team_id: int,
        db: Database,
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
        user = await UserService.get_user_by_id(to_user, db)
        await MessageService._push_messages([dict(message=message, user=user)], db)

    @staticmethod
    async def accept_reject_request_to_join_team(
        from_user: int,
        from_username: str,
        to_user: int,
        team_name: str,
        team_id: int,
        response: str,
        db: Database,
    ):
        message = Message()
        message.message_type = MessageType.REQUEST_TEAM_NOTIFICATION.value
        message.from_user_id = from_user
        message.to_user_id = to_user
        message.date = timestamp()
        message.read = False
        team_link = MessageService.get_team_link(team_name, team_id, False)
        user_link = MessageService.get_user_link(from_username)
        message.subject = f"Your request to join team {team_link} has been {response}ed"
        message.message = (
            f"{user_link} has {response}ed your request to join the {team_link} team."
        )
        user = await UserService.get_user_by_id(to_user, db)
        await MessageService._push_messages([dict(message=message, user=user)], db)

    @staticmethod
    async def accept_reject_invitation_request_for_team(
        from_user: int,
        from_username: str,
        to_user: int,
        sending_member: str,
        team_name: str,
        team_id: int,
        response: str,
        db: Database,
    ):
        message = Message()
        message.message_type = MessageType.INVITATION_NOTIFICATION.value
        message.from_user_id = from_user
        message.to_user_id = to_user
        message.date = timestamp()
        message.read = False
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
        user = await UserService.get_user_by_id(to_user, db)
        await MessageService._push_messages([dict(message=message, user=user)], db)

    @staticmethod
    async def send_team_join_notification(
        from_user: int,
        from_username: str,
        to_user: int,
        team_name: str,
        team_id: int,
        role: str,
        db: Database,
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
        message.date = timestamp()
        message.read = False
        user = await UserService.get_user_by_id(to_user, db)
        await MessageService._push_messages([dict(message=message, user=user)], db)

    @staticmethod
    async def send_message_after_chat(
        chat_from: int,
        chat: str,
        project_id: int,
        project_name: str,
    ):
        async with db_connection.database.connection() as db:
            usernames = await MessageService._parse_message_for_username(
                message=chat, project_id=project_id, db=db
            )
            if len(usernames) != 0:
                link = MessageService.get_project_link(
                    project_id, project_name, include_chat_section=True
                )
                messages = []
                for username in usernames:
                    logger.debug(f"Searching for {username}")
                    try:
                        user = await UserService.get_user_by_username(username, db)
                    except NotFound:
                        logger.error(f"Username {username} not found")
                        continue  # If we can't find the user, keep going no need to fail

                    message = Message()
                    message.message_type = MessageType.MENTION_NOTIFICATION.value
                    message.project_id = project_id
                    message.from_user_id = chat_from
                    message.to_user_id = user.id
                    message.date = timestamp()
                    message.read = False
                    message.subject = f"You were mentioned in Project {link} chat"
                    message.message = chat
                    messages.append(
                        dict(message=message, user=user, project_name=project_name)
                    )

                await MessageService._push_messages(messages, db)
            favorited_users_query = """ select user_id from project_favorites where project_id = :project_id"""
            favorited_users_values = {
                "project_id": project_id,
            }
            favorited_users_results = await db.fetch_all(
                query=favorited_users_query, values=favorited_users_values
            )
            favorited_users = [r.user_id for r in favorited_users_results]
            # Notify all contributors except the user that created the comment.
            contributed_users_query = """
            SELECT DISTINCT user_id
            FROM task_history
            WHERE project_id = :project_id
            AND user_id != :chat_from
            AND action = :state_change_action
            """

            values = {
                "project_id": project_id,
                "chat_from": chat_from,
                "state_change_action": TaskAction.STATE_CHANGE.name,
            }
            contributed_users_results = await db.fetch_all(
                query=contributed_users_query, values=values
            )
            contributed_users = [r.user_id for r in contributed_users_results]
            users_to_notify = list(set(contributed_users + favorited_users))

            if len(users_to_notify) != 0:
                from_user = await UserService.get_user_by_id(chat_from, db)
                from_user_link = MessageService.get_user_link(from_user.username)
                project_link = MessageService.get_project_link(
                    project_id, project_name, include_chat_section=True
                )
                messages = []
                for user_id in users_to_notify:
                    try:
                        user = await UserService.get_user_by_id(user_id, db)
                    except NotFound:
                        continue
                    message = Message()
                    message.message_type = MessageType.PROJECT_CHAT_NOTIFICATION.value
                    message.project_id = project_id
                    message.from_user_id = chat_from
                    message.to_user_id = user.id
                    message.date = timestamp()
                    message.read = False
                    message.subject = (
                        f"{from_user_link} left a comment in project {project_link}"
                    )
                    message.message = chat
                    messages.append(
                        dict(message=message, user=user, project_name=project_name)
                    )

                await MessageService._push_messages(messages, db)

    async def send_favorite_project_activities(user_id: int, db: Database):
        logger.debug("Sending Favorite Project Activities")

        # Fetch favorited and contributed projects
        favorited_projects = await UserService.get_projects_favorited(user_id, db)
        contributed_projects = await UserService.get_projects_mapped(user_id, db) or []

        contributed_projects.extend(
            [fp.project_id for fp in favorited_projects.favorited_projects]
        )

        # Fetch recently updated projects
        recently_updated_query = """
            SELECT id, DATE(last_updated) as last_updated
            FROM projects
            WHERE id = ANY(:contributed_projects)
            AND DATE(last_updated) > :date_threshold
        """

        recently_updated_projects = await db.fetch_all(
            recently_updated_query,
            values={
                "contributed_projects": contributed_projects,
                "date_threshold": datetime.utcnow().date()
                - datetime.timedelta(days=300),
            },
        )

        user = await UserService.get_user_by_id(user_id, db)
        messages = []

        for project in recently_updated_projects:
            activity_message = []

            # Fetch last active users
            query_last_active_users = """
                SELECT DISTINCT(user_id) FROM (
                    SELECT user_id FROM task_history
                    WHERE project_id = :project_id
                    ORDER BY action_date DESC
                    LIMIT 15
                ) t
            """

            last_active_users = await db.fetch_all(
                query_last_active_users, values={"project_id": project["id"]}
            )

            for recent_user in last_active_users:
                recent_user_details = await UserService.get_user_by_id(
                    recent_user["user_id"], db
                )
                user_profile_link = MessageService.get_user_profile_link(
                    recent_user_details.username
                )
                activity_message.append(user_profile_link)

            activity_message = ", ".join(activity_message)
            project_name = await ProjectInfo.get_project_name(project["id"], db)
            project_link = MessageService.get_project_link(project["id"], project_name)

            message = {
                "message_type": MessageType.PROJECT_ACTIVITY_NOTIFICATION.value,
                "project_id": project["id"],
                "to_user_id": user.id,
                "date": datetime.utcnow(),
                "read": False,
                "subject": "Recent activities from your contributed/favorited Projects",
                "message": f"{activity_message} contributed to {project_link} recently",
            }
            messages.append(message)

        await MessageService._push_messages(messages, db)

    @staticmethod
    async def resend_email_validation(user_id: int, db: Database):
        """Resends the email validation email to the logged in user"""
        user = await UserService.get_user_by_id(user_id, db)
        if user.email_address is None:
            raise ValueError("EmailNotSet- User does not have an email address")
        await SMTPService.send_verification_email(user.email_address, user.username)

    @staticmethod
    async def _parse_message_for_bulk_mentions(
        message: str, project_id: int, task_id: int = None, db: Database = None
    ) -> List[str]:
        parser = re.compile(r"((?<=#)\w+|\[.+?\])")
        parsed = parser.findall(message)

        usernames = []
        query = """
            SELECT * FROM projects
            WHERE id = :project_id
        """
        project = await db.fetch_one(query, values={"project_id": project_id})

        # Fetch project details, including author username by joining users and projects
        project_query = """
            SELECT p.*, u.username AS author_username
            FROM projects p
            JOIN users u ON p.author_id = u.id
            WHERE p.id = :project_id
        """
        project = await db.fetch_one(project_query, {"project_id": project_id})

        if not project:
            return usernames

        # Add author if mentioned
        if "author" in parsed:
            usernames.append(project["author_username"])

        # Add project managers if mentioned
        if "managers" in parsed:
            team_manager_role = TeamRoles.PROJECT_MANAGER.value

            team_members = await db.fetch_all(
                """
                SELECT DISTINCT u.username
                FROM users u
                JOIN team_members tm ON u.id = tm.user_id
                JOIN project_teams pt ON tm.team_id = pt.team_id
                WHERE pt.role = :team_manager_role
                AND pt.project_id = :project_id
                AND tm.active = TRUE
                """,
                {"project_id": project_id, "team_manager_role": team_manager_role},
            )
            usernames.extend([member["username"] for member in team_members])

            organisation_managers_query = """
                SELECT DISTINCT u.username
                FROM projects p
                JOIN organisation_managers om ON p.organisation_id = om.organisation_id
                JOIN users u ON u.id = om.user_id
                WHERE p.id = :project_id
            """

            organisation_managers = await db.fetch_all(
                organisation_managers_query, values={"project_id": project_id}
            )
            if organisation_managers:
                usernames.extend(
                    [manager["username"] for manager in organisation_managers]
                )

        # Add contributors if task_id is provided and contributors are mentioned
        if task_id and "contributors" in parsed:
            contributors = await Message.get_all_tasks_contributors(
                project_id, task_id, db
            )
            usernames.extend(contributors)
        return list(set(usernames))

    @staticmethod
    async def _parse_message_for_username(
        message: str, project_id: int, task_id: int = None, db: Database = None
    ) -> List[str]:
        """Extracts all usernames from a comment looking for format @[user name]"""
        parser = re.compile(r"((?<=@)\w+|\[.+?\])")
        usernames = [
            username.replace("[", "", 1).replace("]", "", username.rfind("]"))
            for username in parser.findall(message)
        ]
        usernames.extend(
            await MessageService._parse_message_for_bulk_mentions(
                message, project_id, task_id, db
            )
        )
        return list(set(usernames))

    # @cached(message_cache)
    @staticmethod
    async def has_user_new_messages(user_id: int, db: Database) -> dict:
        """Determines if the user has any unread messages"""
        count = await Notification.get_unread_message_count(user_id, db)

        new_messages = False
        if count > 0:
            new_messages = True

        return dict(newMessages=new_messages, unread=count)

    @staticmethod
    async def get_all_messages(
        db: Database,
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

        sort_column = (
            sort_by
            if sort_by in ["date", "message_type", "from_user_id", "project_id", "read"]
            else "date"
        )
        sort_direction = (
            "ASC" if sort_direction and sort_direction.lower() == "asc" else "DESC"
        )

        query = """
            SELECT
                m.id AS message_id,
                m.subject,
                m.message,
                m.from_user_id,
                m.to_user_id,
                m.task_id,
                m.message_type,
                m.date AS sent_date,
                m.read,
                m.project_id,
                u.username AS from_username,
                u.picture_url AS display_picture_url
            FROM
                messages m
            LEFT JOIN
                users u ON m.from_user_id = u.id
            WHERE
                m.to_user_id = :user_id
        """

        filters = []
        params = {"user_id": user_id}

        if project:
            filters.append("m.project_id = :project")
            params["project"] = int(project)

        if task_id:
            filters.append("m.task_id = :task_id")
            params["task_id"] = int(task_id)

        if status in ["read", "unread"]:
            filters.append("m.read = :read_status")
            params["read_status"] = True if status == "read" else False

        if message_type:
            filters.append("m.message_type = ANY(:message_types)")
            params["message_types"] = list(map(int, message_type.split(",")))

        if from_username:
            filters.append("u.username ILIKE :from_username")
            params["from_username"] = from_username + "%"

        if filters:
            query += " AND " + " AND ".join(filters)

        query += f" ORDER BY {sort_column} {sort_direction} LIMIT :limit OFFSET :offset"
        params["limit"] = int(page_size)
        params["offset"] = (int(page) - 1) * int(page_size)

        messages = await db.fetch_all(query, params)

        messages_dto = MessagesDTO()
        for msg in messages:
            message_dict = dict(msg)
            if message_dict["message_type"]:
                message_dict["message_type"] = MessageType(
                    message_dict["message_type"]
                ).name
                if message_dict["project_id"]:
                    try:
                        message_dict["project_title"] = (
                            await Project.get_project_title(
                                db, message_dict["project_id"], locale
                            )
                            or ""
                        )
                    except Exception:
                        raise MessageServiceError("Unable to fetch project name.")
            msg_dto = MessageDTO(**message_dict).copy(exclude={"from_user_id"})
            messages_dto.user_messages.append(msg_dto)

        total_count_query = """
            SELECT COUNT(*) AS total_count
            FROM messages m
            WHERE m.to_user_id = :user_id
        """
        if filters:
            total_count_query += " AND " + " AND ".join(filters)

        total_count_params = {"user_id": params["user_id"]}
        if "project" in params:
            total_count_params["project"] = params["project"]
        if "task_id" in params:
            total_count_params["task_id"] = params["task_id"]
        if "read_status" in params:
            total_count_params["read_status"] = params["read_status"]
        if "message_types" in params:
            total_count_params["message_types"] = params["message_types"]
        if "from_username" in params:
            total_count_params["from_username"] = params["from_username"]

        total_count = await db.fetch_one(total_count_query, total_count_params)

        messages_dto.pagination = Pagination.from_total_count(
            page=int(page), per_page=int(page_size), total=total_count["total_count"]
        )
        return messages_dto

    @staticmethod
    async def get_message(message_id: int, user_id: int, db: Database):
        """Gets the specified message."""
        query = """
            SELECT * FROM messages WHERE id = :message_id
        """
        message = await db.fetch_one(query, values={"message_id": message_id})

        if message is None:
            raise NotFound(sub_code="MESSAGE_NOT_FOUND", message_id=message_id)

        if message["to_user_id"] != user_id:
            raise MessageServiceError(
                f"AccessOtherUserMessage - User {user_id} attempting to access another user's message {message_id}"
            )

        return message

    @staticmethod
    async def mark_all_messages_read(
        user_id: int, db: Database, message_type: str = None
    ):
        """Marks all messages as read for the user
        -----------------------------------------
        :param user_id: The user id
        :param db: Database connection
        :param message_type: The message types to mark as read
        returns: None
        """
        if message_type is not None:
            message_type = list(map(int, message_type.split(",")))
        await Message.mark_all_messages_read(user_id, db, message_type)

    @staticmethod
    async def mark_multiple_messages_read(
        message_ids: list, user_id: int, db: Database
    ):
        """Marks the specified messages as read for the user
        ---------------------------------------------------
        :param message_ids: List of message ids to mark as read
        :param user_id: The user id
        :param db: Database connection
        returns: None
        """
        await Message.mark_multiple_messages_read(message_ids, user_id, db)

    @staticmethod
    async def get_message_as_dto(message_id: int, user_id: int, db: Database):
        """Gets the selected message and marks it as read"""
        query = """
            SELECT
                m.id AS message_id,
                m.subject,
                m.message,
                m.to_user_id,
                m.from_user_id,
                m.task_id,
                m.message_type,
                m.date AS sent_date,
                m.read,
                m.project_id,
                u.username AS from_username,
                u.picture_url AS display_picture_url,
                pi.name AS project_title
            FROM
                messages m
            LEFT JOIN
                users u ON m.from_user_id = u.id
            LEFT JOIN
                project_info pi ON m.project_id = pi.project_id
            WHERE
                m.id = :message_id
        """
        message = await db.fetch_one(query, {"message_id": message_id})

        if message is None:
            raise NotFound(sub_code="MESSAGE_NOT_FOUND", message_id=message_id)

        if message["to_user_id"] != user_id:
            raise MessageServiceError(
                "AccessOtherUserMessage- "
                + f"User {user_id} attempting to access another user's message {message_id}"
            )

        update_query = """
            UPDATE messages SET read = TRUE WHERE id = :message_id
        """
        await db.execute(update_query, {"message_id": message_id})

        message_dict = dict(message)
        message_dict["message_type"] = MessageType(message_dict["message_type"]).name
        return message_dict

    @staticmethod
    async def delete_message(message_id: int, user_id: int, db: Database):
        """Deletes the specified message"""
        delete_query = """
            DELETE FROM messages WHERE id = :message_id AND to_user_id = :user_id
        """
        await db.execute(delete_query, {"message_id": message_id, "user_id": user_id})

    @staticmethod
    async def delete_multiple_messages(message_ids: list, user_id: int, db: Database):
        """Deletes the specified messages to the user"""
        await Message.delete_multiple_messages(message_ids, user_id, db)

    @staticmethod
    async def delete_all_messages(user_id: int, db: Database, message_type: str = None):
        """Deletes all messages to the user
        ----------------------------------
        :param user_id: The user id
        :param db: Database connection
        :param message_type: The message types to delete (comma separated)
        returns: None
        """
        if message_type is not None:
            # Wrap in list for unit tests to work
            message_type = list(map(int, message_type.split(",")))
        await Message.delete_all_messages(user_id, db, message_type)

    @staticmethod
    def get_task_link(
        project_id: int, task_id: int, base_url=None, highlight=False
    ) -> str:
        """Helper method that generates a link to the task"""
        if not base_url:
            base_url = settings.APP_BASE_URL
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
            base_url = settings.APP_BASE_URL
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
            base_url = settings.APP_BASE_URL

        return f'<a href="{base_url}/users/{user_name}">{user_name}</a>'

    @staticmethod
    def get_user_settings_link(section=None, base_url=None) -> str:
        """Helper method to generate a link to a user profile"""
        if not base_url:
            base_url = settings.APP_BASE_URL

        return f'<a href="{base_url}/settings#{section}">User Settings</a>'

    @staticmethod
    def get_organisation_link(
        organisation_id: int, organisation_name: str, base_url=None
    ) -> str:
        """Helper method to generate a link to a user profile"""
        if not base_url:
            base_url = settings.APP_BASE_URL

        return f'<a href="{base_url}/organisations/{organisation_id}">{organisation_name}</a>'
