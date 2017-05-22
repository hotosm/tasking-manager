import unittest

from server import create_app
from server.services.messaging.smtp_service import SMTPService


class TestStatsService(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_send_mail(self):
        SMTPService.send_email_alert('hot-test@mailinator.com', 'http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/user/Iain%20Hunter')
