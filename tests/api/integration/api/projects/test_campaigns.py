import pytest
from httpx import AsyncClient

from backend.models.dtos.campaign_dto import CampaignProjectDTO
from backend.services.campaign_service import CampaignService
from tests.api.helpers.test_helpers import (
    create_canned_campaign,
    create_canned_user,
    create_canned_project,
    return_canned_user,
    generate_encoded_token,
)


@pytest.mark.anyio
class TestGetProjectsCampaignsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_campaign = await create_canned_campaign(self.db)

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        self.url = f"/api/v2/projects/{self.test_project_id}/campaigns/"

    async def test_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999999/campaigns/")
        assert resp.status_code == 404

    async def test_200_if_project_found(self, client: AsyncClient):
        dto = CampaignProjectDTO(
            campaign_id=self.test_campaign.id,
            project_id=self.test_project_id,
        )

        await CampaignService.create_campaign_project(dto, self.db)

        resp = await client.get(self.url)
        assert resp.status_code == 200

        body = resp.json()
        assert len(body["campaigns"]) == 1
        assert body["campaigns"][0]["id"] == dto.campaign_id
        assert body["campaigns"][0]["name"] == self.test_campaign.name


@pytest.mark.anyio
class TestAddCampaignProjectAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_campaign = await create_canned_campaign(self.db)

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        self.test_user = await return_canned_user(self.db, "test_user", 11111111)
        self.test_user = await create_canned_user(self.db, self.test_user)
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)

        self.url = (
            f"/api/v2/projects/{self.test_project_id}/campaigns/"
            f"{self.test_campaign.id}/"
        )

    async def test_403_if_not_logged_in(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_403_if_not_project_manager(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_session_token}"},
        )
        assert resp.status_code == 403

    async def test_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.post(
            f"/api/v2/projects/999999/campaigns/{self.test_campaign.id}/",
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_404_if_campaign_not_found(self, client: AsyncClient):
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/campaigns/999999/",
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_200_if_campaign_added(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 200

        campaigns = await CampaignService.get_project_campaigns_as_dto(
            self.test_project_id, self.db
        )
        assert campaigns.campaigns[0].id == self.test_campaign.id
        assert campaigns.campaigns[0].name == self.test_campaign.name

    async def test_400_if_campaign_already_added(self, client: AsyncClient):
        dto = CampaignProjectDTO(
            campaign_id=self.test_campaign.id,
            project_id=self.test_project_id,
        )
        await CampaignService.create_campaign_project(dto, self.db)

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 400
        assert resp.json()["Error"] == "Project is already assigned to this campaign"
        assert resp.json()["SubCode"] == "CampaignAssignmentError"

    async def test_200_if_campaign_already_added_to_another_project(
        self, client: AsyncClient
    ):
        other_project, _, other_id = await create_canned_project(self.db)

        dto = CampaignProjectDTO(
            campaign_id=self.test_campaign.id,
            project_id=other_id,
        )
        await CampaignService.create_campaign_project(dto, self.db)

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 200


@pytest.mark.anyio
class TestDeleteCampaignProjectAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_campaign = await create_canned_campaign(self.db)

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        self.test_user = await return_canned_user(self.db, "test_user", 11111111)
        self.test_user = await create_canned_user(self.db, self.test_user)

        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)

        self.url = (
            f"/api/v2/projects/{self.test_project_id}/campaigns/"
            f"{self.test_campaign.id}/"
        )

    async def test_403_if_not_logged_in(self, client: AsyncClient):
        resp = await client.delete(self.url)
        assert resp.status_code == 403

    async def test_403_if_not_project_manager(self, client: AsyncClient):
        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_user_session_token}"},
        )
        assert resp.status_code == 403

    async def test_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.delete(
            f"/api/v2/projects/999999/campaigns/{self.test_campaign.id}/",
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_404_if_campaign_not_found(self, client: AsyncClient):
        resp = await client.delete(
            f"/api/v2/projects/{self.test_project_id}/campaigns/999999/",
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_returns_404_if_campaign_not_assigned_to_project(
        self, client: AsyncClient
    ):
        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_200_if_campaign_removed(self, client: AsyncClient):
        dto = CampaignProjectDTO(
            campaign_id=self.test_campaign.id,
            project_id=self.test_project_id,
        )
        await CampaignService.create_campaign_project(dto, self.db)

        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 200

        campaigns = await CampaignService.get_project_campaigns_as_dto(
            self.test_project_id, self.db
        )

        assert len(campaigns.campaigns) == 0
