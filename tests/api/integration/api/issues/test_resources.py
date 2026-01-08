import base64
from backend.models.postgis.statuses import UserRole
import pytest

from backend.exceptions import get_message_from_sub_code
from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import (
    create_canned_user,
    return_canned_user,
    create_canned_mapping_issue,
)
from httpx import AsyncClient
from tests.api.integration.api.teams.test_actions import TEST_ADMIN_USERNAME

TEST_ISSUE_NAME = "Test Issue"
TEST_ISSUE_DESCRIPTION = "Test issue description"
ISSUE_NOT_FOUND_SUB_CODE = "ISSUE_CATEGORY_NOT_FOUND"
ISSUE_NOT_FOUND_MESSAGE = get_message_from_sub_code(ISSUE_NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestIssuesRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)

        admin_result = await return_canned_user(
            self.db, username=TEST_ADMIN_USERNAME, id=11111
        )
        self.test_admin = await create_canned_user(self.db, admin_result)

        # make admin
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )

        raw_admin = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)

        self.admin_token = (
            f"Token {base64.b64encode(raw_admin.encode('utf-8')).decode('utf-8')}"
        )
        self.test_user_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )
        self.test_issue_id = await create_canned_mapping_issue(self.db)
        self.url = f"/api/v2/tasks/issues/categories/{self.test_issue_id}/"
        self.non_existent_url = "/api/v2/tasks/issues/categories/99/"

    async def test_get_existing_issue_passes(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == TEST_ISSUE_NAME

    async def test_get_non_existent_issue_fails(self, client: AsyncClient):
        resp = await client.get(self.non_existent_url)
        assert resp.status_code == 404
        body = resp.json()
        err = body.get("error", {})
        assert err.get("message") == ISSUE_NOT_FOUND_MESSAGE
        assert err.get("sub_code") == ISSUE_NOT_FOUND_SUB_CODE

    async def test_update_issue_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.patch(
            self.url,
            json={"description": TEST_ISSUE_DESCRIPTION, "name": TEST_ISSUE_NAME},
        )
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_update_issue_with_invalid_request_data_fails(
        self, client: AsyncClient
    ):
        resp = await client.patch(
            self.url,
            headers={"Authorization": self.admin_token},
            json={"description": TEST_ISSUE_DESCRIPTION, "name": 123},
        )
        assert resp.status_code == 422

    async def test_update_non_existent_issue_fails(self, client: AsyncClient):
        resp = await client.patch(
            self.non_existent_url,
            headers={"Authorization": self.admin_token},
            json={"description": TEST_ISSUE_DESCRIPTION, "name": TEST_ISSUE_NAME},
        )
        assert resp.status_code == 404
        body = resp.json()
        err = body.get("error", {})
        assert err.get("message") == ISSUE_NOT_FOUND_MESSAGE
        assert err.get("sub_code") == ISSUE_NOT_FOUND_SUB_CODE

    async def test_update_mapping_issue_passes(self, client: AsyncClient):
        resp = await client.patch(
            self.url,
            headers={"Authorization": self.admin_token},
            json={"name": "New issue name", "description": TEST_ISSUE_DESCRIPTION},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "New issue name"
        assert body["description"] == TEST_ISSUE_DESCRIPTION

    async def test_delete_issue_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.delete(self.url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_delete_non_existent_issue_fails(self, client: AsyncClient):
        resp = await client.delete(
            self.non_existent_url, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 404
        body = resp.json()
        err = body.get("error", {})
        assert err.get("message") == ISSUE_NOT_FOUND_MESSAGE
        assert err.get("sub_code") == ISSUE_NOT_FOUND_SUB_CODE

    async def test_delete_mapping_issue_passes(self, client: AsyncClient):
        resp = await client.delete(
            self.url, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("Success") == "Mapping-issue category deleted"


@pytest.mark.anyio
class TestIssuesAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)

        admin_result = await return_canned_user(
            self.db, username=TEST_ADMIN_USERNAME, id=11111
        )
        self.test_admin = await create_canned_user(self.db, admin_result)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )
        raw_admin = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        self.admin_token = (
            f"Token {base64.b64encode(raw_admin.encode('utf-8')).decode('utf-8')}"
        )

        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.test_user_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )
        self.url = "/api/v2/tasks/issues/categories/"

    async def test_get_all_issues_passes(self, client: AsyncClient):
        # no issues
        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body.get("categories"), list)
        assert len(body["categories"]) == 0

        # add an issue
        await create_canned_mapping_issue(self.db)
        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["categories"]) == 1
        assert body["categories"][0]["name"] == TEST_ISSUE_NAME

    async def test_create_issue_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            json={"description": TEST_ISSUE_DESCRIPTION, "name": TEST_ISSUE_NAME},
        )
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_update_issue_with_invalid_request_data_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": self.admin_token},
            json={"description": None, "name": 12},
        )
        assert resp.status_code == 400

    async def test_create_mapping_issue_passes(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            headers={"Authorization": self.admin_token},
            json={"name": TEST_ISSUE_NAME, "description": TEST_ISSUE_DESCRIPTION},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "categoryId" in body
        assert isinstance(body["categoryId"], int)
        assert body["categoryId"] > 0
