import unittest
from unittest.mock import patch
from urllib.parse import urlparse, parse_qs

from server import create_app
from server.services.users.authentication_service import AuthenticationService, AuthServiceError, UserService, NotFound
from server.services.messaging.smtp_service import SMTPService
from tests.server.helpers.test_helpers import get_canned_osm_user_details


class TestAuthenticationService(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_unable_to_find_user_in_osm_response_raises_error(self):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act / Assert
        with self.assertRaises(AuthServiceError):
            AuthenticationService().login_user(osm_response, '/test/redirect', 'wont-find')

    @patch.object(UserService, 'get_user_by_id')
    def test_if_user_get_called_with_osm_id(self, mock_user_get):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        AuthenticationService.login_user(osm_response, '/test/redirect')

        # Assert
        mock_user_get.assert_called_with(7777777)

    @patch.object(UserService, 'register_user')
    @patch.object(UserService, 'get_user_by_id')
    def test_if_user_create_called_if_user_not_found(self, mock_user_get, mock_user_register):
        # Arrange
        osm_response = get_canned_osm_user_details()
        mock_user_get.side_effect = NotFound()

        # Act
        AuthenticationService.login_user(osm_response, '/test/redirect')

        # Assert
        mock_user_register.assert_called_with(7777777, 'Thinkwhere Test', 16)

    @patch.object(UserService, 'get_user_by_id')
    def test_valid_auth_request_gets_token(self, mock_user_get):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        redirect_url = AuthenticationService.login_user(osm_response, '/test/redirect')

        # Assert
        parsed_url = urlparse(redirect_url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(query['username'][0], 'Thinkwhere Test')
        self.assertTrue(query['session_token'][0])
        self.assertEqual(query['redirect_to'][0], '/test/redirect')

    def test_get_authentication_failed_url_returns_expected_url(self):
        # Act
        auth_failed_url = AuthenticationService.get_authentication_failed_url()

        # Assert
        parsed_url = urlparse(auth_failed_url)
        self.assertEqual(parsed_url.path, '/auth-failed')

    def test_can_parse_email_verification_token(self):
        # Arrange - Generate valid email verification url
        test_email = 'test@test.com'
        auth_url = SMTPService._generate_email_verification_url(test_email, 'mrtest')

        parsed_url = urlparse(auth_url)
        query = parse_qs(parsed_url.query)

        # Arrange
        is_valid, email_address = AuthenticationService.is_valid_token(query['token'][0], 86400)

        # Assert
        self.assertTrue(is_valid)
        self.assertEqual(email_address, test_email)
