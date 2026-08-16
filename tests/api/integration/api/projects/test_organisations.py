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


async def create_supporting_organisation(db):
    """Creates an organisation distinct from the one leading the canned project"""
    return await create_canned_organisation(
        db,
        return_canned_organisation(
            org_id=SUPPORTING_ORG_ID,
            org_name=SUPPORTING_ORG_NAME,
            org_slug=SUPPORTING_ORG_SLUG,
        ),
    )


@pytest.mark.anyio
class TestGetProjectOrganisationsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.test_organisation = await create_supporting_organisation(self.db)

        self.url = f"/api/v2/projects/{self.test_project_id}/organisations/"

    async def test_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999999/organisations/")
        assert resp.status_code == 404

    async def test_200_returns_lead_organisation_and_no_supporting_ones(
        self, client: AsyncClient
    ):
        resp = await client.get(self.url)
        assert resp.status_code == 200

        body = resp.json()
        assert body["leadOrganisationId"] == self.test_project.organisation_id
        assert body["supportingOrganisations"] == []

    async def test_200_inlines_supporting_organisation_details(
        self, client: AsyncClient
    ):
        await ProjectOrganisationService.create_project_organisation(
            self.test_project_id, self.test_organisation.id, self.db
        )

        resp = await client.get(self.url)
        assert resp.status_code == 200

        supporting = resp.json()["supportingOrganisations"]
        assert len(supporting) == 1
        assert supporting[0]["organisationId"] == self.test_organisation.id
        assert supporting[0]["organisationName"] == SUPPORTING_ORG_NAME
        assert supporting[0]["organisationSlug"] == SUPPORTING_ORG_SLUG


@pytest.mark.anyio
class TestAddProjectOrganisationAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.test_organisation = await create_supporting_organisation(self.db)

        self.test_user = await return_canned_user(self.db, "test_user", 11111111)
        self.test_user = await create_canned_user(self.db, self.test_user)

        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)

        self.url = (
            f"/api/v2/projects/{self.test_project_id}/organisations/"
            f"{self.test_organisation.id}/"
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
            f"/api/v2/projects/999999/organisations/{self.test_organisation.id}/",
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_404_if_organisation_not_found(self, client: AsyncClient):
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/organisations/999999/",
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_201_if_organisation_added(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 201

        organisations = (
            await ProjectOrganisationService.get_project_organisations_as_dto(
                self.test_project_id, self.db
            )
        )
        assert len(organisations.supporting_organisations) == 1
        assert (
            organisations.supporting_organisations[0].organisation_id
            == self.test_organisation.id
        )

    async def test_400_if_organisation_already_added(self, client: AsyncClient):
        await ProjectOrganisationService.create_project_organisation(
            self.test_project_id, self.test_organisation.id, self.db
        )

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 400
        assert resp.json()["error"]["sub_code"] == "ORGANISATION_ALREADY_LINKED"

    async def test_400_if_organisation_already_leads_the_project(
        self, client: AsyncClient
    ):
        """The lead organisation is stored on the project itself, so it cannot
        also be attached as a supporting organisation."""
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/organisations/"
            f"{self.test_project.organisation_id}/",
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 400
        assert resp.json()["error"]["sub_code"] == "ORGANISATION_IS_PROJECT_LEAD"

    async def test_201_if_organisation_supports_another_project(
        self, client: AsyncClient
    ):
        other_project, _, other_project_id = await create_canned_project(
            self.db, "Another canned project"
        )
        await ProjectOrganisationService.create_project_organisation(
            other_project_id, self.test_organisation.id, self.db
        )

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 201


@pytest.mark.anyio
class TestDeleteProjectOrganisationAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.test_organisation = await create_supporting_organisation(self.db)

        self.test_user = await return_canned_user(self.db, "test_user", 11111111)
        self.test_user = await create_canned_user(self.db, self.test_user)

        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)

        self.url = (
            f"/api/v2/projects/{self.test_project_id}/organisations/"
            f"{self.test_organisation.id}/"
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

    async def test_404_if_organisation_not_linked_to_project(self, client: AsyncClient):
        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 404

    async def test_200_if_organisation_removed(self, client: AsyncClient):
        await ProjectOrganisationService.create_project_organisation(
            self.test_project_id, self.test_organisation.id, self.db
        )

        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 200

        organisations = (
            await ProjectOrganisationService.get_project_organisations_as_dto(
                self.test_project_id, self.db
            )
        )
        assert organisations.supporting_organisations == []
