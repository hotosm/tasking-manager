import os
import smtplib
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from itsdangerous import URLSafeTimedSerializer

from flask import current_app


class SMTPService:

    @staticmethod
    def send_verification_email(to_address: str, username: str):
        """ Sends a verification email with a unique token so we can verify user owns this email address """

        # TODO these could be localised if needed, in the future
        html_template = SMTPService._get_template('email_verification_en.html')
        text_template = SMTPService._get_template('email_verification_en.txt')

        verification_url = SMTPService._generate_email_verification_url(to_address, username)

        html_template = html_template.replace('[USERNAME]', username)
        html_template = html_template.replace('[VEFIFICATION_LINK]', verification_url)

        text_template = text_template.replace('[USERNAME]', username)
        text_template = text_template.replace('[VEFIFICATION_LINK]', verification_url)

        subject = 'HOT Tasking Manager - Email Verification'
        SMTPService._send_mesage(to_address, subject, html_template, text_template)

        return True

    @staticmethod
    def send_email_alert(to_address: str, username: str):
        """ Send an email to user to alert them they have a new message"""

        # TODO these could be localised if needed, in the future
        html_template = SMTPService._get_template('message_alert_en.html')
        text_template = SMTPService._get_template('message_alert_en.txt')

        base_url = current_app.config['APP_BASE_URL']
        profile_url = f'{base_url}/user/{urllib.parse.quote(username)}'

        html_template = html_template.replace('[USERNAME]', username)
        html_template = html_template.replace('[PROFILE_LINK]', profile_url)

        text_template = text_template.replace('[USERNAME]', username)
        text_template = text_template.replace('[PROFILE_LINK]', profile_url)

        subject = 'You have a new message on the HOT Tasking Manager'
        SMTPService._send_mesage(to_address, subject, html_template, text_template)

        return True

    @staticmethod
    def _send_mesage(to_address: str, subject: str, html_message: str, text_message: str):
        """ Helper sends SMTP message """
        from_address = current_app.config['EMAIL_FROM_ADDRESS']

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_address
        msg['To'] = to_address

        # Record the MIME types of both parts - text/plain and text/html.
        part1 = MIMEText(text_message, 'plain')
        part2 = MIMEText(html_message, 'html')
        msg.attach(part1)
        msg.attach(part2)

        sender = SMTPService._init_smtp_client()
        sender.sendmail(from_address, to_address, msg.as_string())
        sender.quit()

    @staticmethod
    def _get_template(template_name) -> str:
        """
        Helper function to read the template from disk and return as a string to be manipulated
        :param template_name: The template we want to load
        :return: Template as a string
        """
        current_app.logger.debug('Getting template {0}'.format(template_name))

        try:
            template_location = os.path.join(os.path.dirname(__file__), 'templates/{0}'.format(template_name))
            template = open(template_location, mode='r', encoding='utf-8')
            return template.read()
        except FileNotFoundError:
            current_app.logger.error('Unable open file {0}'.format(template_location))
            raise ValueError('Unable open file {0}'.format(template_location))

    @staticmethod
    def _init_smtp_client():
        """ Initialise SMTP client from app settings """
        smtp_settings = current_app.config['SMTP_SETTINGS']
        sender = smtplib.SMTP(smtp_settings['host'])
        sender.starttls()
        sender.login(smtp_settings['smtp_user'], smtp_settings['smtp_password'])

        return sender

    @staticmethod
    def _generate_email_verification_url(email_address: str, user_name: str):
        """ Generate email verification url with unique token """
        entropy = current_app.secret_key if current_app.secret_key else 'un1testingmode'

        serializer = URLSafeTimedSerializer(entropy)
        token = serializer.dumps(email_address.lower())

        base_url = current_app.config['APP_BASE_URL']

        verification_params = {'token': token, 'username': user_name}
        verification_url = '{0}/api/auth/email?{1}'.format(base_url, urllib.parse.urlencode(verification_params))

        return verification_url
