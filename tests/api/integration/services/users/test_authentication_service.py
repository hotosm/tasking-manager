import pytest
from unittest.mock import patch, AsyncMock
import base64
from urllib.parse import parse_qs, urlparse
from itsdangerous import URLSafeTimedSerializer
from backend.config import test_settings as settings


from backend.services.messaging.smtp_service import SMTPService
from backend.services.users.authentication_service import (
    AuthenticationService,
    UserService,
    MessageService,
    NotFound,
    verify_token,
    AuthServiceError,
)
from tests.api.helpers.test_helpers import (
    get_canned_osm_user_details,
    return_canned_user,
    create_canned_user,
    TEST_USERNAME,
)


TEST_USER_EMAIL = "thinkwheretest@test.com"


@pytest.mark.anyio
class TestAuthenticationService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create and persist test user used in some tests
        canned = await return_canned_user(
            username="TEST_USER", id=111111111, db=self.db
        )
        self.test_user = await create_canned_user(self.db, canned)

    async def test_verify_token_verifies_user_session_token(self):
        # Arrange
        token = AuthenticationService.generate_session_token_for_user(12345678)
        token = base64.b64encode(token.encode("utf-8")).decode("utf-8")

        # Act / Assert
        assert 12345678 == verify_token(token)
        assert not verify_token(None)

    async def test_unable_to_find_user_in_osm_response_raises_error(self):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act / Assert
        with pytest.raises(AuthServiceError):
            await AuthenticationService().login_user(
                osm_response, None, self.db, "wont-find"
            )

    @patch.object(MessageService, "send_welcome_message", new_callable=AsyncMock)
    @patch.object(UserService, "register_user", new_callable=AsyncMock)
    @patch.object(UserService, "get_and_save_stats", new_callable=AsyncMock)
    @patch.object(UserService, "update_user", new_callable=AsyncMock)
    async def test_if_login_user_calls_user_create_if_user_not_found(
        self,
        mock_update_user,
        mock_get_and_save_stats,
        mock_user_register,
        mock_message,
    ):
        # Arrange
        osm_response = get_canned_osm_user_details()
        mock_update_user.side_effect = NotFound()
        # Act
        await AuthenticationService.login_user(osm_response, None, self.db)
        # Assert
        mock_user_register.assert_called_with(
            7777777, TEST_USERNAME, 16, None, None, self.db
        )
        mock_get_and_save_stats.assert_awaited_once_with(7777777, self.db)
        mock_message.assert_awaited()

    @patch.object(MessageService, "send_welcome_message", new_callable=AsyncMock)
    @patch.object(UserService, "register_user", new_callable=AsyncMock)
    @patch.object(UserService, "get_and_save_stats", new_callable=AsyncMock)
    @patch.object(UserService, "update_user", new_callable=AsyncMock)
    async def test_if_login_user_calls_send_welcome_if_user_not_found(
        self,
        mock_update_user,
        mock_get_and_save_stats,
        mock_user_register,
        mock_message,
    ):
        # Arrange
        osm_response = get_canned_osm_user_details()
        # Make update_user raise NotFound so register_user path runs
        mock_update_user.side_effect = NotFound()

        new_user = await return_canned_user(self.db)
        # register_user is an AsyncMock; its await will return new_user
        mock_user_register.return_value = new_user

        # Act
        await AuthenticationService.login_user(osm_response, None, self.db)
        # Assert: send_welcome_message is awaited with (new_user, db)
        mock_message.assert_awaited_once_with(new_user, self.db)

    @patch.object(UserService, "update_user", new_callable=AsyncMock)
    @patch.object(UserService, "get_user_by_id", new_callable=AsyncMock)
    async def test_if_login_user_calls_user_update_if_user_found(
        self, mock_user_get, mock_user_update
    ):
        # Arrange - an existing user case: ensure update_user does NOT raise
        osm_response = get_canned_osm_user_details()
        osm_response["user"]["id"] = 12345678
        osm_response["user"]["display_name"] = "Thinkwhere Test2"

        # Act
        await AuthenticationService.login_user(osm_response, None, self.db)

        # Assert: update_user is awaited with (osm_id, display_name, picture, db)
        mock_user_update.assert_awaited_once_with(
            12345678, "Thinkwhere Test2", None, self.db
        )

    @patch.object(UserService, "get_and_save_stats", new_callable=AsyncMock)
    @patch.object(UserService, "update_user", new_callable=AsyncMock)
    async def test_if_login_user_returns_all_required_params(
        self, mock_update_user, mock_get_and_save_stats
    ):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        user_params = await AuthenticationService.login_user(
            osm_response, None, self.db
        )

        # Assert
        assert user_params.get("username") is not None
        assert user_params.get("session_token") is not None
        assert "picture" in user_params

    @patch.object(UserService, "get_user_by_username", new_callable=AsyncMock)
    async def test_authenticate_email_token_raises_error_when_unable_to_find_user(
        self, mock_user_get
    ):
        # Arrange
        mock_user_get.side_effect = NotFound()

        email_auth_url = SMTPService._generate_email_verification_url(
            TEST_USER_EMAIL, TEST_USERNAME
        )
        parsed_url = urlparse(email_auth_url)
        token = parse_qs(parsed_url.query)["token"][0]

        # Act / Assert
        with pytest.raises(NotFound):
            await AuthenticationService().authenticate_email_token(
                username=TEST_USERNAME,
                token=token,
                db=self.db,
            )

    @patch.object(UserService, "get_user_by_username", new_callable=AsyncMock)
    async def test_authenticate_email_token_raises_error_when_invalid_token_supplied(
        self, mock_user_get
    ):
        # Arrange
        user = await return_canned_user(self.db)
        user.email_address = TEST_USER_EMAIL
        mock_user_get.return_value = user

        # Act / Assert
        with pytest.raises(AuthServiceError):
            await AuthenticationService().authenticate_email_token(
                username=TEST_USERNAME,
                token="XnRoaW5rd2hlcmV0ZXN0QHRlc3QuY29tIg.YnIWEw.9yg8kxVJXDD6dxxIktYGgnCrZNE",
                db=self.db,
            )

    @patch.object(UserService, "get_user_by_username", new_callable=AsyncMock)
    @patch.object(AuthenticationService, "is_valid_token")
    async def test_authenticate_email_token_returns_email_validated_url(
        self, mock_is_valid_token, mock_user_get
    ):
        # Arrange
        user = await return_canned_user(self.db)
        user.email_address = TEST_USER_EMAIL
        mock_user_get.return_value = user

        mock_is_valid_token.return_value = (True, TEST_USER_EMAIL)

        # Act
        result = await AuthenticationService().authenticate_email_token(
            username=TEST_USERNAME,
            token="valid-token-does-not-matter",
            db=self.db,
        )

        # Assert
        assert result is not None

    @patch.object(UserService, "get_user_by_username", new_callable=AsyncMock)
    async def test_authenticate_email_token_raises_error_if_email_not_matched(
        self, mock_user_get
    ):
        # Arrange
        user = await return_canned_user(self.db)
        user.email_address = "thinkwheretest2@test.com"
        mock_user_get.return_value = user

        entropy = getattr(settings, "secret_key", None) or "un1testingmode"
        serializer = URLSafeTimedSerializer(entropy)

        # Act / Assert
        with pytest.raises(AuthServiceError):
            await AuthenticationService().authenticate_email_token(
                username=TEST_USERNAME,
                token=serializer.dumps(TEST_USER_EMAIL),
                db=self.db,
            )
