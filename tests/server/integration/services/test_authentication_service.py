import os
import unittest
from urllib.parse import urlparse, parse_qs
from tests.server.helpers.test_helpers import get_canned_osm_user_details
from server import create_app
from server.services.authentication_service import AuthenticationService, AuthServiceError, User


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

        user = User().get_by_id(7777777)
        user.delete()

        self.ctx.pop()

    def test_unknown_user_creates_user_in_db(self):
        if self.skip_tests:
            return

        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        redirect_url = AuthenticationService().login_user(osm_response)

        # Assert
        parsed_url = urlparse(redirect_url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(query['username'][0], 'Thinkwhere Test')
        self.assertTrue(query['session_token'][0])
