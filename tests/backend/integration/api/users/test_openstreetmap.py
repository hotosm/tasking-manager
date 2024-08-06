from unittest.mock import patch

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    return_canned_user,
    generate_encoded_token,
)
from backend.services.users.osm_service import OSMServiceError, OSMService, UserOSMDTO

TEST_USERNAME = "testuser"
TEST_USER_ID = 111111


class TestUsersOpenStreetMapAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.test_user.create()
        self.user_access_token = generate_encoded_token(TEST_USER_ID)
        self.url = f"/api/v2/users/{self.test_user.username}/openstreetmap/"

    def test_returns_401_if_user_not_authorized(self):
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_user_not_found(self):
        # Act
        response = self.client.get(
            "/api/v2/users/doesnotexist/openstreetmap/",
            headers={"Authorization": self.user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    @patch.object(OSMService, "get_osm_details_for_user")
    def test_returns_502_if_osm_service_error(self, mock_osm_service):
        # Arrange
        mock_osm_service.side_effect = OSMServiceError("Bad response from OSM")
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 502)

    @patch.object(OSMService, "get_osm_details_for_user")
    def test_returns_200_if_user_found(self, mock_osm_service):
        # Arrange
        user_dto = UserOSMDTO({"accountCreated": "1234567890", "changesetCount": 123})
        mock_osm_service.return_value = user_dto
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["accountCreated"], user_dto.account_created)
        self.assertEqual(response.json["changesetCount"], user_dto.changeset_count)
