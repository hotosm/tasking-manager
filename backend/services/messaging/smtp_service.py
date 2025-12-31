import re
import urllib.parse
from html import unescape

from databases import Database
from fastapi_mail import MessageSchema, MessageType
from fastapi_mail.schemas import MultipartSubtypeEnum
from itsdangerous import URLSafeTimedSerializer
from loguru import logger

# from backend import mail, create_app
from backend import mail
from backend.config import settings
from backend.models.postgis.message import Message as PostgisMessage
from backend.models.postgis.statuses import EncouragingEmailType
from backend.services.messaging.template_service import (
    format_username_link,
    get_template,
)


def html_to_text(html_content: str) -> str:
    """Convert HTML to plain text for email alternative body."""
    if not html_content:
        return ""
    text = re.sub(
        r"<(style|script)[^>]*>.*?</\1>", "", html_content, flags=re.DOTALL | re.I
    )
    text = re.sub(r"<br\s*/?>|</p>|</div>|</tr>|</h[1-6]>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n ", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


class SMTPService:
    @staticmethod
    async def send_verification_email(to_address: str, username: str):
        """Sends a verification email with a unique token so we can verify user owns this email address"""
        # TODO these could be localised if needed, in the future
        verification_url = SMTPService._generate_email_verification_url(
            to_address, username
        )
        values = {
            "USERNAME": username,
            "VERIFICATION_LINK": verification_url,
        }
        html_template = get_template("email_verification_en.html", values)
        subject = "Confirm your email address"
        await SMTPService._send_message(to_address, subject, html_template)
        return True

    @staticmethod
    async def send_welcome_email(to_address: str, username: str):
        """Sends email welcoming new user to tasking manager"""
        values = {
            "USERNAME": username,
        }
        html_template = get_template("welcome.html", values)

        subject = "Welcome to Tasking Manager"
        await SMTPService._send_message(to_address, subject, html_template)
        return True

    @staticmethod
    async def send_contact_admin_email(data):
        email_to = settings.EMAIL_CONTACT_ADDRESS
        if email_to is None:
            raise ValueError(
                "This feature is not implemented due to missing variable TM_EMAIL_CONTACT_ADDRESS."
            )

        message = """New contact from {name} - {email}.
            <p>{content}</p>
            """.format(
            name=data.get("name"),
            email=data.get("email"),
            content=data.get("content"),
        )

        subject = "New contact from {name}".format(name=data.get("name"))
        await SMTPService._send_message(email_to, subject, message, message)

    @staticmethod
    async def send_email_to_contributors_on_project_progress(
        email_type: str,
        project_id: int = None,
        project_name: str = None,
        project_completion: int = None,
        db: Database = None,
    ):
        """Sends an encouraging email to a users when a project they have contributed to make progress"""
        from backend.services.users.user_service import UserService

        if email_type == EncouragingEmailType.PROJECT_PROGRESS.value:
            subject = "The project you have contributed to has made progress."
        elif email_type == EncouragingEmailType.PROJECT_COMPLETE.value:
            subject = "The project you have contributed to has been completed."
        values = {
            "EMAIL_TYPE": email_type,
            "PROJECT_ID": project_id,
            "PROJECT_NAME": project_name,
            "PROJECT_COMPLETION": project_completion,
        }
        contributor_ids = await PostgisMessage.get_all_contributors(project_id, db)
        for contributor_id in contributor_ids:
            contributor = await UserService.get_user_by_id(contributor_id, db)
            values["USERNAME"] = contributor.username
            if email_type == EncouragingEmailType.BEEN_SOME_TIME.value:
                recommended_projects = await UserService.get_recommended_projects(
                    contributor.username, "en", db
                ).results
                projects = []
                for recommended_project in recommended_projects[:4]:
                    projects.append(
                        {
                            "org_logo": recommended_project.organisation_logo,
                            "priority": recommended_project.priority,
                            "name": recommended_project.name,
                            "id": recommended_project.project_id,
                            "description": recommended_project.short_description,
                            "total_contributors": recommended_project.total_contributors,
                            "difficulty": recommended_project.difficulty,
                            "progress": recommended_project.percent_mapped,
                            "due_date": recommended_project.due_date,
                        }
                    )

                values["PROJECTS"] = projects
            html_template = get_template("encourage_mapper_en.html", values)
            if (
                contributor.email_address
                and contributor.is_email_verified
                and contributor.projects_notifications
            ):
                logger.debug(
                    f"Sending {email_type} email to {contributor.email_address} for project {project_id}"
                )
                await SMTPService._send_message(
                    contributor.email_address, subject, html_template
                )

    @staticmethod
    async def send_email_alert(
        to_address: str,
        username: str,
        user_email_verified: bool,
        message_id: int,
        from_username: str,
        project_id: int,
        task_id: int,
        subject: str,
        content: str,
        message_type: int,
        project_name: str,
    ):
        """Send an email to user to alert that they have a new message."""

        if not user_email_verified:
            return False

        logger.debug(f"Test if email required {to_address}")
        from_user_link = f"{settings.APP_BASE_URL}/users/{from_username}"
        project_link = f"{settings.APP_BASE_URL}/projects/{project_id}"
        task_link = (
            f"{settings.APP_BASE_URL}/projects/{project_id}/tasks/?search={task_id}"
        )
        settings_url = "{}/settings#notifications".format(settings.APP_BASE_URL)

        if not to_address:
            return False  # Many users will not have supplied email address so return
        message_path = ""
        if message_id is not None:
            message_path = f"/message/{message_id}"

        inbox_url = f"{settings.APP_BASE_URL}/inbox{message_path}"
        values = {
            "FROM_USER_LINK": from_user_link,
            "FROM_USERNAME": from_username,
            "PROJECT_LINK": project_link,
            "PROJECT_ID": str(project_id) if project_id is not None else None,
            "PROJECT_NAME": project_name,
            "TASK_LINK": task_link,
            "TASK_ID": str(task_id) if task_id is not None else None,
            "PROFILE_LINK": inbox_url,
            "SETTINGS_LINK": settings_url,
            "CONTENT": format_username_link(content),
            "MESSAGE_TYPE": message_type,
        }
        html_template = get_template("message_alert_en.html", values)
        await SMTPService._send_message(to_address, subject, html_template)

        return True

    @staticmethod
    async def _send_message(
        to_address: str, subject: str, html_message: str, text_message: str = None
    ):
        """Helper sends SMTP message"""
        from_address = settings.MAIL_DEFAULT_SENDER
        if from_address is None:
            raise ValueError("Missing TM_EMAIL_FROM_ADDRESS environment variable")
        if text_message is None:
            text_message = html_to_text(html_message)
        msg = MessageSchema(
            recipients=[to_address],
            subject=subject,
            body=html_message,
            alternative_body=text_message,
            subtype=MessageType.html,
            multipart_subtype=MultipartSubtypeEnum.alternative,
        )
        logger.debug(f"Sending email via SMTP {to_address}")
        if settings.LOG_LEVEL == "DEBUG":
            logger.debug(msg.as_string())

        else:
            try:
                await mail.send_message(msg)
                logger.debug(f"Email sent {to_address}")
            except Exception as e:
                # ERROR level logs are automatically captured by sentry so that admins are notified
                logger.error(
                    f"{e}: Sending email failed. Please check SMTP configuration"
                )

    @staticmethod
    def _generate_email_verification_url(email_address: str, user_name: str):
        """Generate email verification url with unique token"""
        entropy = settings.SECRET_KEY if settings.SECRET_KEY else "un1testingmode"

        serializer = URLSafeTimedSerializer(entropy)
        token = serializer.dumps(email_address)

        base_url = settings.APP_BASE_URL

        verification_params = {"token": token, "username": user_name}
        verification_url = "{0}/verify-email/?{1}".format(
            base_url, urllib.parse.urlencode(verification_params)
        )

        return verification_url
