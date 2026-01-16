import base64
import logging
from backend.exceptions import NotFound
from backend.models.postgis.organisation import Organisation
from backend.services.organisation_service import OrganisationService
import pytest

from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    create_canned_user,
    create_canned_campaign,
    return_canned_campaign,
    add_manager_to_organisation,
    return_canned_user,
)

from tests.api.integration.api.campaigns.test_resources import (
    CAMPAIGN_NOT_FOUND_MESSAGE,
    CAMPAIGN_NOT_FOUND_SUB_CODE,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

CAMPAIGN_NAME = "New Campaign"
CAMPAIGN_ID = 2


@pytest.mark.anyio
class TestOrganisationsCampaignsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """Create org, campaign, project and users used across tests."""
        self.db = db_connection_fixture

        self.test_campaign = await create_canned_campaign(self.db)
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        try:
            org_record = await OrganisationService.get_organisation_by_id(23, self.db)
        except NotFound:
            test_org = await create_canned_organisation(self.db)
            org_record = await OrganisationService.get_organisation_by_id(
                test_org.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = org_record.organisation_id
        self.test_org.name = org_record.name
        self.test_org.slug = org_record.slug
        self.test_org.type = org_record.type

        await add_manager_to_organisation(org_record, self.test_author, self.db)

        self.non_admin_user = await return_canned_user(
            self.db, username="Non admin", id=88
        )
        self.non_admin_user = await create_canned_user(self.db, self.non_admin_user)
        # safe insert: won't error if the pair already exists
        await self.db.execute(
            """
            INSERT INTO campaign_organisations (campaign_id, organisation_id)
            VALUES (:campaign_id, :org_id)
            ON CONFLICT (campaign_id, organisation_id) DO NOTHING
            """,
            {
                "campaign_id": int(self.test_campaign.id),
                "org_id": int(self.test_org.id),
            },
        )
        # precompute auth tokens
        raw_author_token = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.author_token = base64.b64encode(raw_author_token.encode("utf-8")).decode(
            "utf-8"
        )

        raw_user_token = AuthenticationService.generate_session_token_for_user(
            self.non_admin_user.id
        )
        self.non_admin_user_token = base64.b64encode(
            raw_user_token.encode("utf-8")
        ).decode("utf-8")

        self.endpoint_url = f"/api/v2/organisations/{self.test_org.id}/campaigns/"

    async def test_add_already_assigned_campaign_to_same_org_fails(
        self, client: AsyncClient
    ):
        """
        If a campaign is already assigned to the organisation, trying to assign again should return 400.
        """
        # Attempt to assign the same campaign again
        resp = await client.post(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            json={
                "logo": None,
                "name": "Test Campaign",
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": f"Token {self.author_token}"},
        )
        assert resp.status_code == 400
        body = resp.json()
        # message text expected in original tests; keep same assertion
        assert body["Error"] == "Campaign 1 is already assigned to organisation 23."
        assert body["SubCode"] == "CampaignAlreadyAssigned"

    async def test_assign_org_new_campaign_passes(self, client: AsyncClient):
        """
        Assign a new campaign to the organisation (create a new campaign first).
        """

        new_campaign = return_canned_campaign(2, "New Campaign")
        new_campaign = await create_canned_campaign(self.db, new_campaign)
        # ensure it has a distinct id
        assert new_campaign.id is not None

        resp = await client.post(
            f"{self.endpoint_url}{new_campaign.id}/",
            json={
                "logo": None,
                "name": CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": f"Token {self.author_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert (
            body["Success"] == "campaign with id 2 assigned for organisation with id 23"
        )

    async def test_non_org_admin_assigns_new_campaign_to_org_fails(
        self, client: AsyncClient
    ):
        """
        Non-manager trying to assign a campaign to the organisation should get 403.
        """
        new_campaign = return_canned_campaign(33, "New Campaign")
        new_campaign = await create_canned_campaign(self.db, new_campaign)
        resp = await client.post(
            f"{self.endpoint_url}{new_campaign.id}/",
            json={
                "logo": None,
                "name": CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": f"Token {self.non_admin_user_token}"},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "User is not a manager of the organisation"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_get_organisation_campaigns_passes(self, client: AsyncClient):
        """
        GET should list campaigns for the organisation.
        """
        resp = await client.get(self.endpoint_url)
        assert resp.status_code == 200
        body = resp.json()
        assert body["campaigns"] == [{"id": 1, "name": "Test Campaign"}]

    async def test_delete_organisation_campaign_by_admin_passes(
        self, client: AsyncClient
    ):
        """
        Admin unassigns a campaign from an organisation.
        """
        resp = await client.delete(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            headers={"Authorization": f"Token {self.author_token}"},
        )
        assert resp.status_code == 200
        assert resp.json() == {
            "Success": "Organisation and campaign unassociated successfully"
        }

    async def test_delete_organisation_campaign_non_admin_fails(
        self, client: AsyncClient
    ):
        resp = await client.delete(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            headers={"Authorization": f"Token {self.non_admin_user_token}"},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "User is not a manager of the organisation"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_delete_non_existent_organisation_campaign_fails(
        self, client: AsyncClient
    ):
        resp = await client.delete(
            f"{self.endpoint_url}99999/",
            headers={"Authorization": f"Token {self.author_token}"},
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == CAMPAIGN_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == CAMPAIGN_NOT_FOUND_SUB_CODE
