import smtplib
from flask import current_app
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class SMTPService:

    @staticmethod
    def send_mail(subject: str, to_address: str):
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = 'noreply@mailinator.com'
        msg['To'] = to_address

        text = "Hi!\nHow are you?\nHere is the link you wanted:\nhttps://www.python.org"
        html = """\
        <html>
          <head></head>
          <body>
            <p>Hi!<br>
               How are you?<br>
               Here is the <a href="https://www.python.org">link</a> you wanted.
            </p>
          </body>
        </html>
        """

        # Record the MIME types of both parts - text/plain and text/html.
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')

        msg.attach(part1)
        msg.attach(part2)

        s = smtplib.SMTP('email-smtp.eu-west-1.amazonaws.com')
        s.starttls()
        # sendmail function takes 3 arguments: sender's address, recipient's address
        # and message to send - here it is sent as one string.
        s.log
        s.login('AKIAIIBGP3IBB3NWDX5Q', 'ApYTq+lAWqCaKzqVvY+2G3noYXyoFgS3s4Le4U1Jwhj0')
        s.sendmail('noreply@mailinator.com', to_address, msg.as_string())
        s.quit()