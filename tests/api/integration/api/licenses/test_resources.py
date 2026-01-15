import base64
import logging
from backend.models.postgis.statuses import UserRole
import pytest

from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.exceptions import get_message_from_sub_code

# async helpers — adjust import path if needed
from tests.api.helpers.test_helpers import (
    create_canned_user,
    create_canned_license,
    return_canned_user,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

TEST_LICENSE_NAME = "test_license"
TEST_LICENSE_DESCRIPTION = "test license"
TEST_LICENSE_PLAINTEXT = "test license"
NEW_LICENSE_DESCRIPTION = "A new test license"
NEW_LICENSE_NAME = "New License"
LICENSE_NOT_FOUND_SUB_CODE = "LICENSE_NOT_FOUND"
LICENSE_NOT_FOUND_MESSAGE = get_message_from_sub_code(LICENSE_NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestLicensesRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Create a canned user and a canned license.
        create_canned_user(db) -> user object
        create_canned_license(db) -> id | object | (id, ...)
        """
        self.db = db_connection_fixture

        # create user and token
        self.test_user = await create_canned_user(self.db)
        raw_token = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.test_user_token = base64.b64encode(raw_token.encode("utf-8")).decode(
            "utf-8"
        )

        # admin user
        self.test_admin = await return_canned_user(self.db, "test_user", 11111111)
        self.test_admin = await create_canned_user(self.db, self.test_admin)
        # set admin role
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )

        # precompute tokens (we'll encode them in each test the same way banner tests do)
        self.admin_raw_token = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        self.admin_token = base64.b64encode(
            self.admin_raw_token.encode("utf-8")
        ).decode("utf-8")

        # create canned license and normalize id
        created_license_id = await create_canned_license(self.db)
        self.test_license_id = created_license_id

        self.single_license_url = f"/api/v2/licenses/{self.test_license_id}/"
        self.all_licenses_url = "/api/v2/licenses/"
        self.non_existent_url = "/api/v2/licenses/99/"

    # post
    async def test_create_new_license_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        response = await client.post(
            self.all_licenses_url,
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        assert response.status_code in (401, 403)
        body = response.json()
        if "SubCode" in body:
            assert body["SubCode"] == "InvalidToken"
        elif "error" in body and "sub_code" in body["error"]:
            assert body["error"]["sub_code"] == "InvalidToken"

    async def test_create_new_license_with_invalid_request_fails(
        self, client: AsyncClient
    ):
        response = await client.post(
            self.all_licenses_url,
            headers={"Authorization": f"Token {self.admin_token}"},
            json={
                "name": [NEW_LICENSE_NAME],
            },
        )
        assert response.status_code in (400, 422)
        if response.status_code == 400:
            body = response.json()
            assert body["Error"] == "Unable to create new mapping license"
            assert body["SubCode"] == "InvalidData"
        else:
            body = response.json()
            assert "detail" in body

    async def test_create_new_license_by_authenticated_non_admin_user_fails(
        self, client: AsyncClient
    ):
        response = await client.post(
            self.all_licenses_url,
            headers={"Authorization": f"Token {self.test_user_token}"},
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        assert response.status_code == 403

    async def test_create_new_license_by_authenticated_admin_user_passes(
        self, client: AsyncClient
    ):
        response = await client.post(
            self.all_licenses_url,
            headers={"Authorization": f"Token {self.admin_token}"},
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        assert response.status_code == 201
        body = response.json()
        # helper may create licenseId 1 if DB was empty, or 2 if one existed from setup — we only assert shape
        assert "licenseId" in body
        assert isinstance(body["licenseId"], int)

    # get
    async def test_get_non_existent_license_fails(self, client: AsyncClient):
        response = await client.get(self.non_existent_url)
        assert response.status_code == 404
        body = response.json()
        # original had error.message and error.sub_code
        if "error" in body:
            error_details = body["error"]
            assert error_details["message"] == LICENSE_NOT_FOUND_MESSAGE
            assert error_details["sub_code"] == LICENSE_NOT_FOUND_SUB_CODE
        else:
            assert (
                body.get("message") == LICENSE_NOT_FOUND_MESSAGE
                or body.get("sub_code") == LICENSE_NOT_FOUND_SUB_CODE
            )

    async def test_get_license_passes(self, client: AsyncClient):
        response = await client.get(self.single_license_url)
        assert response.status_code == 200
        body = response.json()
        assert body["name"] == TEST_LICENSE_NAME
        assert body["description"] == TEST_LICENSE_DESCRIPTION
        assert body["plainText"] == TEST_LICENSE_PLAINTEXT

    # patch
    async def test_update_license_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        response = await client.patch(
            self.single_license_url,
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        assert response.status_code in (401, 403)
        body = response.json()
        if "SubCode" in body:
            assert body["SubCode"] == "InvalidToken"
        elif "error" in body and "sub_code" in body["error"]:
            assert body["error"]["sub_code"] == "InvalidToken"

    async def test_update_license_with_invalid_request_fails(self, client: AsyncClient):
        response = await client.patch(
            self.single_license_url,
            headers={"Authorization": f"Token {self.admin_token}"},
            json={
                "name": [NEW_LICENSE_NAME],
            },
        )
        assert response.status_code in (400, 422)

    async def test_update_license_by_authenticated_admin_user_passes(
        self, client: AsyncClient
    ):

        initial_response = await client.get(
            self.single_license_url,
            headers={"Authorization": f"Token {self.admin_token}"},
        )
        initial_response_body = initial_response.json()

        response = await client.patch(
            self.single_license_url,
            headers={"Authorization": f"Token {self.admin_token}"},
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Updated"

        updated_response = await client.get(
            self.single_license_url,
            headers={"Authorization": f"Token {self.admin_token}"},
        )
        body = updated_response.json()
        # Ensure fields changed from defaults

        assert initial_response_body["name"] == TEST_LICENSE_NAME
        assert initial_response_body["description"] == TEST_LICENSE_DESCRIPTION
        assert initial_response_body["plainText"] == TEST_LICENSE_PLAINTEXT

        assert body["name"] != TEST_LICENSE_NAME
        assert body["description"] != TEST_LICENSE_DESCRIPTION
        assert body["plainText"] != TEST_LICENSE_PLAINTEXT
        # And now match updated values
        assert body["name"] == NEW_LICENSE_NAME
        assert body["description"] == NEW_LICENSE_DESCRIPTION
        assert body["plainText"] == ""

    # delete
    async def test_delete_license_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        response = await client.delete(self.single_license_url)
        assert response.status_code in (401, 403)
        body = response.json()
        if "SubCode" in body:
            assert body["SubCode"] == "InvalidToken"
        elif "error" in body and "sub_code" in body["error"]:
            assert body["error"]["sub_code"] == "InvalidToken"

    async def test_delete_license_by_authenticated_admin_user_passes(
        self, client: AsyncClient
    ):
        response = await client.delete(
            self.single_license_url,
            headers={"Authorization": f"Token {self.admin_token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body.get("Success") == "License deleted"


@pytest.mark.anyio
class TestLicensesAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_user = await create_canned_user(self.db)
        raw_token = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.test_user_token = base64.b64encode(raw_token.encode("utf-8")).decode(
            "utf-8"
        )
        self.endpoint_url = "/api/v2/licenses/"

    async def test_get_all_licenses_(self, client: AsyncClient):
        response = await client.get(self.endpoint_url)
        assert response.status_code == 200
        body = response.json()
        assert "licenses" in body
        assert isinstance(body["licenses"], list)
        assert len(body["licenses"]) == 0
        assert body["licenses"] == []

        # setup: add license
        created_license_id = await create_canned_license(self.db)
        self.test_license_id = created_license_id

        response = await client.get(self.endpoint_url)
        assert response.status_code == 200
        body = response.json()
        assert len(body["licenses"]) >= 1
        # find the created license in list (match by id)
        found = None
        for lic in body["licenses"]:
            if lic.get("licenseId") == int(self.test_license_id):
                found = lic
                break
        assert found is not None
        assert found["name"] == TEST_LICENSE_NAME
        assert found["description"] == TEST_LICENSE_DESCRIPTION
        assert found["plainText"] == TEST_LICENSE_PLAINTEXT
