# tests/api/integration/api/projects/test_projects_all_async.py
import base64
from backend.exceptions import NotFound
from backend.models.dtos.project_dto import ProjectDTO
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.task import Task
from backend.services.organisation_service import OrganisationService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.users.authentication_service import AuthenticationService
from backend.services.users.user_service import UserService
import geojson
from datetime import datetime, timedelta

import pytest

from backend.models.postgis.statuses import (
    TaskStatus,
    UserRole,
    ProjectStatus,
    TeamMemberFunctions,
    TeamRoles,
    ValidationPermission,
    MappingPermission,
    ProjectDifficulty,
    ProjectPriority,
    MappingTypes,
)
from backend.models.postgis.project import Project
from backend.services.project_service import ProjectService
from backend.services.mapping_service import MappingService
from backend.services.validator_service import ValidatorService
from backend.services.campaign_service import CampaignService
from backend.models.dtos.campaign_dto import CampaignProjectDTO
import json
from tests.api.helpers.test_helpers import (
    create_canned_campaign,
    create_canned_project,
    create_canned_organisation,
    create_canned_user,
    return_canned_draft_project_json,
    return_canned_organisation,
    return_canned_campaign,
    create_canned_team,
    return_canned_team,
    add_user_to_team,
    add_manager_to_organisation,
    assign_team_to_project,
    generate_encoded_token,
    return_canned_user,
    create_canned_interest,
    get_canned_json,
)
from fastapi import HTTPException
from pydantic import ValidationError
from httpx import AsyncClient


def _encode_token(raw: str) -> str:
    return base64.b64encode(raw.encode("utf-8")).decode("utf-8")


TEST_USER_USERNAME = "test_user_delete"
TEST_USER_ID = 9999


@pytest.mark.anyio
class TestDeleteProjectsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        u_payload = await return_canned_user(self.db, TEST_USER_USERNAME, TEST_USER_ID)
        self.test_user = await create_canned_user(self.db, u_payload)
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.test_user_token = _encode_token(raw_user)

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        raw_author = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.test_author_token = _encode_token(raw_author)

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            created = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                created.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

        self.url = f"/api/v2/projects/{self.test_project_id}/"

    async def test_delete_project_returns_403_without_token(self, client: AsyncClient):
        resp = await client.delete(self.url)
        assert resp.status_code == 403

    async def test_delete_project_returns_403_if_user_not_authorized(
        self, client: AsyncClient
    ):
        # reset tasks so deletion condition is satisfied
        await ProjectAdminService.reset_all_tasks(
            self.test_project_id, self.test_user.id, self.db
        )

        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_user_token}"},
        )

        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UserPermissionError"

    async def test_project_with_mapped_tasks_cannot_be_deleted(
        self, client: AsyncClient
    ):
        # make author org manager
        await add_manager_to_organisation(self.org_record, self.test_author, self.db)

        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_token}"},
        )

        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "HasMappedTasks"

    async def test_org_manager_can_delete_project(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_author, self.db)

        await ProjectAdminService.reset_all_tasks(
            self.test_project_id, self.test_user.id, self.db
        )

        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_token}"},
        )

        assert resp.status_code == 200

        with pytest.raises(HTTPException):
            await ProjectService.get_project_by_id(self.test_project_id, self.db)

    async def test_admin_can_delete_project(self, client: AsyncClient):

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )
        await ProjectAdminService.reset_all_tasks(
            self.test_project_id, self.test_user.id, self.db
        )

        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_user_token}"},
        )

        assert resp.status_code == 200

        with pytest.raises(HTTPException):
            await ProjectService.get_project_by_id(self.test_project_id, self.db)


@pytest.mark.anyio
class TestCreateProjectsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create user
        u_payload = await return_canned_user(self.db, TEST_USER_USERNAME, TEST_USER_ID)
        self.test_user = await create_canned_user(self.db, u_payload)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.session_token = _encode_token(raw)

        # organisation and canned project json
        self.test_organisation = await create_canned_organisation(self.db)

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            created = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                created.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

        self.url = "/api/v2/projects/"
        self.canned_project_json = return_canned_draft_project_json()

    @staticmethod
    async def assert_draft_project_response(project_obj, expected_project_json, db):
        # project_obj is a model instance from ProjectService.get_project_by_id(...)
        assert expected_project_json["organisation"] == project_obj.organisation_id

        expected_aoi = [
            expected_project_json["areaOfInterest"]["features"][0]["geometry"][
                "coordinates"
            ]
        ]
        proj_aoi = await Project.get_aoi_geometry_as_geojson(project_obj.id, db)
        assert expected_aoi == proj_aoi["coordinates"]
        assert project_obj.status == ProjectStatus.DRAFT.value
        assert expected_project_json["projectName"] == await Project.get_project_title(
            db, project_obj.id, "en"
        )

    async def test_create_project_returns_403_without_token(self, client: AsyncClient):
        resp = await client.post(self.url, json=self.canned_project_json)
        assert resp.status_code == 403

    async def test_create_project_returns_403_if_unauthorized(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            json=self.canned_project_json,
            headers={"Authorization": f"Token {self.session_token}"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "NotPermittedToCreate"

    async def test_create_project_returns_422_if_invalid_json(
        self, client: AsyncClient
    ):
        # make user admin

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )

        resp = await client.post(
            self.url, json={}, headers={"Authorization": f"Token {self.session_token}"}
        )
        assert resp.status_code == 422

    async def test_org_manager_can_create_project(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.post(
            self.url,
            json=self.canned_project_json,
            headers={"Authorization": f"Token {self.session_token}"},
        )
        assert resp.status_code == 201
        assert "projectId" in resp.json()
        project_id = resp.json()["projectId"]
        created = await ProjectService.get_project_by_id(project_id, self.db)
        await TestCreateProjectsRestAPI.assert_draft_project_response(
            created, self.canned_project_json, self.db
        )

    async def test_admin_can_create_project(self, client: AsyncClient):
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )

        resp = await client.post(
            self.url,
            json=self.canned_project_json,
            headers={"Authorization": f"Token {self.session_token}"},
        )
        assert resp.status_code == 201
        assert "projectId" in resp.json()
        project_id = resp.json()["projectId"]
        created = await ProjectService.get_project_by_id(project_id, self.db)
        await TestCreateProjectsRestAPI.assert_draft_project_response(
            created, self.canned_project_json, self.db
        )


@pytest.mark.anyio
class TestGetProjectsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        # ensure project is published
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )

        self.url = f"/api/v2/projects/{self.test_project_id}/"

        u_payload = await return_canned_user(self.db, TEST_USER_USERNAME, TEST_USER_ID)
        self.test_user = await create_canned_user(self.db, u_payload)
        self.user_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_user.id)
        )

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            created = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                created.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

    @staticmethod
    async def assert_project_response(
        project_response, expected_project, expected_project_id, db, assert_type="full"
    ):
        # project_response is a dict (JSON from API) and expected_project is model instance
        assert expected_project_id == project_response["projectId"]

        if assert_type != "summary":
            assert geojson.loads(
                geojson.dumps(project_response["areaOfInterest"])
            ).is_valid
            assert ["type", "coordinates"] == list(
                project_response["areaOfInterest"].keys()
            )
            if assert_type == "notasks":
                assert "tasks" not in project_response
            else:
                assert geojson.loads(geojson.dumps(project_response["tasks"])).is_valid

            # projectInfo assertions (skip only for notasks)
            if assert_type != "notasks":
                assert (
                    await Project.get_project_title(
                        db,
                        project_response["projectId"],
                        expected_project.default_locale,
                    )
                    == project_response["projectInfo"]["name"]
                )
                assert [
                    "locale",
                    "name",
                    "shortDescription",
                    "description",
                    "instructions",
                    "perTaskInstructions",
                ] == list(project_response["projectInfo"].keys())

        else:
            assert "aoiCentroid" in project_response
            assert "shortDescription" in project_response
            assert "allowedUsernames" in project_response

        # Minimal set of checks for many returned fields (preserve original coverage)
        assert "mappingTypes" in project_response
        assert "mappingEditors" in project_response
        assert "validationEditors" in project_response
        assert expected_project.private == project_response["private"]
        assert expected_project.organisation_id == project_response["organisation"]
        user_record = await UserService.get_user_by_id(expected_project.author_id, db)
        assert user_record.username == project_response["author"]
        assert "enforceRandomTaskSelection" in project_response
        assert "osmchaFilterId" in project_response
        assert "dueDate" in project_response
        assert "imagery" in project_response
        assert "idPresets" in project_response
        assert "extraIdParams" in project_response
        assert "rapidPowerUser" in project_response
        assert "mappingTypes" in project_response
        assert "campaigns" in project_response
        assert "organisationName" in project_response
        assert "organisationSlug" in project_response
        assert "organisationLogo" in project_response
        assert "countryTag" in project_response
        assert "licenseId" in project_response
        assert "allowedUsernames" in project_response
        assert "created" in project_response
        assert "lastUpdated" in project_response
        assert "percentMapped" in project_response
        assert "percentValidated" in project_response
        assert "percentBadImagery" in project_response
        assert "teams" in project_response

    async def test_published_public_project_can_be_accessed_without_token(
        self, client: AsyncClient
    ):
        resp = await client.get(self.url)
        assert resp.status_code == 200
        assert resp.json()["projectId"] == int(self.test_project_id)
        await TestGetProjectsRestAPI.assert_project_response(
            resp.json(), self.test_project, self.test_project_id, self.db
        )

    async def test_draft_project_only_accessible_to_pm(self, client: AsyncClient):
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.DRAFT.value, "id": int(self.test_project_id)},
        )

        # non-manager user
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "ProjectNotFetched"

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 200
        await TestGetProjectsRestAPI.assert_project_response(
            resp.json(), self.test_project, self.test_project_id, self.db
        )

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.MAPPER.value, "id": int(self.test_user.id)},
        )
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["projectId"] == int(self.test_project_id)
        await TestGetProjectsRestAPI.assert_project_response(
            resp.json(), self.test_project, self.test_project_id, self.db
        )

    async def test_private_project_requires_pm_permissions(self, client: AsyncClient):
        # make private
        await self.db.execute(
            "UPDATE projects SET private = true WHERE id = :id",
            {"id": int(self.test_project_id)},
        )

        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "PrivateProject"

    async def test_get_project_tasks_geometry_abbreviated_flags(
        self, client: AsyncClient
    ):
        # abbreviated=false -> geometry present
        resp = await client.get(
            f"{self.url}?abbreviated=false",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200
        await TestGetProjectsRestAPI.assert_project_response(
            resp.json(), self.test_project, self.test_project_id, self.db
        )
        for task in resp.json()["tasks"]["features"]:
            assert task["geometry"] is not None

        # abbreviated=true -> geometry None
        resp = await client.get(
            f"{self.url}?abbreviated=true",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200
        await TestGetProjectsRestAPI.assert_project_response(
            resp.json(), self.test_project, self.test_project_id, self.db
        )
        for task in resp.json()["tasks"]["features"]:
            assert task["geometry"] is None

    async def test_get_project_as_file(self, client: AsyncClient):
        resp = await client.get(
            f"{self.url}?as_file=true",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200
        assert resp.headers["Content-Type"] == "application/json"
        assert (
            resp.headers["Content-Disposition"] == "attachment; filename=project.json"
        )


@pytest.mark.anyio
class TestPatchProjectRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/"

        u_payload = await return_canned_user(self.db, TEST_USER_USERNAME, TEST_USER_ID)
        self.test_user = await create_canned_user(self.db, u_payload)
        self.user_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_user.id)
        )
        self.author_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_author.id)
        )

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            created = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                created.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

        self.project_update_body = get_canned_json("canned_project_detail.json")
        self.project_update_body["projectId"] = int(self.test_project_id)

    async def test_patch_requires_authentication(self, client: AsyncClient):
        resp = await client.patch(self.url)
        assert resp.status_code == 403

    async def test_patch_returns_404_for_missing_project(self, client: AsyncClient):
        resp = await client.patch(
            "/api/v2/projects/1000/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 404

    async def test_patch_returns_403_if_not_pm(self, client: AsyncClient):
        resp = await client.patch(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UserPermissionError"

    async def test_patch_return_validation_error_for_invalid_body(
        self, client: AsyncClient
    ):
        with pytest.raises(ValidationError):
            await client.patch(
                self.url,
                json={"message": "invalid body"},
                headers={"Authorization": f"Token {self.author_session_token}"},
            )

    async def test_project_author_can_update_project(self, client: AsyncClient):
        resp = await client.patch(
            self.url,
            json=self.project_update_body,
            headers={"Authorization": f"Token {self.author_session_token}"},
        )
        assert resp.status_code == 200

    async def test_team_member_with_pm_permission_can_update(self, client: AsyncClient):
        team = await create_canned_team(self.db)
        await add_user_to_team(
            team, self.test_user, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        await assign_team_to_project(
            self.test_project_id, team.id, TeamRoles.PROJECT_MANAGER.value, self.db
        )

        resp = await client.patch(
            self.url,
            json=self.project_update_body,
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200

    async def test_team_member_with_non_pm_cannot_update(self, client: AsyncClient):
        team = await create_canned_team(self.db)
        await add_user_to_team(
            team, self.test_user, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        await assign_team_to_project(
            self.test_project_id, team.id, TeamRoles.VALIDATOR.value, self.db
        )

        resp = await client.patch(
            self.url,
            json=self.project_update_body,
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 403

    async def test_admin_can_update_project(self, client: AsyncClient):

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )

        resp = await client.patch(
            self.url,
            json=self.project_update_body,
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.MAPPER.value, "id": int(self.test_user.id)},
        )

    async def test_org_manager_can_update_project(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        resp = await client.patch(
            self.url,
            json=self.project_update_body,
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200


@pytest.mark.anyio
class TestProjectsAllAPIAsync:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Create a few canned projects and users and store tokens, db, url
        """
        self.db = db_connection_fixture

        # helpers return (project, author, project_id) convention used in this test-suite
        self.test_project_1, self.test_author, self.test_project_1_id = (
            await create_canned_project(self.db)
        )
        # publish project 1
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_1_id),
            },
        )

        self.test_project_2, _, self.test_project_2_id = await create_canned_project(
            self.db
        )

        await self.db.execute(
            "UPDATE projects SET status = :status, private = :pvt WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "pvt": True,
                "id": int(self.test_project_2_id),
            },
        )

        self.test_project_3, _, self.test_project_3_id = await create_canned_project(
            self.db
        )
        # create a normal test user
        test_user = await return_canned_user(self.db, "Test User_2", 11111)
        self.test_user = await create_canned_user(self.db, test_user)
        self.author_session_token = generate_encoded_token(self.test_author.id)
        self.user_session_token = generate_encoded_token(self.test_user.id)

        self.url = "/api/v2/projects/"

    async def _get(self, client: AsyncClient, **kwargs):
        return await client.get(self.url, **kwargs)

    async def test_get_all_projects_can_be_accessed_without_token(
        self, client: AsyncClient
    ):
        resp = await client.get(self.url)
        assert resp.status_code == 200

    async def test_get_all_project_returns_published_public_projects_if_token_not_supplied(
        self, client: AsyncClient
    ):
        resp = await client.get(self.url)
        assert resp.status_code == 200
        # only test_project_1 is published + public
        assert len(resp.json()["results"]) == 1
        assert resp.json()["results"][0]["projectId"] == self.test_project_1_id

    async def test_get_all_projects_returns_user_permitted_published_projects_if_token_supplied(
        self, client: AsyncClient
    ):
        # Make project_2 public so author can see it
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.author_session_token}"}
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 2
        ids = [r["projectId"] for r in resp.json()["results"]]
        assert self.test_project_1_id in ids
        assert self.test_project_2_id in ids

    async def test_returns_projects_with_tasks_to_validate_if_action_set_to_validate(
        self, client: AsyncClient
    ):
        # Make project_2 public
        await self.db.execute(
            "UPDATE users SET mapping_level = :mapping_level WHERE id = :id",
            {"mapping_level": 2, "id": int(self.test_author.id)},
        )
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        # Ensure both projects allow validation by ANY
        await self.db.execute(
            "UPDATE projects SET validation_permission = :vp WHERE id = :id",
            {"vp": ValidationPermission.ANY.value, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET validation_permission = :vp WHERE id = :id",
            {"vp": ValidationPermission.ANY.value, "id": int(self.test_project_2_id)},
        )
        # Reset project_2 to have no tasks ready to validate (map+validate all)
        await MappingService.map_all_tasks(
            self.test_project_2_id, self.test_author.id, self.db
        )
        await ValidatorService.validate_all_tasks(
            self.test_project_2_id, self.test_author.id, self.db
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.author_session_token}"},
            params={"action": "validate"},
        )
        assert resp.status_code == 200
        # project 2 has no tasks to validate, so only project 1 returned
        results = resp.json()["results"]
        assert len(results) == 1
        assert results[0]["projectId"] == self.test_project_1_id

    async def test_returns_projects_with_tasks_to_map_if_action_set_to_map(
        self, client: AsyncClient
    ):
        # Make project_2 public

        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )

        # Ensure both projects allow validation by ANY

        await self.db.execute(
            "UPDATE projects SET mapping_permission = :mp WHERE id = :id",
            {"mp": MappingPermission.ANY.value, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET mapping_permission = :mp WHERE id = :id",
            {"mp": MappingPermission.ANY.value, "id": int(self.test_project_2_id)},
        )

        # Map all tasks in project_2 so none left
        await MappingService.map_all_tasks(
            self.test_project_2_id, self.test_author.id, self.db
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"action": "map"},
        )
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) == 1
        assert results[0]["projectId"] == self.test_project_1_id

    async def test_returns_all_projects_that_user_is_permitted_if_action_set_to_any(
        self, client: AsyncClient
    ):
        # Make project_2 public

        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )

        # Ensure both projects allow validation by ANY

        await self.db.execute(
            "UPDATE projects SET mapping_permission = :mp WHERE id = :id",
            {"mp": MappingPermission.ANY.value, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET mapping_permission = :mp WHERE id = :id",
            {"mp": MappingPermission.ANY.value, "id": int(self.test_project_2_id)},
        )

        # Create extra published project (instead of clone): use helper to create project
        p4, a4, p4_id = await create_canned_project(self.db)

        # publish project 1
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.ARCHIVED.value, "id": int(p4_id)},
        )

        # finish project_2 so that finished projects are not returned for action=any
        await MappingService.map_all_tasks(
            self.test_project_2_id, self.test_author.id, self.db
        )
        await ValidatorService.validate_all_tasks(
            self.test_project_2_id, self.test_author.id, self.db
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"action": "any"},
        )
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) == 2
        returned_ids = [r["projectId"] for r in results]
        assert self.test_project_1_id in returned_ids
        assert self.test_project_2_id in returned_ids

    async def test_returns_easy_projects_if_difficulty_set_to_easy(
        self, client: AsyncClient
    ):

        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty, private = :pvt WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.EASY.value,
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"difficulty": "EASY"},
        )
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) == 1
        assert results[0]["projectId"] == self.test_project_2_id

    async def test_returns_moderate_projects_if_difficulty_set_to_moderate(
        self, client: AsyncClient
    ):

        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty, private = :pvt WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.EASY.value,
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"difficulty": "MODERATE"},
        )
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) == 1
        assert results[0]["projectId"] == self.test_project_1_id

    async def test_returns_challenging_projects_if_difficulty_set_to_challenging(
        self, client: AsyncClient
    ):

        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty, private = :pvt WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.CHALLENGING.value,
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"difficulty": "CHALLENGING"},
        )
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) == 1
        assert results[0]["projectId"] == self.test_project_2_id

    async def test_returns_all_projects_if_difficulty_set_to_all(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty, private = :pvt WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.EASY.value,
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )
        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty, private = :pvt WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.MODERATE.value,
                "pvt": False,
                "id": int(self.test_project_1_id),
            },
        )
        # create project_4 published
        p4, a4, p4_id = await create_canned_project(self.db)

        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty, status = :status WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.EASY.value,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(p4_id),
            },
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"difficulty": "ALL"},
        )
        assert resp.status_code == 200
        # user permitted projects are 1,2,4 (3 is DRAFT)
        results = resp.json()["results"]
        assert len(results) == 3
        assert self.test_project_3_id not in [r["projectId"] for r in results]

    async def test_returns_sorted_projects_by_priority_if_sort_by_set_to_priority(
        self, client: AsyncClient
    ):
        # set various priorities and statuses so there are 4 published projects

        await self.db.execute(
            "UPDATE projects SET priority = :priority WHERE id = :id",
            {
                "priority": ProjectPriority.URGENT.value,
                "id": int(self.test_project_1_id),
            },
        )

        await self.db.execute(
            "UPDATE projects SET priority = :priority, private = :pvt WHERE id = :id",
            {
                "priority": ProjectPriority.HIGH.value,
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )

        await self.db.execute(
            "UPDATE projects SET priority = :priority, status = :status WHERE id = :id",
            {
                "priority": ProjectPriority.MEDIUM.value,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )
        p4, a4, p4_id = await create_canned_project(self.db)

        await self.db.execute(
            "UPDATE projects SET priority = :priority, status = :status WHERE id = :id",
            {
                "priority": ProjectPriority.LOW.value,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(p4_id),
            },
        )

        # DESC
        resp_desc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "priority", "orderByType": "DESC"},
        )
        assert resp_desc.status_code == 200
        assert len(resp_desc.json()["results"]) >= 4
        expected_desc_order = [
            p4_id,
            self.test_project_3_id,
            self.test_project_2_id,
            self.test_project_1_id,
        ]
        assert [i["projectId"] for i in resp_desc.json()["results"]][
            :4
        ] == expected_desc_order

        # ASC
        resp_asc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "priority", "orderByType": "ASC"},
        )
        assert resp_asc.status_code == 200
        assert [i["projectId"] for i in resp_asc.json()["results"]][
            :4
        ] == expected_desc_order[::-1]

    async def test_returns_sorted_projects_by_difficulty_if_sort_by_set_to_difficulty(
        self, client: AsyncClient
    ):
        # set difficulties via raw SQL (no .save())
        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.EASY.value,
                "id": int(self.test_project_1_id),
            },
        )
        await self.db.execute(
            "UPDATE projects SET difficulty = :difficulty, private = :pvt WHERE id = :id",
            {
                "difficulty": ProjectDifficulty.MODERATE.value,
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )
        await self.db.execute(
            "UPDATE projects SET status = :status, difficulty = :difficulty WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "difficulty": ProjectDifficulty.CHALLENGING.value,
                "id": int(self.test_project_3_id),
            },
        )

        resp_desc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "difficulty", "orderByType": "DESC"},
        )
        assert resp_desc.status_code == 200
        results = resp_desc.json()["results"]
        expected = [
            int(self.test_project_3_id),
            int(self.test_project_2_id),
            int(self.test_project_1_id),
        ]
        assert [r["projectId"] for r in results][:3] == expected

        resp_asc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "difficulty", "orderByType": "ASC"},
        )
        assert resp_asc.status_code == 200
        assert [r["projectId"] for r in resp_asc.json()["results"]][:3] == expected[
            ::-1
        ]

    async def test_returns_sorted_projects_by_creation_date_if_sort_by_set_to_id(
        self, client: AsyncClient
    ):
        # make project_2 public
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        # publish project_3
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        resp_desc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "id", "orderByType": "DESC"},
        )
        assert resp_desc.status_code == 200
        results = resp_desc.json()["results"]
        expected = [
            int(self.test_project_3_id),
            int(self.test_project_2_id),
            int(self.test_project_1_id),
        ]
        assert [r["projectId"] for r in results][:3] == expected

        resp_asc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "id", "orderByType": "ASC"},
        )
        assert resp_asc.status_code == 200
        assert [r["projectId"] for r in resp_asc.json()["results"]][:3] == expected[
            ::-1
        ]

    async def test_returns_sorted_projects_by_last_updated_date_if_sort_by_set_to_updated_at(
        self, client: AsyncClient
    ):
        # set last_updated timestamps via raw SQL (ISO string)
        lu1 = datetime.utcnow() - timedelta(days=1)
        lu2 = datetime.utcnow() - timedelta(days=2)
        lu3 = datetime.utcnow() - timedelta(days=3)
        await self.db.execute(
            "UPDATE projects SET last_updated = :lu WHERE id = :id",
            {"lu": lu1, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET last_updated = :lu, private = :pvt WHERE id = :id",
            {"lu": lu2, "pvt": False, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET last_updated = :lu, status = :status WHERE id = :id",
            {
                "lu": lu3,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        resp_desc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "last_updated", "orderByType": "DESC"},
        )
        assert resp_desc.status_code == 200
        results = resp_desc.json()["results"]
        expected = [
            int(self.test_project_1_id),
            int(self.test_project_2_id),
            int(self.test_project_3_id),
        ]
        assert [r["projectId"] for r in results][:3] == expected

        resp_asc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "last_updated", "orderByType": "ASC"},
        )
        assert resp_asc.status_code == 200
        assert [r["projectId"] for r in resp_asc.json()["results"]][:3] == expected[
            ::-1
        ]

    async def test_returns_sorted_projects_by_due_date_if_sort_by_set_to_due_date(
        self, client: AsyncClient
    ):
        # set due_dates and make project_2 public
        dd1 = datetime.utcnow() + timedelta(days=1)
        dd2 = datetime.utcnow() + timedelta(days=2)
        dd3 = datetime.utcnow() + timedelta(days=3)
        await self.db.execute(
            "UPDATE projects SET due_date = :dd WHERE id = :id",
            {"dd": dd1, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET due_date = :dd, private = :pvt WHERE id = :id",
            {"dd": dd2, "pvt": False, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET due_date = :dd, status = :status WHERE id = :id",
            {
                "dd": dd3,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        resp_desc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "due_date", "orderByType": "DESC"},
        )
        assert resp_desc.status_code == 200
        expected = [
            int(self.test_project_3_id),
            int(self.test_project_2_id),
            int(self.test_project_1_id),
        ]
        assert [r["projectId"] for r in resp_desc.json()["results"]][:3] == expected

        resp_asc = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"orderBy": "due_date", "orderByType": "ASC"},
        )
        assert resp_asc.status_code == 200
        assert [r["projectId"] for r in resp_asc.json()["results"]][:3] == expected[
            ::-1
        ]

    async def test_returns_projects_filter_by_statuses(self, client: AsyncClient):
        # change statuses via SQL
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.DRAFT.value, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.ARCHIVED.value, "id": int(self.test_project_3_id)},
        )

        resp_pub = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.author_session_token}"},
            params={"projectStatuses": [ProjectStatus.PUBLISHED.name]},
        )
        assert resp_pub.status_code == 200
        assert len(resp_pub.json()["results"]) >= 1
        assert resp_pub.json()["results"][0]["projectId"] == int(self.test_project_2_id)

        resp_draft = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.author_session_token}"},
            params={"projectStatuses": [ProjectStatus.DRAFT.name]},
        )
        assert resp_draft.status_code == 200
        assert resp_draft.json()["results"][0]["projectId"] == int(
            self.test_project_1_id
        )

        resp_arch = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.author_session_token}"},
            params={"projectStatuses": [ProjectStatus.ARCHIVED.name]},
        )
        assert resp_arch.status_code == 200
        assert resp_arch.json()["results"][0]["projectId"] == int(
            self.test_project_3_id
        )

        # multiple statuses
        resp_all = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.author_session_token}"},
            params={"projectStatuses": "PUBLISHED,DRAFT,ARCHIVED"},
        )
        assert resp_all.status_code == 200
        assert len(resp_all.json()["results"]) >= 3
        returned_ids = [int(i["projectId"]) for i in resp_all.json()["results"]][:3]
        assert set(returned_ids) == {
            int(self.test_project_1_id),
            int(self.test_project_2_id),
            int(self.test_project_3_id),
        }

    async def test_returns_projects_filter_by_mapping_types(self, client: AsyncClient):
        # set mapping types via SQL arrays
        await self.db.execute(
            "UPDATE projects SET mapping_types = :mts WHERE id = :id",
            {"mts": [MappingTypes.BUILDINGS.value], "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET mapping_types = :mts, private = :pvt WHERE id = :id",
            {
                "mts": [MappingTypes.ROADS.value],
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )
        await self.db.execute(
            "UPDATE projects SET mapping_types = :mts, status = :status WHERE id = :id",
            {
                "mts": [MappingTypes.WATERWAYS.value],
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        # create additional projects with mapping types
        p4, a4, p4_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET mapping_types = :mts, status = :status WHERE id = :id",
            {
                "mts": [MappingTypes.LAND_USE.value],
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(p4_id),
            },
        )

        p5, a5, p5_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET mapping_types = :mts, status = :status WHERE id = :id",
            {
                "mts": [MappingTypes.OTHER.value],
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(p5_id),
            },
        )

        p6, a6, p6_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET mapping_types = :mts, status = :status WHERE id = :id",
            {
                "mts": [
                    MappingTypes.BUILDINGS.value,
                    MappingTypes.ROADS.value,
                    MappingTypes.WATERWAYS.value,
                    MappingTypes.LAND_USE.value,
                    MappingTypes.OTHER.value,
                ],
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(p6_id),
            },
        )

        # buildings
        resp_buildings = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappingTypes": [MappingTypes.BUILDINGS.name]},
        )
        assert resp_buildings.status_code == 200
        assert len(resp_buildings.json()["results"]) >= 2

        # roads
        resp_roads = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappingTypes": [MappingTypes.ROADS.name]},
        )
        assert resp_roads.status_code == 200
        assert len(resp_roads.json()["results"]) >= 2

        # waterways
        resp_w = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappingTypes": [MappingTypes.WATERWAYS.name]},
        )
        assert resp_w.status_code == 200
        assert len(resp_w.json()["results"]) >= 2

        # land use
        resp_lu = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappingTypes": [MappingTypes.LAND_USE.name]},
        )
        assert resp_lu.status_code == 200
        assert len(resp_lu.json()["results"]) >= 2

        # other
        resp_o = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappingTypes": [MappingTypes.OTHER.name]},
        )
        assert resp_o.status_code == 200
        assert len(resp_o.json()["results"]) >= 2

        # all mapping types and exact mapping types (just asserting 200)
        resp_all = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappingTypes": "BUILDINGS,ROADS,WATERWAYS,LAND_USE,OTHER"},
        )
        assert resp_all.status_code == 200

        resp_exact = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappingTypes": "BUILDINGS", "mappingTypesExact": "true"},
        )
        assert resp_exact.status_code == 200

    async def test_returns_projects_filtered_by_organisation(self, client: AsyncClient):
        test_org_2 = return_canned_organisation(12, "test_org_2", "T2")
        test_org_2 = await create_canned_organisation(self.db, test_org_2)

        # set project1 org via SQL
        await self.db.execute(
            "UPDATE projects SET organisation_id = :org WHERE id = :id",
            {
                "org": self.test_project_1.organisation_id,
                "id": int(self.test_project_1_id),
            },
        )
        # set project2 org and make public
        await self.db.execute(
            "UPDATE projects SET organisation_id = :org, private = :pvt WHERE id = :id",
            {"org": test_org_2.id, "pvt": False, "id": int(self.test_project_2_id)},
        )

        resp_org_id = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"organisationId": self.test_project_1.organisation_id},
        )
        assert resp_org_id.status_code == 200
        assert len(resp_org_id.json()["results"]) >= 1
        assert resp_org_id.json()["results"][0]["projectId"] == int(
            self.test_project_1_id
        )

        resp_org_name = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"organisationName": test_org_2.name},
        )
        assert resp_org_name.status_code == 200
        assert resp_org_name.json()["results"][0]["projectId"] == int(
            self.test_project_2_id
        )

    async def test_returns_projects_filtered_by_campaign(self, client: AsyncClient):
        test_campaign_1 = return_canned_campaign(10, "test_campaign_1")
        test_campaign_1 = await create_canned_campaign(self.db, test_campaign_1)
        test_campaign_2 = return_canned_campaign(12, "test_campaign_2")
        test_campaign_2 = await create_canned_campaign(self.db, test_campaign_2)

        dto = CampaignProjectDTO(
            campaign_id=test_campaign_1.id, project_id=self.test_project_1_id
        )
        await CampaignService.create_campaign_project(dto, self.db)

        dto.campaign_id = test_campaign_2.id
        dto.project_id = int(self.test_project_2_id)
        await CampaignService.create_campaign_project(dto, self.db)

        # make project_2 public
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"campaign": test_campaign_1.name},
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) >= 1
        assert resp.json()["results"][0]["projectId"] == int(self.test_project_1_id)

    async def test_returns_projects_filtered_by_search(self, client: AsyncClient):
        # set project name via SQL

        await self.db.execute(
            "UPDATE project_info SET name = :name WHERE project_id = :id",
            {"name": "test_project_1", "id": int(self.test_project_1_id)},
        )
        p4, a4, p4_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(p4_id)},
        )

        await self.db.execute(
            "UPDATE project_info SET name = :name WHERE project_id = :id",
            {"name": "test_project_4", "id": int(p4_id)},
        )
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"textSearch": "test_project_4"},
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 1
        assert resp.json()["results"][0]["projectId"] == int(p4_id)

        resp_id = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"textSearch": "1"},
        )
        assert resp_id.status_code == 200
        assert len(resp_id.json()["results"]) == 1
        assert resp_id.json()["results"][0]["projectId"] == int(self.test_project_1_id)

    async def test_returns_projects_filtered_by_country(self, client: AsyncClient):
        # update country column (assuming JSON/array column)
        await self.db.execute(
            "UPDATE projects SET country = :country WHERE id = :id",
            {"country": ["England"], "id": int(self.test_project_1_id)},
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"country": ["England"]},
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) >= 1
        assert resp.json()["results"][0]["projectId"] == int(self.test_project_1_id)

    async def test_returns_projects_filtering_by_last_updated_param(
        self, client: AsyncClient
    ):
        lu1 = datetime.utcnow() - timedelta(minutes=10)
        lu2 = datetime.utcnow() - timedelta(days=2)
        lu3 = datetime.utcnow() - timedelta(days=3)

        await self.db.execute(
            "UPDATE projects SET last_updated = :lu WHERE id = :id",
            {"lu": lu1, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET private = :pvt, last_updated = :lu WHERE id = :id",
            {"pvt": False, "lu": lu2, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET last_updated = :lu, status = :status WHERE id = :id",
            {
                "lu": lu3,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        resp_from = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"lastUpdatedFrom": lu1.date().isoformat()},
        )
        assert resp_from.status_code == 200
        assert resp_from.json()["results"][0]["projectId"] == int(
            self.test_project_1_id
        )

        resp_to = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={
                "lastUpdatedTo": (datetime.utcnow() - timedelta(days=1))
                .date()
                .isoformat()
            },
        )
        assert resp_to.status_code == 200
        assert int(self.test_project_1_id) not in [
            i["projectId"] for i in resp_to.json()["results"]
        ]

    async def test_returns_projects_filtering_by_last_created_param(
        self, client: AsyncClient
    ):
        c1 = datetime.utcnow() - timedelta(minutes=10)
        c2 = datetime.utcnow() - timedelta(days=2)
        c3 = datetime.utcnow() - timedelta(days=3)

        await self.db.execute(
            "UPDATE projects SET created = :c WHERE id = :id",
            {"c": c1, "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET private = :pvt, created = :c WHERE id = :id",
            {"pvt": False, "c": c2, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET created = :c, status = :status WHERE id = :id",
            {
                "c": c3,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        resp_from = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"createdFrom": c1.date().isoformat()},
        )
        assert resp_from.status_code == 200
        assert resp_from.json()["results"][0]["projectId"] == int(
            self.test_project_1_id
        )

        resp_to = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={
                "createdTo": (datetime.utcnow() - timedelta(days=1)).date().isoformat()
            },
        )
        assert resp_to.status_code == 200
        assert int(self.test_project_1_id) not in [
            i["projectId"] for i in resp_to.json()["results"]
        ]

    async def test_returns_filtered_projects_by_interests(self, client: AsyncClient):
        it1 = await create_canned_interest(self.db, 222, "test_interest_1")

        await self.db.execute(
            """
            INSERT INTO project_interests (project_id, interest_id)
            VALUES (:pid, :iid);
            """,
            {"pid": int(self.test_project_1_id), "iid": it1.id},
        )
        resp_single = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"interests": it1.id},
        )
        assert resp_single.status_code == 200
        assert resp_single.json()["results"][0]["projectId"] == int(
            self.test_project_1_id
        )

    async def test_returns_projects_created_by_me(self, client: AsyncClient):
        # set author via SQL
        await self.db.execute(
            "UPDATE projects SET author_id = :aid WHERE id = :id",
            {"aid": int(self.test_user.id), "id": int(self.test_project_1_id)},
        )
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"createdByMe": "true"},
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 1
        assert resp.json()["results"][0]["projectId"] == int(self.test_project_1_id)

    async def test_returns_projects_managed_by_me(self, client: AsyncClient):
        # Prepare organisation and team and assign user to team with PM role on project 1

        test_organisation_1 = return_canned_organisation(
            111, "test_organisation_1", "T1"
        )
        test_organisation_1 = await create_canned_organisation(
            self.db, test_organisation_1
        )
        test_team = await return_canned_team(
            self.db, "test_team", test_organisation_1.name
        )
        test_team = await create_canned_team(self.db, test_team)
        # add user to team and give PM permission on project_1
        await add_user_to_team(
            test_team, self.test_user, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        query = """
        INSERT INTO project_teams (team_id, project_id, role)
        VALUES (:team_id, :project_id, :role)
        """
        await self.db.execute(
            query=query,
            values={
                "team_id": test_team.id,
                "project_id": self.test_project_1_id,
                "role": TeamRoles.PROJECT_MANAGER.value,
            },
        )

        # Also make the test user an organisation manager for project_2.org
        test_organisation_2 = return_canned_organisation(
            112, "test_organisation_2", "T2"
        )
        test_organisation_2 = await create_canned_organisation(
            self.db, test_organisation_2
        )
        org_2_record = await OrganisationService.get_organisation_by_id(112, self.db)
        await add_manager_to_organisation(org_2_record, self.test_user, self.db)

        await self.db.execute(
            "UPDATE projects SET organisation_id = :org, private = :pvt WHERE id = :id",
            {
                "org": int(test_organisation_2.id),
                "pvt": False,
                "id": int(self.test_project_2_id),
            },
        )

        # Make project_3 published but user is not manager there
        await self.db.execute(
            "UPDATE projects SET status = :status, organisation_id = :org WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "org": int(test_organisation_1.id),
                "id": int(self.test_project_3_id),
            },
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"managedByMe": "true"},
        )
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) >= 2
        assert int(self.test_project_3_id) not in [r["projectId"] for r in results]

    async def test_returns_all_projects_for_admin_if_managed_by_me_is_true(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )

        resp_admin = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"managedByMe": "true"},
        )
        assert resp_admin.status_code == 200
        assert len(resp_admin.json()["results"]) >= 3

    async def test_returns_projects_mapped_by_user_if_mapped_by_me_is_true(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )
        # set user's mapped projects list via users table
        await self.db.execute(
            "UPDATE users SET projects_mapped = :pm WHERE id = :id",
            {"pm": [int(self.test_project_1_id)], "id": int(self.test_user.id)},
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"mappedByMe": "true"},
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) >= 1
        assert resp.json()["results"][0]["projectId"] == int(self.test_project_1_id)

    async def test_returns_projects_favourited_by_user_if_favourited_by_me_is_true(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE projects SET private = :pvt WHERE id = :id",
            {"pvt": False, "id": int(self.test_project_2_id)},
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_3_id),
            },
        )
        await self.db.execute(
            """
            INSERT INTO project_favorites (project_id, user_id)
            VALUES (:pid, :uid)
            """,
            {
                "pid": int(self.test_project_1_id),
                "uid": int(self.test_user.id),
            },
        )
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"favoritedByMe": "true"},
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) >= 1
        assert resp.json()["results"][0]["projectId"] == int(self.test_project_1_id)

    async def test_omit_map_results_removes_map_results_from_response(
        self, client: AsyncClient
    ):
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"omitMapResults": "true"},
        )
        assert resp.status_code == 200
        assert resp.json()["mapResults"] == []

        resp2 = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"omitMapResults": "false"},
        )
        assert resp2.status_code == 200
        assert resp2.json()["mapResults"]["type"] == "FeatureCollection"


@pytest.mark.anyio
class TestSearchProjectByBBOX:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.url = "/api/v2/projects/queries/bbox/"

        # create user
        u_payload = await return_canned_user(self.db, "test_user", 9999)
        self.test_user = await create_canned_user(self.db, u_payload)
        self.user_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_user.id)
        )

        # create two projects and publish them
        self.test_project_1, self.test_author, self.test_project_1_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_1_id),
            },
        )

        self.test_project_2, _, self.test_project_2_id = await create_canned_project(
            self.db
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_2_id),
            },
        )

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            created = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                created.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

    async def test_returns_403_if_user_not_logged_in(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_403_if_user_doesnt_have_PM_role(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 403

    async def test_returns_400_if_bbox_is_not_valid(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"bbox": "1,2,3,100,200,3", "srid": 4326},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"

    async def test_returns_400_if_bbox_too_large(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"bbox": "-17,-30,102,70", "srid": 4326},
        )
        assert resp.status_code == 400

        assert resp.json()["SubCode"] == "BBoxTooBigError"

    async def test_returns_projects_within_bbox(self, client: AsyncClient):
        # Prepare AOI for project_2 so it lies outside bbox
        draft_project_json = return_canned_draft_project_json()

        # Use a MultiPolygon geometry (wrap polygon coordinates in an extra array)
        draft_project_json["areaOfInterest"] = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [83.771175, 28.095768],
                                    [83.773586, 28.095757],
                                    [83.773428, 28.094146],
                                    [83.770834, 28.094479],
                                    [83.771175, 28.095768],
                                ]
                            ]
                        ],
                    },
                }
            ],
        }

        # Extract the geometry object from FeatureCollection
        geom_obj = draft_project_json["areaOfInterest"]["features"][0]["geometry"]
        geom_json = json.dumps(geom_obj)  # valid GeoJSON MultiPolygon

        # Save AOI into project_2 using ST_GeomFromGeoJSON
        await self.db.execute(
            """
            UPDATE projects
            SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326)
            WHERE id = :id
            """,
            {"geom": geom_json, "id": int(self.test_project_2_id)},
        )

        # Ensure the user is a manager in the organisation
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        # Make request to the bbox endpoint
        resp = await client.get(
            self.url,
            headers={
                "Authorization": f"Token {self.user_session_token}",
                "Accept-Language": "en",
            },
            params={"bbox": "-3.993530,56.095790,-3.890533,56.129480", "srid": 4326},
        )

        # Assert only project_1 is returned
        assert resp.status_code == 200
        assert len(resp.json()["features"]) == 1
        assert resp.json()["features"][0]["properties"]["projectId"] == int(
            self.test_project_1_id
        )


@pytest.mark.anyio
class TestProjectsQueriesSummaryAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/queries/summary/"

    async def test_authentication_is_not_required(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 200

    async def test_returns_404_if_project_doesnt_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999/queries/summary/")
        assert resp.status_code == 404

    async def test_project_summary_response(self, client: AsyncClient):
        json_data = get_canned_json("canned_project_detail.json")
        project_dto = ProjectDTO(**json_data)
        test_project = await ProjectService.get_project_by_id(
            self.test_project_id, self.db
        )
        test_project = Project(**test_project)
        test_project.update(project_dto, self.db)
        resp = await client.get(self.url)
        assert resp.status_code == 200
        await TestGetProjectsRestAPI.assert_project_response(
            resp.json(), test_project, test_project.id, self.db, assert_type="summary"
        )


@pytest.mark.anyio
class TestProjectsQueriesTouchedAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status, private = false WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )

        self.test_project_1, _, self.test_project_1_id = await create_canned_project(
            self.db
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_1_id),
            },
        )

        # create and complete a task to mark project as touched
        t = await Task.get(1, int(self.test_project_id), self.db)
        await Task.lock_task_for_validating(
            t.id, t.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t.id, t.project_id, self.test_author.id, TaskStatus.VALIDATED, self.db
        )

        # add mapped project id to author record (assumes async save)
        await self.db.execute(
            "UPDATE users SET projects_mapped = :projects WHERE id = :id",
            {"projects": [int(self.test_project_id)], "id": int(self.test_author.id)},
        )

        self.url = f"/api/v2/projects/queries/{self.test_author.username}/touched/"

    async def test_authentication_is_not_required(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 200
        assert len(resp.json()["mappedProjects"]) == 1
        assert resp.json()["mappedProjects"][0]["projectId"] == int(
            self.test_project_id
        )

    async def test_returns_404_if_user_doesnt_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/queries/non_existent/touched/")
        assert resp.status_code == 404


@pytest.mark.anyio
class TestProjectsQueriesPriorityAreasAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status, private = false WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/queries/priority-areas/"

    async def test_authentication_is_not_required(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 200


@pytest.mark.anyio
class TestProjectsQueriesAoiAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status, private = false WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/queries/aoi/"

    async def test_returns_404_if_project_doesnt_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999/queries/aoi/")
        assert resp.status_code == 404

    async def test_authentication_is_not_required(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 200
        # Assuming the project model still exposes get_aoi_geometry_as_geojson async
        aoi = await Project.get_aoi_geometry_as_geojson(self.test_project_id, self.db)
        assert resp.json() == aoi

    async def test_returns_file_if_as_file_is_true(self, client: AsyncClient):
        resp = await client.get(self.url + "?as_file=true")
        assert resp.status_code == 200
        aoi = await Project.get_aoi_geometry_as_geojson(self.test_project_id, self.db)
        assert resp.json() == aoi
        assert resp.headers["Content-Type"] == "application/geo+json"
        assert (
            resp.headers["Content-Disposition"]
            == f'attachment; filename="{self.test_project_id}-aoi.geojson"'
        )


@pytest.mark.anyio
class TestProjectsQueriesOwnerAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )

        u_payload = await return_canned_user(self.db, "regular_user", 111111)
        self.test_user = await create_canned_user(self.db, u_payload)
        self.user_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_user.id)
        )
        self.author_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_author.id)
        )

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            created = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                created.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

        self.url = "/api/v2/projects/queries/myself/owner/"

    async def test_returns_403_if_user_not_logged_in(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_403_if_user_doesnt_have_PM_role(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 403

    async def test_returns_200_if_user_org_manager(self, client: AsyncClient):
        await add_manager_to_organisation(self.org_record, self.test_author, self.db)
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.author_session_token}"}
        )
        assert resp.status_code == 200
        assert len(resp.json()["activeProjects"]) == 1


@pytest.mark.anyio
class TestProjectsQueriesNoTasksAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )

        u_payload = await return_canned_user(self.db, "regular_user", 222222)
        self.test_user = await create_canned_user(self.db, u_payload)
        self.user_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_user.id)
        )
        self.author_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_author.id)
        )

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            created = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                created.id, self.db
            )

        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

        self.url = f"/api/v2/projects/{self.test_project_id}/queries/notasks/"

    async def test_returns_403_if_user_not_logged_in(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_403_if_user_doesnt_have_PM_role(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 403

    async def test_returns_404_if_project_doesnt_exist(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/projects/999/queries/notasks/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 404

    async def test_returns_200_for_admin(self, client: AsyncClient):
        # make user admin
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 200

    async def test_returns_200_if_user_org_manager(self, client: AsyncClient):
        # make user a mapper role (org manager)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.MAPPER.value, "id": int(self.test_user.id)},
        )
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 200

    async def test_returns_200_if_user_team_member(self, client: AsyncClient):
        team = await create_canned_team(self.db)
        await add_user_to_team(
            team, self.test_user, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        await assign_team_to_project(
            self.test_project_id, team.id, TeamRoles.PROJECT_MANAGER.value, self.db
        )
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 200


@pytest.mark.anyio
class TestProjectQueriesSimilarProjectsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        self.url = f"/api/v2/projects/queries/{self.test_project_id}/similar-projects/"
        self.user_session_token = _encode_token(
            AuthenticationService.generate_session_token_for_user(self.test_author.id)
        )

    async def create_project(self, status=ProjectStatus.PUBLISHED.value):
        project, _, project_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": status, "id": int(project_id)},
        )
        return project, project_id

    async def arrange_projects(self):
        p1, id1 = await self.create_project()
        p2, id2 = await self.create_project()
        p3, id3 = await self.create_project()
        return p1, id1, p2, id2, p3, id3

    async def test_private_projects_are_not_returned_if_user_not_logged_in(
        self, client: AsyncClient
    ):
        p1, id1, p2, id2, p3, id3 = await self.arrange_projects()
        # make one private
        await self.db.execute(
            "UPDATE projects SET private = true WHERE id = :id", {"id": int(id3)}
        )
        resp = await client.get(self.url)
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 2

    async def test_returns_404_if_project_doesnt_exist(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/projects/queries/999/similar-projects/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 404

    async def test_returns_private_projects_if_user_is_allowed(
        self, client: AsyncClient
    ):
        p1, id1, p2, id2, p3, id3 = await self.arrange_projects()
        await self.db.execute(
            "UPDATE projects SET private = true WHERE id = :id", {"id": int(id3)}
        )
        await self.db.execute(
            "UPDATE users SET role = :r WHERE id = :id",
            {"r": UserRole.ADMIN.value, "id": int(self.test_author.id)},
        )
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) >= 3

    async def test_returns_limit_projects(self, client: AsyncClient):
        p1, id1, p2, id2, p3, id3 = await self.arrange_projects()
        resp = await client.get(
            f"{self.url}?limit=1",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 1
