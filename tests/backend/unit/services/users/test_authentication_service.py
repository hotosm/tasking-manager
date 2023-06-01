from urllib.parse import urlparse, parse_qs

from backend.services.users.authentication_service import AuthenticationService
from backend.services.messaging.smtp_service import SMTPService
from tests.backend.base import BaseTestCase


class TestAuthenticationService(BaseTestCase):
    def test_generate_session_token_for_user_returns_session_token(self):
        # Act
        session_token = AuthenticationService.generate_session_token_for_user(12345678)

        # Assert
        self.assertIsNotNone(session_token)

    def test_is_valid_token_validates_user_token(self):
        # Arrange
        session_token = AuthenticationService.generate_session_token_for_user(12345678)
        invalid_session_token = session_token + "x"

        # Act
        is_valid_token, user_id = AuthenticationService.is_valid_token(
            session_token, 604800
        )
        is_invalid_token, _user_id = AuthenticationService.is_valid_token(
            invalid_session_token, 604800
        )

        # Assert
        self.assertEqual(user_id, 12345678)
        self.assertTrue(is_valid_token)
        self.assertFalse(is_invalid_token)
        # Since token is invalid it should return the error message instead of the user id
        self.assertEqual(_user_id, "BadSignature- Bad Token Signature")

    def test_get_authentication_failed_url_returns_expected_url(self):
        # Act
        auth_failed_url = AuthenticationService.get_authentication_failed_url()

        # Assert
        parsed_url = urlparse(auth_failed_url)
        self.assertEqual(parsed_url.path, "/auth-failed")

    def test_get_email_validated_url_returns_expected_url(self):
        # Act
        auth_failed_url = AuthenticationService._get_email_validated_url(True)

        # Assert
        parsed_url = urlparse(auth_failed_url)
        self.assertEqual(parsed_url.path, "/validate-email")

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
