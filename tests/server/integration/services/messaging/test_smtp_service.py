import os
import unittest
from urllib.parse import urlparse, parse_qs

from server import create_app
from server.services.messaging.smtp_service import SMTPService


class TestStatsService(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_send_verification_mail(self):
        if self.skip_tests:
            return

        self.assertTrue(SMTPService.send_verification_email('hot-test@mailinator.com', 'mrtest'))

    def test_send_mail(self):
        if self.skip_tests:
            return

        self.assertTrue(SMTPService.send_email_alert('hot-test@mailinator.com',
                                                     'http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/user/Iain%20Hunter'))

    def test_email_verification_url_generated_correctly(self):
        # Arrange
        test_user = 'mrtest'

        # Act
        url = SMTPService._generate_email_verification_url('test@test.com', test_user)

        parsed_url = urlparse(url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(parsed_url.path, '/api/auth/email')
        self.assertEqual(query['username'], [test_user])
        self.assertTrue(query['token'])  # Token random every time so just check we have something
