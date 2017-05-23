import os
import smtplib
import urllib.parse
from flask import current_app
from itsdangerous import URLSafeTimedSerializer
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class SMTPService:

    @staticmethod
    def send_verification_email(to_address: str):
        from_address = current_app.config['EMAIL_FROM_ADDRESS']

        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'HOT Tasking Manager - Email Verification'
        msg['From'] = from_address
        msg['To'] = to_address



    @staticmethod
    def send_email_alert(to_address: str, profile_link: str):
        from_address = current_app.config['EMAIL_FROM_ADDRESS']

        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'You have a new message on the HOT Tasking Manager'
        msg['From'] = from_address
        msg['To'] = to_address

        text = f'Hi\nYou have a new message on the HOT Tasking Manager.\n Messages can be viewed at this link {profile_link}'
        html = f'''\
        <html>
          <head></head>
          <body>
            <p>Hi<br>
               You have a new message on the HOT Tasking Manager.<br>
               <a href="{profile_link}">Click here to view it.</a>.
            </p>
          </body>
        </html>
        '''

        # Record the MIME types of both parts - text/plain and text/html.
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')

        msg.attach(part1)
        msg.attach(part2)

        sender = SMTPService._init_smtp_client()
        sender.sendmail(from_address, to_address, msg.as_string())
        sender.quit()

        return True

    @staticmethod
    def _generate_verification_url(email_address, user_id):
        """
        Helper method to construct the URL the customer will need to click to validate their account
        :param email_address: Customer email address in scope
        :return:
        """
        base_url = current_app.config['APP_BASE_UR']
        token = SMTPService._generate_timed_token(email_address)

        activation_params = {'token': token, 'id': user_id}
        activation_url = '{0}{1}'.format(base_url, urllib.parse.urlencode(activation_params))

        return activation_url

    @staticmethod
    def _generate_timed_token(email_address):
        """
        Generates a unique token with time embedded within it
        :return:
        """
        serializer = URLSafeTimedSerializer(current_app.secret)

        # Generate token using email
        token = serializer.dumps(email_address.lower())
        return token

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
