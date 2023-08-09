from unittest.mock import patch
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    return_canned_organisation,
    generate_encoded_token,
    create_canned_user,
    return_canned_user,
    create_canned_team,
    add_user_to_team,
)
from backend.models.postgis.statuses import (
    UserRole,
    TeamJoinMethod,
    TeamMemberFunctions,
)
from backend.exceptions import get_message_from_sub_code

TEST_ADMIN_USERNAME = "Test Admin"
TEST_MESSAGE = "This is a test message"
TEST_SUBJECT = "Test Subject"
NON_EXISTENT_USER = "Random User"

TEAM_NOT_FOUND_SUB_CODE = "TEAM_NOT_FOUND"
USER_NOT_FOUND_SUB_CODE = "USER_NOT_FOUND"
TEAM_NOT_FOUND_MESSAGE = get_message_from_sub_code(TEAM_NOT_FOUND_SUB_CODE)
USER_NOT_FOUND_MESSAGE = get_message_from_sub_code(USER_NOT_FOUND_SUB_CODE)


class TestTeamsActionsJoinAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_team = create_canned_team()
        self.test_user = create_canned_user()
        self.test_org = return_canned_organisation()
        self.test_admin = return_canned_user(username=TEST_ADMIN_USERNAME, id=11111)
        self.test_admin.create()
        self.test_admin.role = UserRole.ADMIN.value
        self.admin_token = generate_encoded_token(self.test_admin.id)
        self.session_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = f"/api/v2/teams/{self.test_team.id}/actions/join/"

    # post
    def test_request_to_join_team_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when unauthenticated user requests to join a team
        """
        response = self.client.post(self.endpoint_url)
        self.assertEqual(response.status_code, 401)

    def test_request_to_join_team_by_authenticated_user_passes(self):
        """
        Test that endpoint returns 200 when authenticated user requests to join a team
        """
        response = self.client.post(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Join request successful")

    def test_request_to_join_non_existent_team_fails(self):
        """
        Test that endpoint returns 404 when a user requests to join a non existent team
        """
        response = self.client.post(
            "/api/v2/teams/99/actions/join/",
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["error"]["message"], TEAM_NOT_FOUND_MESSAGE)

    def test_request_to_join_team_with_invite_only_request_fails(self):
        """
        Test that endpoint returns 400 when a user requests to join a team that can only be joined by invite
        """
        self.test_team.join_method = TeamJoinMethod.BY_INVITE.value
        response = self.client.post(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["Error"], "Team join method is BY_INVITE")

    # patch
    def test_handle_join_request_by_admin_passes(self):
        """
        Test that endpoint returns 200 when admin accepts a join request
        """
        add_user_to_team(
            team=self.test_team,
            user=self.test_user,
            role=TeamMemberFunctions.MEMBER.value,
            is_active=True,
        )
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.admin_token},
            json={
                "action": "accept",
                "role": "member",
                "type": "join-response",
                "username": self.test_user.username,
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "True")

    def test_handle_join_request_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when an unauthenticated user tries to accept a join request
        """
        response = self.client.patch(
            self.endpoint_url,
            json={
                "action": "accept",
                "role": "member",
                "type": "join-response",
                "username": self.test_user.username,
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_handle_join_request_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when a non admin tries to accept a join request
        """
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={
                "action": "accept",
                "role": "member",
                "type": "join-response",
                "username": self.test_user.username,
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"],
            "You don't have permissions to approve this join team request",
        )
        self.assertEqual(response_body["SubCode"], "ApproveJoinError")

    def test_handle_join_request_to_non_existent_team_fails(self):
        """
        Test that endpoint returns 404 when handling a join request to a non existent team
        """
        response = self.client.patch(
            "/api/v2/teams/99/actions/join/",
            headers={"Authorization": self.session_token},
            json={
                "action": "accept",
                "role": "member",
                "type": "join-response",
                "username": self.test_user.username,
            },
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], TEAM_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], TEAM_NOT_FOUND_SUB_CODE)


class TestTeamsActionsAddAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_team = create_canned_team()
        self.test_user = create_canned_user()
        self.test_org = return_canned_organisation()
        self.test_admin = return_canned_user(username=TEST_ADMIN_USERNAME, id=11111)
        self.test_admin.create()
        self.test_admin.role = UserRole.ADMIN.value
        self.admin_token = generate_encoded_token(self.test_admin.id)
        self.session_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = f"/api/v2/teams/{self.test_team.id}/actions/add/"

    def test_add_members_to_team_by_admin_passes(self):
        """
        Test that endpoint returns 200 when admin adds members to a team successfully
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": self.test_user.username,
                "role": TeamMemberFunctions.MEMBER.name.lower(),
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "User added to the team")

    def test_add_members_to_team_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when an unauthenticated user tries to add members to a team
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": self.test_user.username,
                "role": TeamMemberFunctions.MEMBER.name.lower(),
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_add_members_to_team_using_invalid_data_fails(self):
        """
        Test that endpoint returns 400 when invalid data is used to add members to a team
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "user_username": self.test_user.username,
                "team_role": TeamMemberFunctions.MEMBER.name.lower(),
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_add_members_to_team_by_non_admin_fails(self):
        """
        Test that the endpoint returns 500 when non-admin handles a join request
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": self.test_user.username,
                "role": TeamMemberFunctions.MEMBER.name.lower(),
            },
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 500)
        error_resp = response_body["error"]
        self.assertEqual(error_resp["sub_code"], "INTERNAL_SERVER_ERROR")
        self.assertTrue(
            "User is not allowed to add member to the team" in error_resp["message"]
        )

    def test_add_non_existent_members_to_team_fails(self):
        """
        Test that endpoint returns 500 when adding non existent users to a team
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": NON_EXISTENT_USER,
                "role": TeamMemberFunctions.MEMBER.name.lower(),
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        error_resp = response_body["error"]
        self.assertEqual(error_resp["sub_code"], "USER_NOT_FOUND")

    def test_add_members_to_non_existent_team_fails(self):
        """
        Test that endpoint returns 500 when adding users to a non_existent team
        """
        response = self.client.post(
            "/api/v2/teams/99/actions/add/",
            json={
                "username": NON_EXISTENT_USER,
                "role": TeamMemberFunctions.MEMBER.name.lower(),
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        error_resp = response_body["error"]
        self.assertEqual(error_resp["sub_code"], "TEAM_NOT_FOUND")


class TestTeamsActionsLeaveAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_team = create_canned_team()
        self.test_user = create_canned_user()
        self.test_org = return_canned_organisation()
        self.test_admin = return_canned_user(username=TEST_ADMIN_USERNAME, id=11111)
        self.test_admin.create()
        self.test_admin.role = UserRole.ADMIN.value
        self.admin_token = generate_encoded_token(self.test_admin.id)
        self.session_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = f"/api/v2/teams/{self.test_team.id}/actions/leave/"

    def test_remove_members_from_team_by_admin_passes(self):
        """
        Test that endpoint returns 200 when an admin successfully removes existent member from team
        """
        # Act: add member to the team
        add_user_to_team(
            team=self.test_team,
            user=self.test_user,
            role=TeamMemberFunctions.MEMBER.value,
            is_active=True,
        )

        # Test: remove user from team
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": self.test_user.username,
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "User removed from the team")

    def test_remove_members_from_team_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when an unauthenticated user tries to remove a member from the team
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": self.test_user.username,
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_remove_members_from_team_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when a non-admin tries to remove a member from the team
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": self.test_admin.username,
            },
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"],
            f"You don't have permissions to remove {TEST_ADMIN_USERNAME} from this team.",
        )
        self.assertEqual(response_body["SubCode"], "RemoveUserError")

    def test_remove_non_existent_members_from_team_fails(self):
        """
        Test that endpoint returns 404 when attempting to remove non-existent members from a team
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "username": NON_EXISTENT_USER,
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], USER_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], USER_NOT_FOUND_SUB_CODE)

    def test_remove_members_from_non_existent_team_fails(self):
        """
        Test that endpoint returns 404 when attempting to remove members from a non-existent team
        """
        response = self.client.post(
            "/api/v2/teams/99/actions/leave/",
            json={
                "username": self.test_user.username,
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], TEAM_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], TEAM_NOT_FOUND_SUB_CODE)


class TestTeamsActionsMessageMembersAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_team = create_canned_team()
        self.test_user = create_canned_user()
        self.test_org = return_canned_organisation()
        self.test_admin = return_canned_user(username=TEST_ADMIN_USERNAME, id=11111)
        self.test_admin.create()
        self.test_admin.role = UserRole.ADMIN.value
        self.admin_token = generate_encoded_token(self.test_admin.id)
        self.session_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = (
            f"/api/v2/teams/{self.test_team.id}/actions/message-members/"
        )

    def test_message_members_non_existent_team_fails(self):
        """
        Test that endpoint returns 404 when messaging members of non-existent team
        """
        response = self.client.post(
            "/api/v2/teams/99/actions/message-members/",
            json={"message": TEST_MESSAGE, "subject": TEST_SUBJECT},
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], TEAM_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], TEAM_NOT_FOUND_SUB_CODE)

    def test_message_team_members_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when messaging members by an unauthenticated user
        """
        response = self.client.post(
            self.endpoint_url,
            json={"message": TEST_MESSAGE, "subject": TEST_SUBJECT},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_message_team_members_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when messaging members by a non admin
        """
        response = self.client.post(
            self.endpoint_url,
            json={"message": TEST_MESSAGE, "subject": TEST_SUBJECT},
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "Unauthorised to send message to team members"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_message_team_members_with_invalid_data_fails(self):
        """
        Test that endpoint returns 400 when sending invalid request data to the messaging API
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "message": ["Message should be a string type not list"],
                "subject": "",
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response_body["Error"], "Request payload did not match validation"
        )
        self.assertEqual(response_body["SubCode"], "InvalidData")

    @patch("threading.Thread.start")
    def test_message_team_members_with_valid_message_by_admin_passes(self, mock_thread):
        """
        Test that endpoint returns 200 when sending vaalid message to team members
        """
        # Mock the thread start method to avoid application context issues
        mock_thread.return_value = None
        response = self.client.post(
            self.endpoint_url,
            json={"message": TEST_MESSAGE, "subject": TEST_SUBJECT},
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Message sent successfully")
