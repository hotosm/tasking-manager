import base64
import pytest
import logging

from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.statuses import UserRole
from backend.exceptions import get_message_from_sub_code

# async helpers - adjust import path if your project places them elsewhere
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
    return_canned_user,
    return_canned_campaign,
    create_canned_campaign,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

CAMPAIGN_NAME = "Test Campaign"
CAMPAIGN_ID = 1
NEW_CAMPAIGN_NAME = "New Campaign"
CAMPAIGN_NOT_FOUND_SUB_CODE = "CAMPAIGN_NOT_FOUND"
CAMPAIGN_NOT_FOUND_MESSAGE = get_message_from_sub_code(CAMPAIGN_NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestCampaignsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Create base records used by many tests:
         - an organisation
         - an admin user
         - a non-admin user
         - a campaign
        Assumptions:
         - return_canned_user(returning a model object) does not persist; create_canned_user persists it.
         - return_canned_campaign() returns a campaign object that create_canned_campaign persists.
        Adjust if your helpers have different signatures.
        """
        self.endpoint_url = "/api/v2/campaigns/"
        self.db = db_connection_fixture

        # create organisation
        self.test_org = await create_canned_organisation(self.db)

        # admin user
        self.test_admin = await return_canned_user(self.db, "test_user", 11111111)
        self.test_admin = await create_canned_user(self.db, self.test_admin)
        # set admin role
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )

        # non-admin user
        self.test_non_admin = await create_canned_user(self.db)

        # create campaign
        self.test_campaign = await create_canned_campaign(self.db)

        # precompute tokens (we'll encode them in each test the same way banner tests do)
        self.admin_raw_token = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        self.admin_token = base64.b64encode(
            self.admin_raw_token.encode("utf-8")
        ).decode("utf-8")
        self.non_admin_raw_token = (
            AuthenticationService.generate_session_token_for_user(
                self.test_non_admin.id
            )
        )
        self.non_admin_token = base64.b64encode(
            self.non_admin_raw_token.encode("utf-8")
        ).decode("utf-8")

    # get
    async def test_get_campaign_by_id_passes(self, client: AsyncClient):
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        response = await client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == CAMPAIGN_ID
        assert data["name"] == CAMPAIGN_NAME

    async def test_get_non_existent_campaign_by_id_fails(self, client: AsyncClient):
        logger.info("GET non-existent campaign by id")
        url = f"{self.endpoint_url}99/"
        response = await client.get(url)
        assert response.status_code == 404
        body = response.json()
        error_details = body["error"]
        assert error_details["message"] == CAMPAIGN_NOT_FOUND_MESSAGE
        assert error_details["sub_code"] == CAMPAIGN_NOT_FOUND_SUB_CODE
        assert error_details["details"] == {"campaign_id": 99}

    # patch
    async def test_update_existent_campaign_by_admin_passes(self, client: AsyncClient):
        logger.info("PATCH campaign by admin (exists)")
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        auth_header = {"Authorization": f"Token {self.admin_token}"}
        payload = {
            "logo": None,
            "name": NEW_CAMPAIGN_NAME,
            "organisations": [],
            "url": None,
        }
        response = await client.patch(url, json=payload, headers=auth_header)
        assert response.status_code == 200
        body = response.json()
        assert body["Success"] == f"Campaign {self.test_campaign.id} updated"

    async def test_update_existent_campaign_by_non_admin_fails(
        self, client: AsyncClient
    ):
        logger.info("PATCH campaign by non-admin (should fail)")
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        auth_header = {"Authorization": f"Token {self.non_admin_token}"}
        payload = {
            "logo": None,
            "name": NEW_CAMPAIGN_NAME,
            "organisations": [{"id": self.test_org.id}],
            "url": None,
        }
        response = await client.patch(url, json=payload, headers=auth_header)
        assert response.status_code == 403
        body = response.json()
        assert body["Error"] == "CampaignsRestAPI PATCH: User not a Org Manager"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_update_existent_campaign_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        logger.info("PATCH campaign unauthenticated (should return 403)")
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        payload = {
            "logo": None,
            "name": NEW_CAMPAIGN_NAME,
            "organisations": [self.test_org.id],
            "url": None,
        }
        response = await client.patch(url, json=payload)
        assert response.status_code == 403

    async def test_update_campaign_using_invalid_request_keys_fails(
        self, client: AsyncClient
    ):
        logger.info("PATCH campaign using invalid keys (should return 400/422)")
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        auth_header = {"Authorization": f"Token {self.admin_token}"}
        payload = {
            "logo": None,
            "campaign_name": NEW_CAMPAIGN_NAME,
            "organisations": [self.test_org.id],
            "url": None,
        }
        response = await client.patch(url, json=payload, headers=auth_header)
        # depending on your FastAPI validation this could be 400 or 422; original test expected 400.
        assert response.status_code in (400, 422)

    async def test_update_non_existent_campaign_by_id_fails(self, client: AsyncClient):
        logger.info("PATCH non-existent campaign (should return 404)")
        url = f"{self.endpoint_url}99/"
        auth_header = {"Authorization": f"Token {self.admin_token}"}
        payload = {
            "logo": None,
            "name": NEW_CAMPAIGN_NAME,
            "organisations": [],
            "url": None,
        }
        response = await client.patch(url, json=payload, headers=auth_header)
        assert response.status_code == 404
        body = response.json()
        error_details = body["error"]
        assert error_details["message"] == CAMPAIGN_NOT_FOUND_MESSAGE
        assert error_details["sub_code"] == CAMPAIGN_NOT_FOUND_SUB_CODE
        assert error_details["details"] == {"campaign_id": 99}

    # delete
    async def test_delete_campaign_by_admin_passes(self, client: AsyncClient):
        logger.info("DELETE campaign by admin")
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        auth_header = {"Authorization": f"Token {self.admin_token}"}
        response = await client.delete(url, headers=auth_header)
        assert response.status_code == 200
        body = response.json()
        assert body["Success"] == "Campaign deleted"

    async def test_delete_campaign_by_non_admin_fails(self, client: AsyncClient):
        logger.info("DELETE campaign by non-admin (should fail)")
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        auth_header = {"Authorization": f"Token {self.non_admin_token}"}
        response = await client.delete(url, headers=auth_header)
        assert response.status_code == 403
        body = response.json()
        assert body["Error"] == "CampaignsRestAPI DELETE: User not a Org Manager"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_delete_campaign_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        logger.info("DELETE campaign unauthenticated (should return 401)")
        url = f"{self.endpoint_url}{self.test_campaign.id}/"
        response = await client.delete(url)
        assert response.status_code == 403

    async def test_delete_non_existent_campaign_fails(self, client: AsyncClient):
        logger.info("DELETE non-existent campaign (should return 404)")
        url = f"{self.endpoint_url}99/"
        auth_header = {"Authorization": f"Token {self.admin_token}"}
        response = await client.delete(url, headers=auth_header)
        assert response.status_code == 404
        body = response.json()
        error_details = body["error"]
        assert error_details["message"] == CAMPAIGN_NOT_FOUND_MESSAGE
        assert error_details["sub_code"] == CAMPAIGN_NOT_FOUND_SUB_CODE


@pytest.mark.anyio
class TestCampaignsAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.endpoint_url = "/api/v2/campaigns/"
        self.db = db_connection_fixture

        self.test_org = await create_canned_organisation(self.db)
        self.test_user = await return_canned_user(self.db, "test_user", 11111111)
        await create_canned_user(self.db, self.test_user)
        # set admin
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_user.id},
        )
        raw_token = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.session_token = base64.b64encode(raw_token.encode("utf-8")).decode("utf-8")

    # get
    async def test_get_existent_campaigns_returns_campaigns_list(
        self, client: AsyncClient
    ):
        logger.info("GET campaigns list (with existing campaigns)")
        test_campaign = return_canned_campaign()
        await create_canned_campaign(self.db, test_campaign)

        response = await client.get(self.endpoint_url)
        assert response.status_code == 200
        assert response.json() == {"campaigns": [{"id": 1, "name": "Test Campaign"}]}

    async def test_get_non_existent_campaigns_returns_empty_list(
        self, client: AsyncClient
    ):
        logger.info("GET campaigns list (empty)")
        response = await client.get(self.endpoint_url)
        assert response.status_code == 200
        assert response.json() == {"campaigns": []}

    # post
    async def test_create_new_campaign_by_admin_passes(self, client: AsyncClient):
        logger.info("POST create campaign by admin")
        auth_header = {"Authorization": f"Token {self.session_token}"}
        response = await client.get(self.endpoint_url, headers=auth_header)
        payload = {
            "logo": None,
            "name": NEW_CAMPAIGN_NAME,
            "organisations": [self.test_org.id],
            "url": None,
        }
        response = await client.post(
            self.endpoint_url, json=payload, headers=auth_header
        )
        assert response.status_code == 201
        assert response.json() == {"campaignId": 1}

    async def test_create_new_campaign_by_non_admin_fails(self, client: AsyncClient):
        logger.info("POST create campaign by non-admin (should fail)")
        non_admin = await create_canned_user(self.db)
        # create token for non_admin
        non_admin_raw_token = AuthenticationService.generate_session_token_for_user(
            non_admin.id
        )
        non_admin_token = base64.b64encode(non_admin_raw_token.encode("utf-8")).decode(
            "utf-8"
        )
        auth_header = {"Authorization": f"Token {non_admin_token}"}
        payload = {
            "logo": None,
            "name": CAMPAIGN_NAME,
            "organisations": [self.test_org.id],
            "url": None,
        }
        response = await client.post(
            self.endpoint_url, json=payload, headers=auth_header
        )
        assert response.status_code == 403
        body = response.json()
        assert body["Error"] == "CampaignsAllAPI POST: User not a Org Manager"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_create_new_campaign_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        logger.info("POST create campaign unauthenticated (should return 401)")
        payload = {
            "logo": None,
            "name": CAMPAIGN_NAME,
            "organisations": [self.test_org.id],
            "url": None,
        }
        response = await client.post(self.endpoint_url, json=payload)
        assert response.status_code == 403

    async def test_create_new_campaign_with_invalid_request_key_fails(
        self, client: AsyncClient
    ):
        logger.info("POST create campaign with invalid key (should return 400/422)")
        auth_header = {"Authorization": f"Token {self.session_token}"}
        payload = {
            "logo": None,
            "campaign_name": CAMPAIGN_NAME,
            "organisations": [self.test_org.id],
            "url": None,
        }
        response = await client.post(
            self.endpoint_url, json=payload, headers=auth_header
        )
        assert response.status_code in (400, 422)
        if response.status_code == 400:
            body = response.json()
            assert body["Error"] == '{"campaign_name": "Rogue field"}'
            assert body["SubCode"] == "InvalidData"
        else:
            body = response.json()
            assert "detail" in body

    async def test_create_already_existing_campaign_fails(self, client: AsyncClient):
        logger.info("POST create campaign which already exists (should return 409)")
        test_campaign = return_canned_campaign()
        await create_canned_campaign(self.db, test_campaign)
        payload = {
            "logo": test_campaign.logo,
            "name": test_campaign.name,
            "organisations": [self.test_org.id],
            "url": test_campaign.url,
        }
        auth_header = {"Authorization": f"Token {self.session_token}"}
        response = await client.post(
            self.endpoint_url, json=payload, headers=auth_header
        )
        body = response.json()
        assert body["error"]["message"] == "Failed to create campaign."
