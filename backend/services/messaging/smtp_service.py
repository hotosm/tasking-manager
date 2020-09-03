import smtplib
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from backend.services.messaging.template_service import (
    get_template,
    template_var_replacing,
    format_username_link,
)


class SMTPService:
    @staticmethod
    def send_verification_email(to_address: str, username: str):
        """ Sends a verification email with a unique token so we can verify user owns this email address """
        org_code = current_app.config["ORG_CODE"]
        # TODO these could be localised if needed, in the future
        html_template = get_template("email_verification_en.html")
        text_template = get_template("email_verification_en.txt")

        verification_url = SMTPService._generate_email_verification_url(
            to_address, username
        )
        replace_list = [
            ["[USERNAME]", username],
            ["[VERIFICATION_LINK]", verification_url],
            ["[ORG_CODE]", org_code],
            ["[ORG_NAME]", current_app.config["ORG_NAME"]],
        ]
        html_template = template_var_replacing(html_template, replace_list)
        text_template = template_var_replacing(text_template, replace_list)

        subject = "{} Tasking Manager - Email Verification".format(org_code)
        SMTPService._send_message(to_address, subject, html_template, text_template)

        return True

    @staticmethod
    def send_contact_admin_email(data):
        email_to = current_app.config["EMAIL_CONTACT_ADDRESS"]
        if email_to is None:
            raise ValueError("variable TM_EMAIL_CONTACT_ADDRESS not set")

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
    def send_email_alert(
        to_address: str, username: str, message_id: int, subject: str, content: str
    ):
        """Send an email to user to alert that they have a new message"""
        current_app.logger.debug(f"Test if email required {to_address}")
        org_code = current_app.config["ORG_CODE"]
        settings_url = "{}/settings#notifications".format(
            current_app.config["APP_BASE_URL"]
        )

        if not to_address:
            return False  # Many users will not have supplied email address so return
        message_path = ""
        if message_id is not None:
            message_path = f"/message/{message_id}"

        # TODO these could be localised if needed, in the future
        html_template = get_template("message_alert_en.html")
        text_template = get_template("message_alert_en.txt")
        inbox_url = f"{current_app.config['APP_BASE_URL']}/inbox{message_path}"
        replace_list = [
            ["[ORG_CODE]", org_code],
            ["[PROFILE_LINK]", inbox_url],
            ["[SETTINGS_LINK]", settings_url],
        ]
        html_replace_list = replace_list + [
            ["[CONTENT]", format_username_link(content)]
        ]
        html_template = template_var_replacing(html_template, html_replace_list)
        replace_list += [["[CONTENT]", content]]
        text_template = template_var_replacing(text_template, replace_list)

        SMTPService._send_message(to_address, subject, html_template, text_template)

        return True

    @staticmethod
    def _send_message(
        to_address: str, subject: str, html_message: str, text_message: str
    ):
        """ Helper sends SMTP message """
        from_address = current_app.config["EMAIL_FROM_ADDRESS"]
        if from_address is None:
            raise ValueError("Missing TM_EMAIL_FROM_ADDRESS environment variable")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = "{} Tasking Manager <{}>".format(
            current_app.config["ORG_CODE"], from_address
        )
        msg["To"] = to_address

        # Record the MIME types of both parts - text/plain and text/html.
        part1 = MIMEText(text_message, "plain")
        part2 = MIMEText(html_message, "html")
        msg.attach(part1)
        msg.attach(part2)

        current_app.logger.debug(f"Sending email via SMTP {to_address}")
        if current_app.config["LOG_LEVEL"] == "DEBUG":
            current_app.logger.debug(msg.as_string())
        else:
            sender = SMTPService._init_smtp_client()
            sender.sendmail(from_address, to_address, msg.as_string())
            sender.quit()
        current_app.logger.debug(f"Email sent {to_address}")

    @staticmethod
    def _init_smtp_client():
        """ Initialise SMTP client from app settings """
        smtp_settings = current_app.config["SMTP_SETTINGS"]
        sender = smtplib.SMTP(smtp_settings["host"], port=smtp_settings["smtp_port"])
        sender.starttls()
        sender.login(smtp_settings["smtp_user"], smtp_settings["smtp_password"])

        return sender

    @staticmethod
    def _generate_email_verification_url(email_address: str, user_name: str):
        """ Generate email verification url with unique token """
        entropy = current_app.secret_key if current_app.secret_key else "un1testingmode"

        serializer = URLSafeTimedSerializer(entropy)
        token = serializer.dumps(email_address)

        base_url = current_app.config["APP_BASE_URL"]

        verification_params = {"token": token, "username": user_name}
        verification_url = "{0}/verify-email/?{1}".format(
            base_url, urllib.parse.urlencode(verification_params)
        )

        return verification_url
