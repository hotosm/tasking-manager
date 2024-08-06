import urllib.parse
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from flask_mail import Message

from backend import mail, create_app
from backend.models.postgis.message import Message as PostgisMessage
from backend.models.postgis.statuses import EncouragingEmailType
from backend.services.messaging.template_service import (
    get_template,
    format_username_link,
)


class SMTPService:
    @staticmethod
    def send_verification_email(to_address: str, username: str):
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
        SMTPService._send_message(to_address, subject, html_template)
        return True

    @staticmethod
    def send_welcome_email(to_address: str, username: str):
        """Sends email welcoming new user to tasking manager"""
        values = {
            "USERNAME": username,
        }
        html_template = get_template("welcome.html", values)

        subject = "Welcome to Tasking Manager"
        SMTPService._send_message(to_address, subject, html_template)
        return True

    @staticmethod
    def send_contact_admin_email(data):
        email_to = current_app.config["EMAIL_CONTACT_ADDRESS"]
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
        SMTPService._send_message(email_to, subject, message, message)

    @staticmethod
    def send_email_to_contributors_on_project_progress(
        email_type: str,
        project_id: int = None,
        project_name: str = None,
        project_completion: int = None,
    ):
        """Sends an encouraging email to a users when a project they have contributed to make progress"""
        from backend.services.users.user_service import UserService

        app = (
            create_app()
        )  # Because message-all run on background thread it needs it's own app context
        with app.app_context():
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
            contributor_ids = PostgisMessage.get_all_contributors(project_id)
            for contributor_id in contributor_ids:
                contributor = UserService.get_user_by_id(contributor_id[0])
                values["USERNAME"] = contributor.username
                if email_type == EncouragingEmailType.BEEN_SOME_TIME.value:
                    recommended_projects = UserService.get_recommended_projects(
                        contributor.username, "en"
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
                    current_app.logger.debug(
                        f"Sending {email_type} email to {contributor.email_address} for project {project_id}"
                    )
                    SMTPService._send_message(
                        contributor.email_address, subject, html_template
                    )

    @staticmethod
    def send_email_alert(
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

        current_app.logger.debug(f"Test if email required {to_address}")
        from_user_link = f"{current_app.config['APP_BASE_URL']}/users/{from_username}"
        project_link = f"{current_app.config['APP_BASE_URL']}/projects/{project_id}"
        task_link = f"{current_app.config['APP_BASE_URL']}/projects/{project_id}/tasks/?search={task_id}"
        settings_url = "{}/settings#notifications".format(
            current_app.config["APP_BASE_URL"]
        )

        if not to_address:
            return False  # Many users will not have supplied email address so return
        message_path = ""
        if message_id is not None:
            message_path = f"/message/{message_id}"

        inbox_url = f"{current_app.config['APP_BASE_URL']}/inbox{message_path}"
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
        SMTPService._send_message(to_address, subject, html_template)

        return True

    @staticmethod
    def _send_message(
        to_address: str, subject: str, html_message: str, text_message: str = None
    ):
        """Helper sends SMTP message"""
        from_address = current_app.config["MAIL_DEFAULT_SENDER"]
        if from_address is None:
            raise ValueError("Missing TM_EMAIL_FROM_ADDRESS environment variable")
        msg = Message()
        msg.subject = subject
        msg.sender = "{} Tasking Manager <{}>".format(
            current_app.config["ORG_CODE"], from_address
        )
        msg.add_recipient(to_address)

        msg.body = text_message
        msg.html = html_message

        current_app.logger.debug(f"Sending email via SMTP {to_address}")
        if current_app.config["LOG_LEVEL"] == "DEBUG":
            current_app.logger.debug(msg.as_string())
        else:
            try:
                mail.send(msg)
                current_app.logger.debug(f"Email sent {to_address}")
            except Exception as e:
                # ERROR level logs are automatically captured by sentry so that admins are notified
                current_app.logger.error(
                    f"{e}: Sending email failed. Please check SMTP configuration"
                )

    @staticmethod
    def _generate_email_verification_url(email_address: str, user_name: str):
        """Generate email verification url with unique token"""
        entropy = current_app.secret_key if current_app.secret_key else "un1testingmode"

        serializer = URLSafeTimedSerializer(entropy)
        token = serializer.dumps(email_address)

        base_url = current_app.config["APP_BASE_URL"]

        verification_params = {"token": token, "username": user_name}
        verification_url = "{0}/verify-email/?{1}".format(
            base_url, urllib.parse.urlencode(verification_params)
        )

        return verification_url
