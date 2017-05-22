import smtplib
from flask import current_app
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class SMTPService:

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
    def _init_smtp_client():
        """ Initialise SMTP client from app settings """
        smtp_settings = current_app.config['SMTP_SETTINGS']
        sender = smtplib.SMTP(smtp_settings['host'])
        sender.starttls()
        sender.login(smtp_settings['smtp_user'], smtp_settings['smtp_password'])

        return sender
