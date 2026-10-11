import pytest
from httpx import AsyncClient

from backend.services.project_organisation_service import ProjectOrganisationService
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    create_canned_user,
    generate_encoded_token,
    return_canned_organisation,
    return_canned_user,
)

SUPPORTING_ORG_ID = 24
SUPPORTING_ORG_NAME = "Supporting Organisation"
SUPPORTING_ORG_SLUG = "supporting_organisation"


class ProjectOrganisationsTestBase:
    """Shared setup: a project, plus an organisation that does not lead it.

    `create_canned_project` already attaches a lead organisation, so the
    organisation created here is always a valid candidate to support it.
    """

    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.test_organisation = await create_canned_organisation(
            self.db,
            return_canned_organisation(
                org_id=SUPPORTING_ORG_ID,
                org_name=SUPPORTING_ORG_NAME,
                org_slug=SUPPORTING_ORG_SLUG,
            ),
        )

        self.test_user = await return_canned_user(self.db, "test_user", 11111111)
        self.test_user = await create_canned_user(self.db, self.test_user)

        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)

        self.collection_url = f"/api/v2/projects/{self.test_project_id}/organisations/"
        self.url = f"{self.collection_url}{self.test_organisation.id}/"

    @property
    def author_header(self):
        return {"Authorization": f"Token {self.test_author_session_token}"}

    @property
    def non_manager_header(self):
        return {"Authorization": f"Token {self.test_user_session_token}"}

    async def link_supporting_organisation(self, project_id=None):
        await ProjectOrganisationService.create_project_organisation(
            project_id if project_id else self.test_project_id,
            self.test_organisation.id,
            self.db,
        )

    async def get_supporting_organisations(self):
        organisations = (
            await ProjectOrganisationService.get_project_organisations_as_dto(
                self.test_project_id, self.db
            )
        )
        return organisations.supporting_organisations


@pytest.mark.anyio
class TestGetProjectOrganisationsAPI(ProjectOrganisationsTestBase):
    async def test_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999999/organisations/")
        assert resp.status_code == 404

    async def test_200_returns_lead_organisation_and_no_supporting_ones(
        self, client: AsyncClient
    ):
        resp = await client.get(self.collection_url)
        assert resp.status_code == 200

        body = resp.json()
        assert body["leadOrganisationId"] == self.test_project.organisation_id
        assert body["supportingOrganisations"] == []

    async def test_200_inlines_supporting_organisation_details(
        self, client: AsyncClient
    ):
        await self.link_supporting_organisation()

        resp = await client.get(self.collection_url)
        assert resp.status_code == 200

        supporting = resp.json()["supportingOrganisations"]
        assert len(supporting) == 1
        assert supporting[0]["organisationId"] == self.test_organisation.id
        assert supporting[0]["organisationName"] == SUPPORTING_ORG_NAME
        assert supporting[0]["organisationSlug"] == SUPPORTING_ORG_SLUG


@pytest.mark.anyio
class TestAddProjectOrganisationAPI(ProjectOrganisationsTestBase):
    async def test_403_if_not_logged_in(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_403_if_not_project_manager(self, client: AsyncClient):
        resp = await client.post(self.url, headers=self.non_manager_header)
        assert resp.status_code == 403

    async def test_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.post(
            f"/api/v2/projects/999999/organisations/{self.test_organisation.id}/",
            headers=self.author_header,
        )
        assert resp.status_code == 404

    async def test_404_if_organisation_not_found(self, client: AsyncClient):
        resp = await client.post(
            f"{self.collection_url}999999/", headers=self.author_header
        )
        assert resp.status_code == 404

    async def test_201_if_organisation_added(self, client: AsyncClient):
        resp = await client.post(self.url, headers=self.author_header)
        assert resp.status_code == 201

        supporting = await self.get_supporting_organisations()
        assert len(supporting) == 1
        assert supporting[0].organisation_id == self.test_organisation.id

    async def test_400_if_organisation_already_added(self, client: AsyncClient):
        await self.link_supporting_organisation()

        resp = await client.post(self.url, headers=self.author_header)
        assert resp.status_code == 400
        assert resp.json()["error"]["sub_code"] == "ORGANISATION_ALREADY_LINKED"

    async def test_400_if_organisation_already_leads_the_project(
        self, client: AsyncClient
    ):
        """The lead organisation lives on the project itself, so it cannot also
        be attached as a supporting one."""
        resp = await client.post(
            f"{self.collection_url}{self.test_project.organisation_id}/",
            headers=self.author_header,
        )
        assert resp.status_code == 400
        assert resp.json()["error"]["sub_code"] == "ORGANISATION_IS_PROJECT_LEAD"

    async def test_201_if_organisation_supports_another_project(
        self, client: AsyncClient
    ):
        _, _, other_project_id = await create_canned_project(
            self.db, "Another canned project"
        )
        await self.link_supporting_organisation(project_id=other_project_id)

        resp = await client.post(self.url, headers=self.author_header)
        assert resp.status_code == 201


@pytest.mark.anyio
class TestDeleteProjectOrganisationAPI(ProjectOrganisationsTestBase):
    async def test_403_if_not_logged_in(self, client: AsyncClient):
        resp = await client.delete(self.url)
        assert resp.status_code == 403

    async def test_403_if_not_project_manager(self, client: AsyncClient):
        resp = await client.delete(self.url, headers=self.non_manager_header)
        assert resp.status_code == 403

    async def test_404_if_organisation_not_linked_to_project(self, client: AsyncClient):
        resp = await client.delete(self.url, headers=self.author_header)
        assert resp.status_code == 404

    async def test_200_if_organisation_removed(self, client: AsyncClient):
        await self.link_supporting_organisation()

        resp = await client.delete(self.url, headers=self.author_header)
        assert resp.status_code == 200

        assert await self.get_supporting_organisations() == []
