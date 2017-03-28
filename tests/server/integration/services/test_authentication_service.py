from urllib.parse import urlparse, parse_qs
import unittest
from tests.server.helpers.test_helpers import get_canned_osm_user_details
from server import create_app
from server.services.authentication_service import AuthenticationService, AuthServiceError, User


class TestAuthenticationService(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        user = User().get(7777777)
        user.delete()

        self.ctx.pop()

    def test_unknown_user_creates_user_in_db(self):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        redirect_url = AuthenticationService().login_user(osm_response)

        # Assert
        parsed_url = urlparse(redirect_url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(query['username'][0], 'Thinkwhere Test')
        self.assertTrue(query['session_token'][0])
