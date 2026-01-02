import base64

from backend.services.organisation_service import OrganisationService
import pytest
from httpx import AsyncClient

from backend.exceptions import get_message_from_sub_code
from backend.services.users.authentication_service import AuthenticationService
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
    create_canned_interest,
    add_manager_to_organisation,
    return_canned_user,
)

TEST_INTEREST_NAME = "test_interest"
NEW_INTEREST_NAME = "New Interest"
INTEREST_NOT_FOUND_SUB_CODE = "INTEREST_NOT_FOUND"
INTEREST_NOT_FOUND_MESSAGE = get_message_from_sub_code(INTEREST_NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestInterestsAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_organisation = await create_canned_organisation(self.db)
        self.org_record = await OrganisationService.get_organisation_by_id(23, self.db)
        self.test_user = await create_canned_user(
            self.db, await return_canned_user(self.db)
        )
        self.test_interest = await create_canned_interest(self.db)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.session_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )
        self.endpoint_url = "/api/v2/interests/"

    async def test_create_a_new_interest_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(self.endpoint_url, json={"name": NEW_INTEREST_NAME})
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_create_a_new_interest_by_non_admin_fails(self, client: AsyncClient):
        # non-admin (regular user) tries to create interest
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "InterestsAllAPI POST: User not a Org Manager"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_create_a_new_interest_using_invalid_data_fails(
        self, client: AsyncClient
    ):
        # make user an org manager first
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": 1233},
        )
        assert resp.status_code == 422

    async def test_create_an_already_existing_interest_by_organisation_admin_fails(
        self, client: AsyncClient
    ):
        # make user an org manager
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": TEST_INTEREST_NAME},
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["Error"] == f"Value '{TEST_INTEREST_NAME}' already exists"
        assert body["SubCode"] == "NameExists"

    async def test_create_a_new_interest_by_organisation_admin_passes(
        self, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == NEW_INTEREST_NAME

    async def test_create_a_new_interest_with_empty_name_fails(
        self, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": ""},
        )
        assert resp.status_code == 422
        body = resp.json()
        assert body["detail"][0]["type"] == "string_too_short"

    async def test_get_all_interest_passes(self, client: AsyncClient):
        resp = await client.get(self.endpoint_url)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body.get("interests"), list)
        assert any(i.get("name") == TEST_INTEREST_NAME for i in body["interests"])


@pytest.mark.anyio
class TestInterestsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_organisation = await create_canned_organisation(self.db)
        self.org_record = await OrganisationService.get_organisation_by_id(23, self.db)
        self.test_user = await create_canned_user(
            self.db, await return_canned_user(self.db)
        )
        self.test_interest = await create_canned_interest(self.db)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.session_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )
        self.endpoint_url = f"/api/v2/interests/{self.test_interest.id}/"
        self.non_existent_interest_url = "/api/v2/interests/99/"

    async def test_get_an_interest_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.get(self.endpoint_url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_get_an_interest_by_non_admin_fails(self, client: AsyncClient):
        resp = await client.get(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "InterestsRestAPI GET: User not a Org Manager"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_get_a_non_existent_interest_fails(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.get(
            self.non_existent_interest_url,
            headers={"Authorization": self.session_token},
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == INTEREST_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == INTEREST_NOT_FOUND_SUB_CODE

    async def test_get_an_existing_interest_by_organisation_admin_passes(
        self, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.get(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == TEST_INTEREST_NAME

    async def test_update_an_interest_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.patch(self.endpoint_url, json={"name": NEW_INTEREST_NAME})
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_update_an_interest_by_non_admin_fails(self, client: AsyncClient):
        resp = await client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "InterestsRestAPI PATCH: User not a Org Manager"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_update_a_non_existent_interest_fails(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.patch(
            self.non_existent_interest_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == INTEREST_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == INTEREST_NOT_FOUND_SUB_CODE

    async def test_update_an_existent_interest_with_invalid_data_fails(
        self, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": 122},
        )
        assert resp.status_code == 422

    async def test_update_an_interest_with_empty_name_fails(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": ""},
        )
        assert resp.status_code == 422

    async def test_update_an_existing_interest_by_organisation_admin_passes(
        self, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == NEW_INTEREST_NAME

    async def test_delete_an_interest_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.delete(self.endpoint_url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_delete_an_interest_by_non_admin_fails(self, client: AsyncClient):
        resp = await client.delete(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "InterestsRestAPI DELETE: User not a Org Manager"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_delete_a_non_existent_interest_fails(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.delete(
            self.non_existent_interest_url,
            headers={"Authorization": self.session_token},
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == INTEREST_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == INTEREST_NOT_FOUND_SUB_CODE

    async def test_delete_an_existing_interest_by_organisation_admin_passes(
        self, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.delete(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["Success"] == "Interest deleted"
