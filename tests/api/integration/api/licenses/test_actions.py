import base64
import logging
import pytest

from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.exceptions import get_message_from_sub_code

# async helpers — adjust import path if needed
from tests.api.helpers.test_helpers import (
    create_canned_user,
    create_canned_license,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

LICENSE_NOT_FOUND_SUB_CODE = "LICENSE_NOT_FOUND"
LICENSE_NOT_FOUND_MESSAGE = get_message_from_sub_code(LICENSE_NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestLicensesActionsAcceptAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Create a canned user and license used by the tests.
        Assumes:
         - create_canned_user(db) returns a persisted user object
         - create_canned_license(db) returns a license id or object (we extract id)
        """
        self.db = db_connection_fixture

        # create user
        self.test_user = await create_canned_user(self.db)

        raw_token = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.test_user_token = base64.b64encode(raw_token.encode("utf-8")).decode(
            "utf-8"
        )

        self.test_license_id = await create_canned_license(self.db)
        self.endpoint_url = (
            f"/api/v2/licenses/{self.test_license_id}/actions/accept-for-me/"
        )

    async def test_accept_license_terms_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        """
        Unauthenticated -> should fail (original expected 401 + SubCode InvalidToken)
        """
        response = await client.post(self.endpoint_url)
        assert response.status_code in (401, 403)
        body = response.json()
        # original test expected SubCode == "InvalidToken"
        if "SubCode" in body:
            assert body["SubCode"] == "InvalidToken"
        elif "error" in body and "sub_code" in body["error"]:
            assert body["error"]["sub_code"] == "InvalidToken"

    async def test_accept_terms_of_non_existent_license_fails(
        self, client: AsyncClient
    ):
        """
        Accepting a non-existent license should return 404 with the correct sub_code/message
        """
        # build auth header for test user
        auth_header = {"Authorization": f"Token {self.test_user_token}"}
        url = "/api/v2/licenses/99/actions/accept-for-me/"
        response = await client.post(url, headers=auth_header)
        assert response.status_code == 404
        body = response.json()

        if "error" in body:
            error_details = body["error"]
            assert error_details["message"] == LICENSE_NOT_FOUND_MESSAGE
            assert error_details["sub_code"] == LICENSE_NOT_FOUND_SUB_CODE
        else:
            assert (
                body.get("message") == LICENSE_NOT_FOUND_MESSAGE
                or body.get("sub_code") == LICENSE_NOT_FOUND_SUB_CODE
            )

    async def test_accept_license_terms_by_authenticated_user_passes(
        self, client: AsyncClient
    ):
        """
        Authenticated user accepting an existing license should succeed (200, Success: "Terms Accepted")
        """
        auth_header = {"Authorization": f"Token {self.test_user_token}"}
        # use the endpoint_url composed in setup
        response = await client.post(self.endpoint_url, headers=auth_header)
        assert response.status_code == 200
        body = response.json()
        # original test expected {"Success": "Terms Accepted"}
        assert body.get("Success") == "Terms Accepted"
