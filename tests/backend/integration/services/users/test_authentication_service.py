from unittest.mock import patch
import base64
from urllib.parse import parse_qs, urlparse
from itsdangerous import URLSafeTimedSerializer
from flask import current_app

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    get_canned_osm_user_details,
    return_canned_user,
    TEST_USERNAME,
)
from backend.services.messaging.smtp_service import SMTPService
from backend.services.users.authentication_service import (
    AuthenticationService,
    UserService,
    MessageService,
    NotFound,
    verify_token,
    AuthServiceError,
)

TEST_USER_EMAIL = "thinkwheretest@test.com"


class TestAuthenticationService(BaseTestCase):
    def test_verify_token_verifies_user_session_token(self):
        # Arrange
        token = AuthenticationService.generate_session_token_for_user(12345678)
        token = base64.b64encode(token.encode("utf-8"))
        token = token.decode("utf-8")

        # Act/Assert
        self.assertEqual(12345678, verify_token(token))
        self.assertFalse(verify_token(None))

    def test_unable_to_find_user_in_osm_response_raises_error(self):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act / Assert
        with self.assertRaises(AuthServiceError):
            AuthenticationService().login_user(osm_response, None, "wont-find")

    @patch.object(MessageService, "send_welcome_message")
    @patch.object(UserService, "register_user")
    @patch.object(UserService, "get_user_by_id")
    def test_if_login_user_calls_user_create_if_user_not_found(
        self, mock_user_get, mock_user_register, mock_message
    ):
        # Arrange
        osm_response = get_canned_osm_user_details()
        mock_user_get.side_effect = NotFound()

        # Act
        AuthenticationService.login_user(osm_response, None)

        # Assert
        mock_user_register.assert_called_with(7777777, TEST_USERNAME, 16, None, None)

    @patch.object(MessageService, "send_welcome_message")
    @patch.object(UserService, "register_user")
    @patch.object(UserService, "get_user_by_id")
    def test_if_login_user_calls_send_welcome_if_user_not_found(
        self, mock_user_get, mock_user_register, mock_message
    ):
        # Arrange
        osm_response = get_canned_osm_user_details()
        mock_user_get.side_effect = NotFound()
        new_user = return_canned_user()
        mock_user_register.return_value = new_user

        # Act
        AuthenticationService.login_user(osm_response, None)

        # Assert
        mock_message.assert_called_with(new_user)

    @patch.object(UserService, "update_user")
    @patch.object(UserService, "get_user_by_id")
    def test_if_login_user_calls_user_update_if_user_found(
        self, mock_user_get, mock_user_update
    ):
        # Arrange
        osm_response = get_canned_osm_user_details()
        osm_response["user"]["id"] = 12345678
        osm_response["user"]["display_name"] = "Thinkwhere Test2"

        # Act
        AuthenticationService.login_user(osm_response, None)

        # Assert
        mock_user_update.assert_called_with(12345678, "Thinkwhere Test2", None)

    @patch.object(UserService, "get_user_by_id")
    def test_if_login_user_returns_all_required_params(self, mock_user_get):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        user_params = AuthenticationService.login_user(osm_response, None)

        # Assert
        self.assertIsNotNone(user_params.get("username"))
        self.assertIsNotNone(user_params.get("session_token"))
        self.assertIn("picture", user_params)

    @patch.object(UserService, "get_user_by_username")
    def test_authenticate_email_token_raises_error_when_unable_to_find_user(
        self, mock_user_get
    ):
        # Arrange
        mock_user_get.side_effect = NotFound
        email_auth_url = SMTPService._generate_email_verification_url(
            TEST_USER_EMAIL, TEST_USERNAME
        )
        parsed_url = urlparse(email_auth_url)
        token = parse_qs(parsed_url.query)["token"][0]
        # Act/Assert
        with self.assertRaises(NotFound):
            AuthenticationService().authenticate_email_token(
                username=TEST_USERNAME,
                token=token,
            )

    def test_authenticate_email_token_raises_error_when_invalid_token_supplied(self):
        # Arrange
        test_user = return_canned_user(TEST_USERNAME)
        test_user.create()
        # Act/Assert
        with self.assertRaises(AuthServiceError):
            AuthenticationService().authenticate_email_token(
                username=TEST_USERNAME,
                # Invalid Token
                token="XnRoaW5rd2hlcmV0ZXN0QHRlc3QuY29tIg.YnIWEw.9yg8kxVJXDD6dxxIktYGgnCrZNE",
            )

    @patch.object(UserService, "get_user_by_username")
    def test_authenticate_email_token_returns_email_validated_url(self, mock_user_get):
        # Arrange
        mock_user_get.return_value = return_canned_user()
        mock_user_get.return_value.email_address = TEST_USER_EMAIL
        entropy = current_app.secret_key if current_app.secret_key else "un1testingmode"

        serializer = URLSafeTimedSerializer(entropy)

        # Act/Assert
        self.assertIsNotNone(
            AuthenticationService().authenticate_email_token(
                username=TEST_USERNAME,
                token=serializer.dumps(TEST_USER_EMAIL),
            )
        )

    @patch.object(UserService, "get_user_by_username")
    def test_authenticate_email_token_raises_error_if_email_not_matched(
        self, mock_user_get
    ):
        # Arrange
        mock_user_get.return_value = return_canned_user()
        mock_user_get.return_value.email_address = "thinkwheretest2@test.com"
        entropy = current_app.secret_key if current_app.secret_key else "un1testingmode"

        serializer = URLSafeTimedSerializer(entropy)

        # Act/Assert
        with self.assertRaises(AuthServiceError):
            AuthenticationService().authenticate_email_token(
                username=TEST_USERNAME,
                token=serializer.dumps(TEST_USER_EMAIL),
            )
