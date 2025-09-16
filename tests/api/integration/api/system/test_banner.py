import base64
import pytest
import logging

from httpx import AsyncClient
from backend.services.users.authentication_service import AuthenticationService
from tests.api.helpers.test_helpers import return_canned_user
from tests.api.helpers.test_helpers import create_canned_user

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@pytest.mark.anyio
class TestBannerAPI:
    @pytest.fixture(autouse=True)
    def _setup(self):
        self.url = "/api/v2/system/banner/"

    async def test_get_banner(self, client: AsyncClient):
        logger.info("Starting test: GET banner")
        response = await client.get(self.url)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Welcome to the API"
        assert data["visible"] is True
        logger.info("Completed test: GET banner")

    async def test_patch_banner_invalid_data(
        self, client: AsyncClient, db_connection_fixture
    ):
        logger.info("Starting test: PATCH banner with invalid data")

        test_user = return_canned_user()
        await create_canned_user(db_connection_fixture, test_user)

        session_token = AuthenticationService.generate_session_token_for_user(
            test_user.id
        )
        session_token = base64.b64encode(session_token.encode("utf-8")).decode("utf-8")
        auth_header = {"Authorization": f"Token {session_token}"}
        logger.info("" f"Token {session_token}")

        response = await client.patch(
            self.url,
            json={"message": "### Updated message", "visible": "OK"},
            headers=auth_header,
        )
        assert response.status_code == 422

        body = response.json()
        assert "detail" in body
        first_error = body["detail"][0]
        assert first_error["loc"] == ["body", "visible"]
        assert first_error["type"] == "bool_parsing"

    async def test_patch_banner_non_admin(
        self, client: AsyncClient, db_connection_fixture
    ):
        logger.info("Starting test: PATCH banner with non-admin user")

        test_user = return_canned_user()
        await create_canned_user(db_connection_fixture, test_user)

        session_token = AuthenticationService.generate_session_token_for_user(
            test_user.id
        )
        session_token = base64.b64encode(session_token.encode("utf-8")).decode("utf-8")
        auth_header = {"Authorization": f"Token {session_token}"}

        response = await client.patch(
            self.url,
            json={"message": "### Updated message", "visible": True},
            headers=auth_header,
        )

        assert response.status_code == 403
        assert response.json()["SubCode"] == "OnlyAdminAccess"
        logger.info("Completed test: PATCH banner with non-admin user")

    async def test_patch_banner_admin(self, client: AsyncClient, db_connection_fixture):
        logger.info("Starting test: PATCH banner with admin user")

        test_user = return_canned_user()
        test_user.role = 1  # Admin
        await create_canned_user(db_connection_fixture, test_user)
        await db_connection_fixture.execute(
            """
            INSERT INTO banner (id, message, visible)
            VALUES (:id, :message, :visible)
            """,
            {"id": 10, "message": "Welcome to the API", "visible": True},
        )
        session_token = AuthenticationService.generate_session_token_for_user(
            test_user.id
        )
        session_token = base64.b64encode(session_token.encode("utf-8")).decode("utf-8")
        auth_header = {"Authorization": f"Token {session_token}"}
        response = await client.patch(
            self.url,
            json={"message": "### Updated message", "visible": True},
            headers=auth_header,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "<h3>Updated message</h3>"
        assert data["visible"] is True
        logger.info("Completed test: PATCH banner with admin user")
