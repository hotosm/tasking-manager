import os
import unittest
from urllib.parse import urlparse, parse_qs

from server import create_app
from server.models.postgis.user import User
from server.services.users.authentication_service import AuthenticationService
from tests.server.helpers.test_helpers import get_canned_osm_user_details


class TestAuthenticationService(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        if self.skip_tests:
            return

        self.ctx.pop()

    def test_unknown_user_creates_user_in_db(self):
        if self.skip_tests:
            return

        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        redirect_url = AuthenticationService().login_user(osm_response, '/test/redirect')

        # Assert
        parsed_url = urlparse(redirect_url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(query['username'][0], 'Thinkwhere Test')
        self.assertTrue(query['session_token'][0])
        self.assertEqual(query['redirect_to'][0], '/test/redirect')

    def test_email_verification_url_generated_correctly(self):
        # Arrange
        test_user = 'mrtest'

        # Act
        url = AuthenticationService.generate_email_verification_url('test@test.com', test_user)

        parsed_url = urlparse(url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(parsed_url.path, '/messaging/validate-email')
        self.assertEqual(query['username'], [test_user])
        self.assertTrue(query['token'])  # Token random every time so just check we have something
