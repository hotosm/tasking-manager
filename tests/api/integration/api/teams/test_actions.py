import base64
from unittest.mock import AsyncMock, patch

from backend.services.team_service import TeamServiceError
import pytest
from httpx import AsyncClient

from backend.exceptions import get_message_from_sub_code
from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.statuses import (
    UserRole,
    TeamJoinMethod,
    TeamMemberFunctions,
)

from tests.api.helpers.test_helpers import (
    create_canned_user,
    return_canned_user,
    create_canned_team,
    add_user_to_team,
)

TEST_ADMIN_USERNAME = "Test Admin"
TEST_MESSAGE = "This is a test message"
TEST_SUBJECT = "Test Subject"
NON_EXISTENT_USER = "Random User"

TEAM_NOT_FOUND_SUB_CODE = "TEAM_NOT_FOUND"
USER_NOT_FOUND_SUB_CODE = "USER_NOT_FOUND"
TEAM_NOT_FOUND_MESSAGE = get_message_from_sub_code(TEAM_NOT_FOUND_SUB_CODE)
USER_NOT_FOUND_MESSAGE = get_message_from_sub_code(USER_NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestTeamsActionsJoinAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create canned rows
        self.test_team = await create_canned_team(self.db)
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)

        admin_result = await return_canned_user(
            self.db, username=TEST_ADMIN_USERNAME, id=11111
        )
        self.test_admin = await create_canned_user(self.db, admin_result)
        # make admin
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )

        raw_admin = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.admin_token = (
            f"Token {base64.b64encode(raw_admin.encode('utf-8')).decode('utf-8')}"
        )
        self.session_token = (
            f"Token {base64.b64encode(raw_user.encode('utf-8')).decode('utf-8')}"
        )

        team_id = self.test_team.id
        self.endpoint_url = f"/api/v2/teams/{team_id}/actions/join/"

    async def test_request_to_join_team_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(self.endpoint_url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_request_to_join_team_by_authenticated_user_passes(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        assert resp.status_code == 200
        assert resp.json().get("Success") == "Join request successful"

    async def test_request_to_join_non_existent_team_fails(self, client: AsyncClient):
        resp = await client.post(
            "/api/v2/teams/99/actions/join/",
            headers={"Authorization": self.session_token},
        )
        assert resp.status_code == 404
        body = resp.json()
        assert body["error"]["message"] == TEAM_NOT_FOUND_MESSAGE

    async def test_request_to_join_team_with_invite_only_request_fails(
        self, client: AsyncClient
    ):
        # set join_method to BY_INVITE directly in DB
        team_id = (
            getattr(self.test_team, "id", None)
            or getattr(self.test_team, "teamId", None)
            or 1
        )
        await self.db.execute(
            "UPDATE teams SET join_method = :join_method WHERE id = :id",
            {"join_method": TeamJoinMethod.BY_INVITE.value, "id": team_id},
        )
        resp = await client.post(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["Error"] == "Team join method is BY_INVITE"


@pytest.mark.anyio
class TestTeamsActionsAddAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        team_result = await create_canned_team(self.db)
        self.test_team = (
            team_result if not isinstance(team_result, tuple) else team_result[0]
        )
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)

        admin_result = await return_canned_user(
            self.db, username=TEST_ADMIN_USERNAME, id=11111
        )
        self.test_admin = await create_canned_user(self.db, admin_result)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )

        raw_admin = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.admin_token = (
            f"Token {base64.b64encode(raw_admin.encode('utf-8')).decode('utf-8')}"
        )
        self.session_token = (
            f"Token {base64.b64encode(raw_user.encode('utf-8')).decode('utf-8')}"
        )

        team_id = (
            getattr(self.test_team, "id", None)
            or getattr(self.test_team, "teamId", None)
            or 1
        )
        self.endpoint_url = f"/api/v2/teams/{team_id}/actions/add/"

    async def test_add_members_to_team_by_admin_passes(self, client: AsyncClient):
        payload = {
            "username": self.test_user.username,
            "role": TeamMemberFunctions.MEMBER.name.lower(),
        }
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 200
        assert resp.json().get("Success") == "User added to the team"

    async def test_add_members_to_team_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        payload = {
            "username": self.test_user.username,
            "role": TeamMemberFunctions.MEMBER.name.lower(),
        }
        resp = await client.post(self.endpoint_url, json=payload)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_add_members_to_team_using_invalid_data_fails(
        self, client: AsyncClient
    ):
        payload = {
            "user_username": self.test_user.username,
            "team_role": TeamMemberFunctions.MEMBER.name.lower(),
        }
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"

    async def test_add_members_to_team_by_non_admin_fails(self, client: AsyncClient):
        payload = {
            "username": self.test_user.username,
            "role": TeamMemberFunctions.MEMBER.name.lower(),
        }

        with pytest.raises(TeamServiceError) as excinfo:
            await client.post(
                self.endpoint_url,
                json=payload,
                headers={"Authorization": self.session_token},
            )

        error_message = str(excinfo.value)
        assert "User is not allowed to add member to the team" in error_message

    async def test_add_non_existent_members_to_team_fails(self, client: AsyncClient):
        payload = {
            "username": NON_EXISTENT_USER,
            "role": TeamMemberFunctions.MEMBER.name.lower(),
        }
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 404
        err = resp.json().get("error", {})
        assert err.get("sub_code") == "USER_NOT_FOUND"

    async def test_add_members_to_non_existent_team_fails(self, client: AsyncClient):
        payload = {
            "username": NON_EXISTENT_USER,
            "role": TeamMemberFunctions.MEMBER.name.lower(),
        }
        resp = await client.post(
            "/api/v2/teams/99/actions/add/",
            json=payload,
            headers={"Authorization": self.admin_token},
        )
        assert resp.status_code == 404
        err = resp.json().get("error", {})
        assert err.get("sub_code") == "TEAM_NOT_FOUND"


@pytest.mark.anyio
class TestTeamsActionsLeaveAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_team = await create_canned_team(self.db)
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)

        admin_result = await return_canned_user(
            self.db, username=TEST_ADMIN_USERNAME, id=11111
        )
        self.test_admin = await create_canned_user(self.db, admin_result)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )

        raw_admin = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.admin_token = (
            f"Token {base64.b64encode(raw_admin.encode('utf-8')).decode('utf-8')}"
        )
        self.session_token = (
            f"Token {base64.b64encode(raw_user.encode('utf-8')).decode('utf-8')}"
        )

        team_id = self.test_team.id
        self.endpoint_url = f"/api/v2/teams/{team_id}/actions/leave/"

    async def test_remove_members_from_team_by_admin_passes(self, client: AsyncClient):
        # add member first
        await add_user_to_team(
            team=self.test_team,
            user=self.test_user,
            role=TeamMemberFunctions.MEMBER.value,
            is_active=True,
            db=self.db,
        )

        payload = {"username": self.test_user.username}
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 200
        assert resp.json().get("Success") == "User removed from the team"

    async def test_remove_members_from_team_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        payload = {"username": self.test_user.username}
        resp = await client.post(self.endpoint_url, json=payload)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_remove_members_from_team_by_non_admin_fails(
        self, client: AsyncClient
    ):
        payload = {"username": self.test_admin.username}
        resp = await client.post(
            self.endpoint_url,
            json=payload,
            headers={"Authorization": self.session_token},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert (
            body["Error"]
            == f"You don't have permissions to remove {TEST_ADMIN_USERNAME} from this team."
        )
        assert body["SubCode"] == "RemoveUserError"

    async def test_remove_non_existent_members_from_team_fails(
        self, client: AsyncClient
    ):
        payload = {"username": NON_EXISTENT_USER}
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 404
        err = resp.json().get("error", {})
        assert err.get("message") == USER_NOT_FOUND_MESSAGE
        assert err.get("sub_code") == USER_NOT_FOUND_SUB_CODE

    async def test_remove_members_from_non_existent_team_fails(
        self, client: AsyncClient
    ):
        payload = {"username": self.test_user.username}
        resp = await client.post(
            "/api/v2/teams/99/actions/leave/",
            json=payload,
            headers={"Authorization": self.admin_token},
        )
        assert resp.status_code == 404
        err = resp.json().get("error", {})
        assert err.get("message") == TEAM_NOT_FOUND_MESSAGE
        assert err.get("sub_code") == TEAM_NOT_FOUND_SUB_CODE


@pytest.mark.anyio
class TestTeamsActionsMessageMembersAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_team = await create_canned_team(self.db)
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)

        admin_result = await return_canned_user(
            self.db, username=TEST_ADMIN_USERNAME, id=11111
        )
        self.test_admin = await create_canned_user(self.db, admin_result)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_admin.id},
        )

        raw_admin = AuthenticationService.generate_session_token_for_user(
            self.test_admin.id
        )
        self.admin_token = (
            f"Token {base64.b64encode(raw_admin.encode('utf-8')).decode('utf-8')}"
        )
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.session_token = (
            f"Token {base64.b64encode(raw_user.encode('utf-8')).decode('utf-8')}"
        )

        team_id = self.test_team.id
        self.endpoint_url = f"/api/v2/teams/{team_id}/actions/message-members/"

    async def test_message_members_non_existent_team_fails(self, client: AsyncClient):
        payload = {"message": TEST_MESSAGE, "subject": TEST_SUBJECT}
        resp = await client.post(
            "/api/v2/teams/99/actions/message-members/",
            json=payload,
            headers={"Authorization": self.admin_token},
        )
        assert resp.status_code == 404
        err = resp.json().get("error", {})
        assert err.get("message") == TEAM_NOT_FOUND_MESSAGE
        assert err.get("sub_code") == TEAM_NOT_FOUND_SUB_CODE

    async def test_message_team_members_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        payload = {"message": TEST_MESSAGE, "subject": TEST_SUBJECT}
        resp = await client.post(self.endpoint_url, json=payload)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_message_team_members_by_non_admin_fails(self, client: AsyncClient):
        payload = {"message": TEST_MESSAGE, "subject": TEST_SUBJECT}
        resp = await client.post(
            self.endpoint_url,
            json=payload,
            headers={"Authorization": self.session_token},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "Unauthorised to send message to team members"
        assert body["SubCode"] == "UserNotPermitted"

    async def test_message_team_members_with_invalid_data_fails(
        self, client: AsyncClient
    ):
        payload = {
            "message": ["Message should be a string type not list"],
            "subject": "",
        }
        resp = await client.post(
            self.endpoint_url, json=payload, headers={"Authorization": self.admin_token}
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["Error"] == "Request payload did not match validation"
        assert body["SubCode"] == "InvalidData"

    async def test_message_team_members_with_valid_message_by_admin_passes(
        self, client: AsyncClient
    ):
        payload = {"message": TEST_MESSAGE, "subject": TEST_SUBJECT}

        with patch(
            "backend.api.teams.actions.TeamService.send_message_to_all_team_members",
            new_callable=AsyncMock,
        ) as mock_send_message:
            resp = await client.post(
                self.endpoint_url,
                json=payload,
                headers={"Authorization": self.admin_token},
            )

            # Assert the response
            assert resp.status_code == 200
            assert resp.json().get("Success") == "Message sent successfully"

            # Assert the background task (service call) was called exactly once
            mock_send_message.assert_awaited_once()

            # Optional: assert it was called with the correct arguments
            called_args = mock_send_message.call_args[0]
            assert called_args[0] == self.test_team.id  # team_id
            assert called_args[1] == self.test_team.name  # team_name
            assert called_args[2].message == TEST_MESSAGE  # MessageDTO
            assert called_args[2].subject == TEST_SUBJECT
            assert called_args[3] == self.test_admin.id
