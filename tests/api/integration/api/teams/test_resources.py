import base64
import csv
import io

import pytest
from httpx import AsyncClient

from backend.config import settings
from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.statuses import TeamMemberFunctions, UserRole

from tests.api.helpers.test_helpers import (
    add_user_to_team,
    create_canned_organisation,
    create_canned_project,
    create_canned_team,
    create_canned_user,
    return_canned_team,
    return_canned_user,
)

from tests.api.integration.api.teams.test_actions import (
    TEAM_NOT_FOUND_SUB_CODE,
    TEAM_NOT_FOUND_MESSAGE,
)

TEST_ORGANISATION_NAME = "Kathmandu Living Labs"
TEST_ORGANISATION_SLUG = "KLL"
TEST_ORGANISATION_ID = 23
TEST_TEAM_NAME = "Test Team"
NEW_TEAM_NAME = "KLL Team"


@pytest.mark.anyio
class TestTeamsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_org = await create_canned_organisation(self.db)

        user_result = await return_canned_user(self.db, username="test user", id=111111)
        self.test_user = await create_canned_user(self.db, user_result)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.test_user_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )
        # create canned team (helper should insert and return team or (team, id))
        self.test_team = await create_canned_team(self.db)
        team_id = self.test_team.id
        self.endpoint_url = f"/api/v2/teams/{team_id}/"

    async def test_get_non_existent_team_by_id_fails(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/teams/99/", headers={"Authorization": self.test_user_token}
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == TEAM_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == TEAM_NOT_FOUND_SUB_CODE

    async def test_get_team_by_id_passes(self, client: AsyncClient):
        resp = await client.get(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == TEST_TEAM_NAME
        assert body["organisation_id"] == TEST_ORGANISATION_ID
        assert body["organisationSlug"] == TEST_ORGANISATION_SLUG
        assert body["organisation"] == TEST_ORGANISATION_NAME
        assert body["is_org_admin"] is False
        assert body["team_projects"] == []

    async def test_update_team_by_admin_passes(self, client: AsyncClient):
        # make user admin in DB
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_user.id},
        )
        resp = await client.patch(
            self.endpoint_url,
            headers={"Authorization": self.test_user_token},
            json={"name": NEW_TEAM_NAME},
        )
        assert resp.status_code == 200
        assert resp.json() == {"Status": "Updated"}

    async def test_update_team_by_unauthenticated_user_fails(self, client: AsyncClient):
        resp = await client.patch(self.endpoint_url, json={"name": NEW_TEAM_NAME})
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_update_team_by_non_admin_fails(self, client: AsyncClient):
        resp = await client.patch(
            self.endpoint_url,
            headers={"Authorization": self.test_user_token},
            json={"name": NEW_TEAM_NAME},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "User is not a admin or a manager for the team"
        assert body["SubCode"] == "UserNotTeamManager"

    async def test_update_team_with_invalid_data_fails(self, client: AsyncClient):
        resp = await client.patch(
            self.endpoint_url,
            headers={"Authorization": self.test_user_token},
            json={"team_name": NEW_TEAM_NAME, "join_method": "TEST"},
        )
        assert resp.status_code == 400

    async def test_delete_team_by_admin_passes(self, client: AsyncClient):
        # make user admin in DB
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_user.id},
        )
        resp = await client.delete(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["Success"] == "Team deleted"

    async def test_delete_team_by_unauthenticated_user_fails(self, client: AsyncClient):
        resp = await client.delete(self.endpoint_url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_delete_team_by_non_admin_fails(self, client: AsyncClient):
        resp = await client.delete(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "User is not a manager for the team"
        assert body["SubCode"] == "UserNotTeamManager"

    async def test_delete_non_existent_team_by_id_fails(self, client: AsyncClient):
        # make user admin in DB
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_user.id},
        )
        resp = await client.delete(
            "/api/v2/teams/99/", headers={"Authorization": self.test_user_token}
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == TEAM_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == TEAM_NOT_FOUND_SUB_CODE


@pytest.mark.anyio
class TestTeamsAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create organisation and admin user
        self.test_org = await create_canned_organisation(self.db)
        self.test_org_id = self.test_org.id

        admin_user_result = await return_canned_user(
            self.db, username="test admin", id=111111
        )
        self.test_admin = await create_canned_user(self.db, admin_user_result)
        # set admin role
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )
        raw = AuthenticationService.generate_session_token_for_user(self.test_admin.id)
        self.admin_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

        # non-admin user
        non_admin_result = await return_canned_user(self.db)
        self.test_non_admin = await create_canned_user(self.db, non_admin_result)
        raw_non = AuthenticationService.generate_session_token_for_user(
            self.test_non_admin.id
        )
        self.non_admin_token = (
            f"Token {base64.b64encode(raw_non.encode('utf-8')).decode('utf-8')}"
        )

        # endpoint
        self.endpoint_url = "/api/v2/teams/"

    async def test_create_new_team_for_non_existent_org_fails(
        self, client: AsyncClient
    ):
        payload = {
            "description": "",
            "joinMethod": "ANY",
            "name": "KLL Team",
            "organisation_id": 99,
            "visibility": "PUBLIC",
        }
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        body = resp.json()
        assert resp.status_code == 400
        assert body["Error"] == "Organisation 99 does not exist"

    async def test_create_new_team_non_admin_fails(self, client: AsyncClient):
        payload = {
            "description": None,
            "joinMethod": "ANY",
            "name": NEW_TEAM_NAME,
            "organisation_id": TEST_ORGANISATION_ID,
            "visibility": "PUBLIC",
        }
        resp = await client.post(
            self.endpoint_url,
            json=payload,
            headers={"Authorization": self.non_admin_token},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "User not permitted to create team for the Organisation"
        assert body["SubCode"] == "CreateTeamNotPermitted"

    async def test_create_new_team_existent_org_passes(self, client: AsyncClient):
        payload = {
            "description": None,
            "joinMethod": "ANY",
            "name": NEW_TEAM_NAME,
            "organisation_id": TEST_ORGANISATION_ID,
            "visibility": "PUBLIC",
        }
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 201
        assert "teamId" in resp.json()

    async def test_get_teams_authorised_passes(self, client: AsyncClient):
        # create a team row via helper or return_canned_team + create
        team_obj = await return_canned_team(
            self.db, name=TEST_TEAM_NAME, org_name=self.test_org.name
        )
        # create via helper
        await create_canned_team(self.db, team_obj)
        resp = await client.get(
            self.endpoint_url, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body.get("teams"), list)
        # assert at least one team with expected name exists
        assert any(t.get("name") == TEST_TEAM_NAME for t in body["teams"])

    async def test_get_teams_unauthorised_fails(self, client: AsyncClient):
        resp = await client.get(self.endpoint_url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}


@pytest.mark.anyio
class TestTeamJoinRequestsCSV:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_org = await create_canned_organisation(self.db)

        manager_result = await return_canned_user(
            self.db, username="team manager", id=222222
        )
        self.test_manager = await create_canned_user(self.db, manager_result)
        raw = AuthenticationService.generate_session_token_for_user(
            self.test_manager.id
        )
        self.manager_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

        self.test_team = await create_canned_team(self.db)
        await add_user_to_team(
            self.test_team,
            self.test_manager,
            TeamMemberFunctions.MANAGER.value,
            True,
            self.db,
        )

        candidate_result = await return_canned_user(
            self.db, username="join candidate", id=333333
        )
        self.candidate = await create_canned_user(self.db, candidate_result)
        # Mapping level 2 is seeded as INTERMEDIATE by the mapping_levels migration.
        await self.db.execute(
            "UPDATE users SET mapping_level = :level WHERE id = :id",
            {"level": 2, "id": self.candidate.id},
        )
        await add_user_to_team(
            self.test_team,
            self.candidate,
            TeamMemberFunctions.MEMBER.value,
            False,
            self.db,
        )

        self.endpoint_url = f"/api/v2/teams/join_requests/?team_id={self.test_team.id}"

    async def test_join_requests_csv_returns_message_when_no_pending_requests(
        self, client: AsyncClient
    ):
        empty_team = await create_canned_team(self.db)
        resp = await client.get(
            f"/api/v2/teams/join_requests/?team_id={empty_team.id}",
            headers={"Authorization": self.manager_token},
        )
        assert resp.status_code == 200
        assert resp.json() == {
            "message": "No inactive members found for the specified team"
        }

    async def test_join_requests_csv_includes_mapper_level_and_stats(
        self, client: AsyncClient
    ):
        other_team = await create_canned_team(
            self.db, await return_canned_team(self.db, name="Other Team")
        )
        await add_user_to_team(
            other_team, self.candidate, TeamMemberFunctions.MEMBER.value, True, self.db
        )

        _, _, project_id = await create_canned_project(self.db)
        for action, action_text in (
            ("STATE_CHANGE", "MAPPED"),
            ("STATE_CHANGE", "VALIDATED"),
            ("LOCKED_FOR_MAPPING", "00:05:00"),
        ):
            await self.db.execute(
                """
                INSERT INTO task_history
                    (project_id, task_id, action, action_text, action_date, user_id)
                VALUES
                    (:project_id, 1, :action, :action_text, now(), :user_id)
                """,
                {
                    "project_id": project_id,
                    "action": action,
                    "action_text": action_text,
                    "user_id": self.candidate.id,
                },
            )

        resp = await client.get(
            self.endpoint_url, headers={"Authorization": self.manager_token}
        )

        assert resp.status_code == 200
        rows = list(csv.reader(io.StringIO(resp.text)))
        assert rows[0] == [
            "Username",
            "Date Joined (UTC)",
            "Team Name",
            "Mapper Level",
            "Tasks Mapped",
            "Tasks Validated",
            "Time Spent Mapping (seconds)",
            "Other Teams Joined",
        ]
        data_row = rows[1]
        assert self.candidate.username in data_row[0]
        assert data_row[2] == self.test_team.name
        assert data_row[3] == "INTERMEDIATE"
        assert data_row[4] == "1"  # tasks mapped
        assert data_row[5] == "1"  # tasks validated
        assert data_row[6] == "300"  # time spent mapping, in seconds
        assert data_row[7] == other_team.name

    async def test_join_requests_csv_links_username_to_profile(
        self, client: AsyncClient
    ):
        resp = await client.get(
            self.endpoint_url, headers={"Authorization": self.manager_token}
        )
        assert resp.status_code == 200
        rows = list(csv.reader(io.StringIO(resp.text)))
        # The username cell is a spreadsheet formula so the name is clickable
        # from the downloaded CSV, with the username percent-encoded in the URL.
        assert rows[1][0] == (
            f'=HYPERLINK("{settings.APP_BASE_URL}/users/join%20candidate/",'
            f'"{self.candidate.username}")'
        )
