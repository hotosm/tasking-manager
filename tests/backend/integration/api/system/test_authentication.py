from urllib import parse

from tests.backend.base import BaseTestCase
from backend.config import EnvironmentConfig
class TestSystemAuthenticationLoginAPI(BaseTestCase):

    def test_get_login_url(self):
        """ Test correct login url is returned """
        url = "/api/v2/system/authentication/login/"
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


