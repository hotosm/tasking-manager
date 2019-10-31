import unittest
from unittest.mock import patch
from urllib.parse import urlparse, parse_qs

from server import create_app
from server.services.users.authentication_service import (
    AuthenticationService,
    AuthServiceError,
    UserService,
    NotFound,
    MessageService,
)
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
            AuthenticationService().login_user(osm_response, "wont-find")

    @patch.object(UserService, "get_user_by_id")
    def test_if_user_get_called_with_osm_id(self, mock_user_get):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        AuthenticationService.login_user(osm_response)

        # Assert
        mock_user_get.assert_called_with(7777777)

    @patch.object(MessageService, "send_welcome_message")
    @patch.object(UserService, "register_user")
    @patch.object(UserService, "get_user_by_id")
    def test_if_user_create_called_if_user_not_found(
        self, mock_user_get, mock_user_register, mock_message
    ):
        # Arrange
        osm_response = get_canned_osm_user_details()
        mock_user_get.side_effect = NotFound()

        # Act
        AuthenticationService.login_user(osm_response)

        # Assert
        mock_user_register.assert_called_with(7777777, "Thinkwhere Test", 16, None)

    @patch.object(UserService, "get_user_by_id")
    def test_valid_auth_request_gets_token(self, mock_user_get):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        params = AuthenticationService.login_user(osm_response)

        self.assertEqual(params["username"], "Thinkwhere Test")
        self.assertTrue(params["session_token"])

    def test_get_authentication_failed_url_returns_expected_url(self):
        # Act
        auth_failed_url = AuthenticationService.get_authentication_failed_url()

        # Assert
        parsed_url = urlparse(auth_failed_url)
        self.assertEqual(parsed_url.path, "/auth-failed")

    def test_can_parse_email_verification_token(self):
        # Arrange - Generate valid email verification url
        test_email = "test@test.com"
        auth_url = SMTPService._generate_email_verification_url(test_email, "mrtest")

        parsed_url = urlparse(auth_url)
        query = parse_qs(parsed_url.query)

        # Arrange
        is_valid, email_address = AuthenticationService.is_valid_token(
            query["token"][0], 86400
        )

        # Assert
        self.assertTrue(is_valid)
        self.assertEqual(email_address, test_email)
