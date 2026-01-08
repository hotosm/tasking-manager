import base64
from unittest.mock import AsyncMock, patch

from backend.services.users.user_service import UserService
import pytest
from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.services.users.osm_service import OSMServiceError, UserOSMDTO

from tests.api.helpers.test_helpers import create_canned_user, return_canned_user

TEST_USERNAME = "testuser"
TEST_USER_ID = 111111


@pytest.mark.anyio
class TestUsersOpenStreetMapAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        user_result = await return_canned_user(
            self.db, username=TEST_USERNAME, id=TEST_USER_ID
        )
        self.test_user = await create_canned_user(self.db, user_result)

        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_access_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

        self.url = f"/api/v2/users/{self.test_user.username}/openstreetmap/"

    async def test_returns_403_if_user_not_authorized(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_returns_404_if_user_not_found(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/users/doesnotexist/openstreetmap/",
            headers={"Authorization": self.user_access_token},
        )
        assert resp.status_code == 404

    @patch.object(UserService, "get_osm_details_for_user", new_callable=AsyncMock)
    async def test_returns_502_if_osm_service_error(
        self, mock_get_osm, client: AsyncClient
    ):
        mock_get_osm.side_effect = OSMServiceError("Bad response from OSM")

        resp = await client.get(
            self.url, headers={"Authorization": self.user_access_token}
        )

        assert resp.status_code == 502

    @patch.object(UserService, "get_osm_details_for_user", new_callable=AsyncMock)
    async def test_returns_200_if_user_found(self, mock_get_osm, client: AsyncClient):
        user_dto = UserOSMDTO(
            accountCreated="1234567890",
            changesetCount=123,
        )
        mock_get_osm.return_value = user_dto

        resp = await client.get(
            self.url, headers={"Authorization": self.user_access_token}
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["accountCreated"] == "1234567890"
        assert body["changesetCount"] == 123
