# tests/api/integration/test_project_actions_refactored.py
import base64
import json
from unittest.mock import ANY, patch

from backend.exceptions import NotFound
from backend.models.postgis.organisation import Organisation
from backend.services.messaging.message_service import MessageService
from backend.services.organisation_service import OrganisationService
import geojson
import pytest
from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.services.project_service import ProjectService
from backend.models.postgis.task import Task
from backend.models.postgis.statuses import (
    UserRole,
    TaskStatus,
    TeamMemberFunctions,
    TeamRoles,
)

from tests.api.helpers.test_helpers import (
    create_canned_user,
    get_canned_json,
    create_canned_project,
    return_canned_user,
    create_canned_organisation,
    add_manager_to_organisation,
    create_canned_team,
    add_user_to_team,
)


def _encode_token(raw_token: str) -> str:
    return base64.b64encode(raw_token.encode("utf-8")).decode("utf-8")


@pytest.mark.anyio
class TestProjectActionsIntersectingTilesAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.url = "/api/v2/projects/actions/intersecting-tiles/"
        # create a canned user
        self.test_user = await create_canned_user(self.db)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.test_user_access_token = _encode_token(raw)

    async def test_returns_403_if_not_authenticated(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_returns_400_if_invalid_data(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            json={"grid": "invalid"},
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 422

    async def test_returns_clipped_grid_if_clip_to_aoi_set_true(
        self, client: AsyncClient
    ):
        payload = get_canned_json("test_grid.json")
        payload["clipToAoi"] = True
        resp = await client.post(
            self.url,
            json=payload,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 200

    async def test_returns_not_clipped_grid_if_clip_to_aoi_set_false(
        self, client: AsyncClient
    ):
        payload = get_canned_json("test_grid.json")
        payload["clipToAoi"] = False
        expected_response = geojson.loads(
            json.dumps(get_canned_json("feature_collection.json"))
        )

        resp = await client.post(
            self.url,
            json=payload,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 200
        assert geojson.loads(resp.text) == expected_response

    async def test_raises_invalid_geojson_exception_if_invalid_aoi(
        self, client: AsyncClient
    ):
        payload = get_canned_json("test_grid.json")
        payload["areaOfInterest"]["features"] = []

        resp = await client.post(
            self.url,
            json=payload,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "MustHaveFeatures"

    async def test_raises_invalid_geojson_exception_if_self_intersecting_aoi(
        self, client: AsyncClient
    ):
        payload = get_canned_json("self_intersecting_aoi.json")

        resp = await client.post(
            self.url,
            json=payload,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "SelfIntersectingAOI"


@pytest.mark.anyio
class TestProjectsActionsMessageContributorsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = (
            f"/api/v2/projects/{self.test_project_id}/actions/message-contributors/"
        )
        self.test_message = "Test message"
        self.test_subject = "Test subject"

        user_payload = await return_canned_user(self.db, "Test User", 1111111)
        self.test_user = await create_canned_user(self.db, user_payload)

        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.test_user_access_token = _encode_token(raw_user)
        raw_author = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.test_author_access_token = _encode_token(raw_author)

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            test_org = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                test_org.id, self.db
            )
        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

    async def test_returns_403_if_not_authenticated(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.post(
            "/api/v2/projects/999/actions/message-contributors/",
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 404

    async def test_returns_403_if_user_dont_have_PM_permissions(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 403

    async def test_returns_400_if_invalid_data(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            json={"subject": self.test_subject},
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 400

    @patch.object(MessageService, "send_message_to_all_contributors")
    async def test_sends_message_to_contributors_is_allowed_to_project_author(
        self, mock_send, client: AsyncClient
    ):
        # Add a contributor to the project (task 2)
        t = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(t.id, t.project_id, self.test_user.id, self.db)
        await Task.unlock_task(
            t.id, t.project_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.post(
            self.url,
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": f"Token {self.test_author_access_token}"},
        )

        assert resp.status_code == 200

        # Background task MUST have been registered
        assert mock_send.call_count == 1

        # Optional: verify args were passed correctly
        mock_send.assert_called_with(self.test_project_id, ANY)

    @patch.object(MessageService, "send_message_to_all_contributors")
    async def test_sends_message_to_contributors_is_allowed_to_organisation_manager(
        self, mock_send, client: AsyncClient
    ):
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        t = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(t.id, t.project_id, self.test_user.id, self.db)
        await Task.unlock_task(
            t.id, t.project_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.post(
            self.url,
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 200

        # Background task MUST have been registered
        assert mock_send.call_count == 1

    @patch.object(MessageService, "send_message_to_all_contributors")
    async def test_sends_message_to_contributors_is_allowed_to_admin(
        self, mock_send, client: AsyncClient
    ):
        # make user admin

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )

        t = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(t.id, t.project_id, self.test_user.id, self.db)
        await Task.unlock_task(
            t.id, t.project_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.post(
            self.url,
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 200
        assert mock_send.call_count == 1

    @patch.object(MessageService, "send_message_to_all_contributors")
    async def test_sends_message_to_contributors_is_allowed_to_project_team_members_with_PM_permission(
        self, mock_send, client: AsyncClient
    ):
        test_team = await create_canned_team(self.db)
        # add user to team as member and give PM permission

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
                "project_id": self.test_project_id,
                "role": TeamRoles.PROJECT_MANAGER.value,
            },
        )

        t = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(t.id, t.project_id, self.test_user.id, self.db)
        await Task.unlock_task(
            t.id, t.project_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.post(
            self.url,
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": f"Token {self.test_user_access_token}"},
        )
        assert resp.status_code == 200
        assert mock_send.call_count == 1


@pytest.mark.anyio
class TestProjectsActionsTransferAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create receiving user
        u_payload = await return_canned_user(self.db, "test_user_1", 111111)
        self.test_user = await create_canned_user(self.db, u_payload)
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.test_user_access_token = _encode_token(raw_user)

        # create project and author
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        raw_author = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.test_author_access_token = _encode_token(raw_author)

        try:
            self.org_record = await OrganisationService.get_organisation_by_id(
                23, self.db
            )
        except NotFound:
            test_org = await create_canned_organisation(self.db)
            self.org_record = await OrganisationService.get_organisation_by_id(
                test_org.id, self.db
            )
        self.test_org = Organisation()
        self.test_org.id = self.org_record.organisation_id
        self.test_org.name = self.org_record.name
        self.test_org.slug = self.org_record.slug
        self.test_org.type = self.org_record.type

        self.url = (
            f"/api/v2/projects/{self.test_project_id}/actions/transfer-ownership/"
        )

    async def test_returns_403_if_unauthorized(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.post(
            "/api/v2/projects/1112/actions/transfer-ownership/",
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user"},
        )
        assert resp.status_code == 404

    async def test_returns_403_if_user_is_not_project_admin_org_manager_project_author(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user_1"},
        )
        assert resp.status_code == 403

    async def test_returns_403_if_new_owner_is_not_admin_or_manager_of_org_project_is_in_(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user_1"},
        )
        assert resp.status_code == 403

    async def test_returns_404_if_new_owner_does_not_exist(self, client: AsyncClient):
        # make requesting user admin so they can attempt transfer

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user_2"},
        )
        assert resp.status_code == 404

    async def test_returns_200_if_new_owner_is_admin_or_manager_of_org_project_is_in(
        self, client: AsyncClient
    ):
        # make requesting user admin

        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )
        # create new user who is admin
        new_payload = await return_canned_user(self.db, "test_user_2", 222222)
        test_user_2 = await create_canned_user(self.db, new_payload)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(test_user_2.id)},
        )

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user_2"},
        )
        assert resp.status_code == 200

        # verify project owner changed in DB
        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        assert proj.author_id == test_user_2.id

        # now ensure manager case works: make test_user_2 a mapper and a manager of org
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.MAPPER.value, "id": int(test_user_2.id)},
        )
        await add_manager_to_organisation(self.org_record, test_user_2, self.db)

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user_2"},
        )
        assert resp.status_code == 200
        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        assert proj.author_id == test_user_2.id

    @patch("threading.Thread.start")
    async def test_returns_200_if_requesting_user_is_project_author(
        self, mock_thread, client: AsyncClient
    ):
        # make requesting user admin so they can transfer to themselves
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )
        mock_thread.return_value = None

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_access_token}"},
            json={"username": "test_user_1"},
        )
        assert resp.status_code == 200
        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        assert proj.author_id == self.test_user.id

    @patch("threading.Thread.start")
    async def test_returns_200_if_requesting_user_is_org_manager(
        self, mock_thread, client: AsyncClient
    ):
        # create a new admin user who will become project owner
        new_payload = await return_canned_user(self.db, "test_user_2", 222222)
        test_user_2 = await create_canned_user(self.db, new_payload)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(test_user_2.id)},
        )

        # make test_user an org manager
        await add_manager_to_organisation(self.org_record, self.test_user, self.db)

        mock_thread.return_value = None
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user_2"},
        )
        assert resp.status_code == 200
        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        assert proj.author_id == test_user_2.id

    @patch("threading.Thread.start")
    async def test_returns_200_if_requesting_user_is_admin(
        self, mock_thread, client: AsyncClient
    ):
        # make requesting user admin
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_user.id)},
        )

        new_payload = await return_canned_user(self.db, "test_user_2", 222222)
        test_user_2 = await create_canned_user(self.db, new_payload)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(test_user_2.id)},
        )

        mock_thread.return_value = None
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_user_access_token}"},
            json={"username": "test_user_2"},
        )
        assert resp.status_code == 200
        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        assert proj.author_id == test_user_2.id
