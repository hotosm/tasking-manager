from urllib.parse import parse_qs, urlparse

from backend.services.messaging.smtp_service import SMTPService
from backend.services.users.authentication_service import AuthenticationService


class TestAuthenticationService:
    def test_generate_session_token_for_user_returns_session_token(self):
        # Act
        session_token = AuthenticationService.generate_session_token_for_user(12345678)

        # Assert
        assert session_token is not None

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
        assert is_valid_token is True
        assert user_id == 12345678
        assert is_invalid_token is False
        assert _user_id == "BadSignature- Bad Token Signature"

    def test_get_authentication_failed_url_returns_expected_url(self):
        # Act
        auth_failed_url = AuthenticationService.get_authentication_failed_url()

        # Assert
        parsed_url = urlparse(auth_failed_url)
        assert parsed_url.path == "/auth-failed"

    def test_get_email_validated_url_returns_expected_url(self):
        # Act
        email_validated_url = AuthenticationService._get_email_validated_url(True)

        # Assert
        parsed_url = urlparse(email_validated_url)
        assert parsed_url.path == "/validate-email"

    def test_can_parse_email_verification_token(self):
        # Arrange
        test_email = "test@test.com"
        auth_url = SMTPService._generate_email_verification_url(test_email, "mrtest")

        parsed_url = urlparse(auth_url)
        query = parse_qs(parsed_url.query)

        # Act
        is_valid, email_address = AuthenticationService.is_valid_token(
            query["token"][0], 86400
        )

        # Assert
        assert is_valid is True
        assert email_address == test_email
