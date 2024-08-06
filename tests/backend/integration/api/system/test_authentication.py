from unittest.mock import patch
from urllib import parse
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError

from backend import osm
from tests.backend.base import BaseTestCase
from backend.config import EnvironmentConfig
from backend.services.users.user_service import UserService, NotFound
from backend.services.messaging.message_service import MessageService
from backend.services.messaging.smtp_service import SMTPService
from backend.services.users.authentication_service import AuthenticationService
from tests.backend.helpers.test_helpers import return_canned_user
from tests.backend.integration.api.users.test_resources import (
    USER_NOT_FOUND_MESSAGE,
    USER_NOT_FOUND_SUB_CODE,
)

USERNAME = "test_user"
USER_ID = 1234
USER_PICTURE = "test_href"
USER_EMAIL = "test_email"

USER_JSON = {
    "user": {
        "id": USER_ID,
        "display_name": USERNAME,
        "changesets": {"count": 0},
        "img": {"href": USER_PICTURE},
    }
}


class TestSystemAuthenticationLoginAPI(BaseTestCase):
    # Define environment variables for testing so that tests don't fail due to missing env variables
    EnvironmentConfig.OAUTH_CLIENT_ID = "test_client_id"
    EnvironmentConfig.OAUTH_REDIRECT_URI = "test_redirect_uri"
    EnvironmentConfig.OAUTH_SCOPE = "read_prefs write_api"

    def test_get_login_url(self):
        """Test correct login url is returned"""
        # Arrange
        url = "/api/v2/system/authentication/login/"
        # Set osm params to test values so that we can assert them later
        osm.client_id = EnvironmentConfig.OAUTH_CLIENT_ID
        osm.redirect_uri = EnvironmentConfig.OAUTH_REDIRECT_URI
        osm.scope = EnvironmentConfig.OAUTH_SCOPE
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json["auth_url"])
        self.assertIsNotNone(response.json["state"])
        self.assertEqual(
            response.json["auth_url"].split("?")[0],
            EnvironmentConfig.OSM_SERVER_URL + "/oauth2/authorize",
        )
        self.assertEqual(
            response.json["auth_url"].split("?")[1].split("&")[0], "response_type=code"
        )
        self.assertEqual(
            response.json["auth_url"].split("?")[1].split("&")[1],
            "client_id=" + EnvironmentConfig.OAUTH_CLIENT_ID,
        )
        self.assertEqual(
            response.json["auth_url"].split("?")[1].split("&")[2],
            "redirect_uri=" + parse.quote_plus(EnvironmentConfig.OAUTH_REDIRECT_URI),
        )
        self.assertEqual(
            response.json["auth_url"].split("?")[1].split("&")[3],
            "scope=" + ("+").join(EnvironmentConfig.OAUTH_SCOPE.split(" ")),
        )
        self.assertEqual(
            response.json["auth_url"].split("?")[1].split("&")[4],
            "state=" + response.json["state"],
        )


class TestSystemAuthenticationCallbackAPI(BaseTestCase):
    def test_returns_error_if_code_not_passed(self):
        url = "/api/v2/system/authentication/callback/"
        # Act
        response = self.client.get(url)
        # Assert
        print(response.json)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidData")
        self.assertEqual(response.json["Error"], "Missing code parameter")

    @patch.object(osm, "fetch_token")
    def test_returns_error_if_invalid_grant(self, mock_fetch_token):
        mock_fetch_token.side_effect = InvalidGrantError
        url = "/api/v2/system/authentication/callback/?code=1234"
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidGrantError")
        self.assertEqual(
            response.json["Error"],
            "The provided authorization grant is invalid, expired or revoked",
        )

    @patch.object(osm, "fetch_token")
    def test_returns_error_if_osm_response_is_none(self, mock_fetch_token):
        mock_fetch_token.return_value = None
        url = "/api/v2/system/authentication/callback/?code=1234"
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json["SubCode"], "TokenFetchError")
        self.assertEqual(response.json["Error"], "Couldn't fetch token from OSM.")

    @patch.object(osm, "fetch_token")
    @patch.object(osm, "get")
    def test_returns_error_if_osm_response_status_code_not_200(
        self, mock_get, mock_fetch_token
    ):
        mock_fetch_token.return_value = "1234"
        mock_get.return_value.status_code = 500
        url = "/api/v2/system/authentication/callback/?code=1234"
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json["SubCode"], "OSMServiceError")
        self.assertEqual(
            response.json["Error"], "Couldn't fetch user details from OSM."
        )

    @patch.object(osm, "fetch_token")
    @patch.object(osm, "get")
    def test_returns_error_if_auth_service_error(self, mock_get, mock_fetch_token):
        mock_fetch_token.return_value = "1234"
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {}
        url = "/api/v2/system/authentication/callback/?code=1234"
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json["SubCode"], "AuthError")
        self.assertEqual(response.json["Error"], "Unable to authenticate")

    @patch.object(MessageService, "send_welcome_message")
    @patch.object(osm, "fetch_token")
    @patch.object(osm, "get")
    def test_returns_user_params_if_no_auth_service_error(
        self, mock_get, mock_fetch_token, mock_send_welcome_message
    ):
        # Arrange
        user = return_canned_user(USERNAME, USER_ID)
        user.create()
        mock_fetch_token.return_value = USER_ID
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = USER_JSON
        url = "/api/v2/system/authentication/callback/?code=1234"
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["username"], user.username)
        self.assertEqual(response.json["session"], user.id)
        self.assertEqual(response.json["picture"], USER_PICTURE)
        mock_send_welcome_message.assert_not_called()

    @patch.object(MessageService, "send_welcome_message")
    @patch.object(osm, "fetch_token")
    @patch.object(osm, "get")
    def test_creates_user_on_login_if_not_exists(
        self, mock_get, mock_fetch_token, mock_send_welcome_message
    ):
        mock_fetch_token.return_value = USER_ID
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = USER_JSON
        url = (
            "/api/v2/system/authentication/callback/?code=1234&email_address=test_email"
        )
        # Assert
        with self.assertRaises(NotFound):
            UserService.get_user_by_username(
                USERNAME
            )  # Should raise NotFound since user doesn't exist
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["username"], USERNAME)
        self.assertEqual(response.json["session"], USER_ID)
        self.assertEqual(response.json["picture"], USER_PICTURE)
        self.assertEqual(
            UserService.get_user_by_username(USERNAME).email_address, "test_email"
        )
        mock_send_welcome_message.assert_called_once()


class TestSystemAuthenticationEmailAPI(BaseTestCase):
    def setUp(self):
        self.url = "/api/v2/system/authentication/email/"
        return super().setUp()

    def test_returns_404_if_user_does_not_exist(self):
        # Act
        response = self.client.get(
            self.url, query_string={"username": "non_existent_user"}
        )
        error_details = response.json["error"]
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["sub_code"], USER_NOT_FOUND_SUB_CODE)
        self.assertEqual(error_details["message"], USER_NOT_FOUND_MESSAGE)

    def test_returns_403_if_invalid_email_token(self):
        # Arrange
        user = return_canned_user(USERNAME, USER_ID)
        user.create()
        # Act
        response = self.client.get(
            self.url, query_string={"token": "1234", "username": USERNAME}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "BadSignature")
        self.assertEqual(response.json["Error"], " Bad Token Signature")

    @patch.object(AuthenticationService, "is_valid_token")
    def test_returns_403_if_expired_email_token(self, mock_is_valid_token):
        # Arrange
        # Since the token is only expired if it's older than 1 day, we need to mock the function to return False
        mock_is_valid_token.return_value = (False, "ExpiredToken- Token has expired")
        user = return_canned_user(USERNAME, USER_ID)
        user.create()
        verification_url = SMTPService._generate_email_verification_url(
            USER_EMAIL, USERNAME
        )
        token = verification_url.split("token=")[1].split("&")[0]
        # Act
        response = self.client.get(
            self.url, query_string={"token": token, "username": USERNAME}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "ExpiredToken")
        self.assertEqual(response.json["Error"], " Token has expired")

    def test_returns_403_if_token_and_email_mismatch(self):
        # Arrange
        user = return_canned_user(USERNAME, USER_ID)
        user.email_address = "test_email_2"
        user.create()
        verification_url = SMTPService._generate_email_verification_url(
            USER_EMAIL, USERNAME
        )
        token = verification_url.split("token=")[1].split("&")[0]
        # Act
        response = self.client.get(
            self.url, query_string={"token": token, "username": USERNAME}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "InvalidEmail")
        self.assertEqual(response.json["Error"], " Email address does not match token")

    def test_returns_200_if_valid_token(self):
        # Arrange
        user = return_canned_user(USERNAME, USER_ID)
        user.email_address = USER_EMAIL
        user.create()
        verification_url = SMTPService._generate_email_verification_url(
            USER_EMAIL, USERNAME
        )
        token = verification_url.split("token=")[1].split("&")[0]
        # Assert - User should not have email verified
        self.assertEqual(
            UserService.get_user_by_username(USERNAME).is_email_verified, False
        )
        # Act
        response = self.client.get(
            self.url, query_string={"token": token, "username": USERNAME}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            UserService.get_user_by_username(USERNAME).email_address, USER_EMAIL
        )
        self.assertEqual(
            UserService.get_user_by_username(USERNAME).is_email_verified, True
        )
