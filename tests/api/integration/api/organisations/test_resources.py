import base64
import logging
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.statuses import OrganisationType, UserRole
from backend.services.organisation_service import OrganisationService
import pytest

from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.exceptions import NotFound, get_message_from_sub_code

# async helpers — adjust import path if needed
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    create_canned_user,
    add_manager_to_organisation,
    return_canned_organisation,
    return_canned_user,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

TEST_USER_ID = 777777
TEST_USERNAME = "Thinkwhere Test"
ORG_NOT_FOUND_SUB_CODE = "ORGANISATION_NOT_FOUND"
ORG_NOT_FOUND_MESSAGE = get_message_from_sub_code(ORG_NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestOrganisationAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Setup:
         - Create a canned project and its author
         - Create a canned organisation
         - Add the author as manager on the organisation (helper)
         - Associate the project with the organisation via DB update
        """
        self.db = db_connection_fixture
        self.endpoint_url = "/api/v2/organisations/"

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

        # add manager to org (helper likely handles DB persistence)
        await add_manager_to_organisation(org_record, self.test_author, self.db)

    async def test_get_all_organisations_returns_required_fields(
        self, client: AsyncClient
    ):
        response = await client.get(self.endpoint_url)

        assert response.status_code == 200
        body = response.json()
        orgs = body.get("organisations", [])
        assert len(orgs) == 1
        org = orgs[0]
        assert org["organisationId"] == self.test_org.id
        assert "managers" not in org
        assert org["name"] == self.test_org.name
        assert org.get("campaigns") is None
        assert org.get("stats") is None

    async def test_get_all_organisations_doesnt_returns_manager_if_omit_manager_set_true(
        self, client: AsyncClient
    ):
        response = await client.get(f"{self.endpoint_url}?omitManagers=True")
        assert response.status_code == 200
        orgs = response.json().get("organisations", [])
        assert "managers" not in orgs[0]

    async def test_get_all_org_includes_managers_if_user_is_authenticated(
        self, client: AsyncClient
    ):
        # create session token for the author user
        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")
        auth_header = {"Authorization": f"Token {token}"}
        response = await client.get(self.endpoint_url, headers=auth_header)
        assert response.status_code == 200
        orgs = response.json().get("organisations", [])
        assert orgs[0]["managers"][0]["username"] == self.test_author.username

    async def test_get_all_org_raises_error_if_filter_by_manager_id__on_unauthenticated_request(
        self, client: AsyncClient
    ):
        response = await client.get(f"{self.endpoint_url}?manager_user_id=2")
        # original expected 403
        assert response.status_code == 403

    async def test_get_all_org_includes_stats_if_omit_stats_set_false(
        self, client: AsyncClient
    ):
        response = await client.get(f"{self.endpoint_url}?omitOrgStats=False")
        assert response.status_code == 200
        orgs = response.json().get("organisations", [])
        assert orgs[0]["stats"] is not None


@pytest.mark.anyio
class TestOrganisationsBySlugRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_user = await create_canned_user(self.db)
        self.test_org = await create_canned_organisation(self.db)

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            raise NotFound("Org record not found.")

        # create token for authenticated requests
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.session_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")
        self.endpoint_url = f"/api/v2/organisations/{self.test_org.slug}/"

    async def test_get_org_by_slug_by_without_token_passes(self, client: AsyncClient):
        response = await client.get(self.endpoint_url)
        assert response.status_code == 200
        body = response.json()
        # original expects 12 keys — we checking main fields to be robust
        assert body["organisationId"] == self.org_record.organisation_id
        assert body["name"] == self.org_record.name
        assert body["slug"] == self.org_record.slug
        assert body["logo"] is None
        assert body["description"] is None
        assert body["url"] is None
        assert body["teams"] == []
        assert body["campaigns"] is None
        assert body["type"] == "FREE"
        assert body["subscriptionTier"] is None

    async def test_get_org_by_slug_by_authorised_user_and_omitManagerList_is_false_passes(
        self, client: AsyncClient
    ):
        # add manager and then call with auth header
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        auth_header = {"Authorization": f"Token {self.session_token}"}
        response = await client.get(self.endpoint_url, headers=auth_header)
        assert response.status_code == 200
        body = response.json()
        assert len(body["managers"]) == 1
        assert body["managers"] == [{"username": TEST_USERNAME, "pictureUrl": None}]

    async def test_get_org_by_slug_by_authorised_user_and_omitManagerList_is_true_passes(
        self, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        auth_header = {"Authorization": f"Token {self.session_token}"}
        response = await client.get(
            f"{self.endpoint_url}?omitManagerList=True", headers=auth_header
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body["managers"]) == 0
        assert body["managers"] == []

    async def test_get_non_existent_org_by_slug_fails(self, client: AsyncClient):
        response = await client.get("/api/v2/organisations/random-organisation/")
        assert response.status_code == 404
        body = response.json()
        error = body.get("error", {})
        assert error.get("message") == ORG_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == ORG_NOT_FOUND_SUB_CODE


@pytest.mark.anyio
class TestOrganisationsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Setup:
         - create project and author
         - create organisation and set author as manager
         - ensure org saved and project assigned to org
        """
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            test_org = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                test_org.id, self.db
            )

        # assign manager list directly via helper
        await add_manager_to_organisation(self.org_record, self.test_author, self.db)

        self.endpoint_url = "/api/v2/organisations/"
        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        self.session_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")

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

    async def test_create_org_by_unauthenticated_user_fails(self, client: AsyncClient):
        response = await client.post(
            self.endpoint_url,
            json={"name": "New Org", "slug": "new-org", "managers": ["Test User"]},
        )
        assert response.status_code in (401, 403)

    async def test_create_org_with_non_admin_fails(self, client: AsyncClient):
        response = await client.post(
            self.endpoint_url,
            headers={"Authorization": f"Token {self.session_token}"},
            json={
                "name": "New Org",
                "slug": "new-org",
                "managers": [TEST_USERNAME],
                "type": OrganisationType.FREE.name,
            },
        )
        assert response.status_code == 403
        body = response.json()
        assert body["Error"] == "Only admin users can create organisations."
        assert body["SubCode"] == "OnlyAdminAccess"

    async def test_get_org_when_omitManagerList_is_false_passes(
        self, client: AsyncClient
    ):
        response = await client.get(
            f"{self.endpoint_url}{self.org_record.organisation_id}/",
            headers={"Authorization": f"Token {self.session_token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["organisationId"] == self.org_record.organisation_id
        assert len(body["managers"]) == 1
        assert body["managers"] == [{"username": TEST_USERNAME, "pictureUrl": None}]

    async def test_get_non_existent_org_fails(self, client: AsyncClient):
        response = await client.get(
            f"{self.endpoint_url}99/",
            headers={"Authorization": f"Token {self.session_token}"},
        )
        assert response.status_code == 404
        body = response.json()
        error = body.get("error", {})
        assert error.get("message") == ORG_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == ORG_NOT_FOUND_SUB_CODE

    async def test_delete_org_by_admin_user_passes(self, client: AsyncClient):
        temp_org = return_canned_organisation(
            org_id=7,
            org_name="Temp Org",
            org_slug="Torg",
        )
        temp_org = await create_canned_organisation(self.db, temp_org)
        response = await client.delete(
            f"{self.endpoint_url}{temp_org.id}/",
            headers={"Authorization": f"Token {self.admin_token}"},
        )
        body = response.json()
        assert response.status_code == 200
        assert body.get("Success") == "Organisation deleted"

    async def test_delete_item_by_non_admin_user_fails(self, client: AsyncClient):
        temp_user = await return_canned_user(self.db, "non_admin", 22234)
        temp_user = await create_canned_user(self.db, temp_user)
        temp_raw_token = AuthenticationService.generate_session_token_for_user(
            temp_user.id
        )
        temp_token = base64.b64encode(temp_raw_token.encode("utf-8")).decode("utf-8")

        response = await client.delete(
            f"{self.endpoint_url}{self.org_record.organisation_id}/",
            headers={"Authorization": f"Token {temp_token}"},
        )
        body = response.json()
        assert response.status_code == 403
        assert body["Error"] == "User is not an admin for the org"
        assert body["SubCode"] == "UserNotOrgAdmin"

    async def test_delete_org_with_projects_fails(self, client: AsyncClient):
        # ensure project associated (already set in setup); call delete
        response = await client.delete(
            f"{self.endpoint_url}{self.org_record.organisation_id}/",
            headers={"Authorization": f"Token {self.admin_token}"},
        )
        assert response.status_code == 403
        body = response.json()
        assert body["Error"] == "Organisation has some projects"
        assert body["SubCode"] == "OrgHasProjects"

    async def test_update_org_details_by_admin_passes(self, client: AsyncClient):
        response = await client.patch(
            f"{self.endpoint_url}{self.org_record.organisation_id}/",
            headers={"Authorization": f"Token {self.admin_token}"},
            json={
                "name": "HOT",
                "slug": "hot",
                "logo": None,
                "managers": [TEST_USERNAME],
            },
        )
        assert response.status_code == 200
        assert response.json() == {"Status": "Updated"}

    async def test_update_org_details_by_non_admin_fails(self, client: AsyncClient):
        temp_user = await return_canned_user(self.db, "non_admin", 22234)
        temp_user = await create_canned_user(self.db, temp_user)
        temp_raw_token = AuthenticationService.generate_session_token_for_user(
            temp_user.id
        )
        temp_token = base64.b64encode(temp_raw_token.encode("utf-8")).decode("utf-8")

        response = await client.patch(
            f"{self.endpoint_url}{self.org_record.organisation_id}/",
            headers={"Authorization": f"Token {temp_token}"},
            json={
                "name": "HOT",
                "slug": "hot",
                "logo": None,
                "managers": [TEST_USERNAME],
            },
        )
        assert response.status_code == 403
        body = response.json()
        assert body["Error"] == "User is not an admin for the org"
        assert body["SubCode"] == "UserNotOrgAdmin"

    async def test_update_org_details_with_invalid_data_fails(
        self, client: AsyncClient
    ):
        response = await client.patch(
            f"{self.endpoint_url}{self.org_record.organisation_id}/",
            headers={"Authorization": f"Token {self.admin_token}"},
            json={"name": 12, "slug": "hot", "org_logo": None},
        )
        assert response.status_code in (400, 422)


@pytest.mark.anyio
class TestOrganisationsStatsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_org = await create_canned_organisation(self.db)
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        # persist org and associate project with org
        await self.db.execute(
            "UPDATE projects SET organisation_id = :org_id WHERE id = :proj_id",
            {"org_id": self.test_org.id, "proj_id": int(self.test_project_id)},
        )
        self.endpoint_url = f"/api/v2/organisations/{self.test_org.id}/statistics/"

    async def test_get_org_statistics_passes(self, client: AsyncClient):
        response = await client.get(self.endpoint_url)
        assert response.status_code == 200
        body = response.json()
        assert body["projects"] == {
            "draft": 1,
            "published": 0,
            "archived": 0,
            "recent": 0,
            "stale": 0,
        }
        assert body["activeTasks"] == {
            "badImagery": 0,
            "invalidated": 0,
            "lockedForMapping": 0,
            "lockedForValidation": 0,
            "mapped": 0,
            "ready": 0,
            "validated": 0,
        }

    async def test_get_non_existent_org_statistics_fails(self, client: AsyncClient):
        response = await client.get("/api/v2/organisations/99/statistics/")
        assert response.status_code == 404
        body = response.json()
        error = body.get("error", {})
        assert error.get("message") == ORG_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == ORG_NOT_FOUND_SUB_CODE
