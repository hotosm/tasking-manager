from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    generate_encoded_token,
    create_canned_user,
    return_canned_user,
    return_canned_team,
    create_canned_team,
)
from tests.backend.integration.api.teams.test_actions import (
    TEAM_NOT_FOUND_SUB_CODE,
    TEAM_NOT_FOUND_MESSAGE,
)
from tests.backend.integration.api.organisations.test_resources import (
    ORG_NOT_FOUND_MESSAGE,
    ORG_NOT_FOUND_SUB_CODE,
)


from backend.models.postgis.statuses import UserRole

TEST_ORGANISATION_NAME = "Kathmandu Living Labs"
TEST_ORGANISATION_SLUG = "KLL"
TEST_ORGANISATION_ID = 23
TEST_TEAM_NAME = "Test Team"
NEW_TEAM_NAME = "KLL Team"


class TestTeamsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_org = create_canned_organisation()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.test_team = create_canned_team()
        self.endpoint_url = f"/api/v2/teams/{self.test_team.id}/"

    # get
    def test_get_non_existent_team_by_id_fails(self):
        """
        Test that endpoint returns 404 if team does not exist
        """
        response = self.client.get("/api/v2/teams/99/")
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], TEAM_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], TEAM_NOT_FOUND_SUB_CODE)

    def test_get_team_by_id_passes(self):
        """
        Test that endpoint returns 200 when retrieving existing team
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["name"], TEST_TEAM_NAME)
        self.assertEqual(response_body["organisation_id"], TEST_ORGANISATION_ID)
        self.assertEqual(response_body["organisationSlug"], TEST_ORGANISATION_SLUG)
        self.assertEqual(response_body["organisation"], TEST_ORGANISATION_NAME)
        self.assertEqual(response_body["is_org_admin"], False)
        self.assertEqual(response_body["team_projects"], [])

    # patch
    def test_update_team_by_admin_passes(self):
        """
        Test that endpoint returns 200 if team update is successful
        """
        self.test_user.role = UserRole.ADMIN.value
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.test_user_token},
            json={"name": NEW_TEAM_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, {"Status": "Updated"})

    def test_update_team_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 if an unauthenticated user tries to update a team
        """
        response = self.client.patch(self.endpoint_url, json={"name": NEW_TEAM_NAME})
        self.assertEqual(response.status_code, 401)

    def test_update_team_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 if a non_admin tries to update a team

        """
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.test_user_token},
            json={"name": NEW_TEAM_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "User is not a admin or a manager for the team"
        )
        self.assertEqual(response_body["SubCode"], "UserNotTeamManager")

    def test_update_team_with_invalid_data_fails(self):
        """
        Test that endpoint returns 400 if an admin tries to update a team using the wrong request keys/data
        """
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.test_user_token},
            json={"team_name": NEW_TEAM_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["SubCode"], "InvalidData")

    # delete
    def test_delete_team_by_admin_passes(self):
        """
        Test that endpoint returns 200 upon successful deletion of a team
        """
        self.test_user.role = UserRole.ADMIN.value
        response = self.client.delete(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Team deleted")

    def test_delete_team_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 if an unauthenticated user tries to delete a team
        """
        response = self.client.delete(self.endpoint_url)
        self.assertEqual(response.status_code, 401)

    def test_delete_team_by_non_admin_fails(self):
        """
        Test that endpoint returns 401 if a non_admin tries to delete a team
        """
        response = self.client.delete(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["Error"], "User is not a manager for the team")
        self.assertEqual(response_body["SubCode"], "UserNotTeamManager")

    def test_delete_non_existent_team_by_id_fails(self):
        """
        Test that endpoint returns 404 while deleting a non-existent team
        """
        self.test_user.role = UserRole.ADMIN.value
        response = self.client.delete(
            "/api/v2/teams/99/", headers={"Authorization": self.test_user_token}
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], TEAM_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], TEAM_NOT_FOUND_SUB_CODE)


class TestTeamsAllPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_org = create_canned_organisation()
        self.test_admin = return_canned_user("test user", 111111)
        self.test_admin.create()
        self.test_admin.role = UserRole.ADMIN.value
        self.admin_token = generate_encoded_token(self.test_admin.id)
        self.test_non_admin = create_canned_user()
        self.non_admin_token = generate_encoded_token(self.test_non_admin.id)
        self.endpoint_url = "/api/v2/teams/"

    # post
    def test_create_new_team_for_non_existent_org_fails(self):
        """
        Test that endpoint returns 404 when creating a team for a non-existent organisation
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "description": "",
                "joinMethod": "ANY",
                "name": "KLL Team",
                "organisation_id": 99,
                "visibility": "PUBLIC",
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], ORG_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], ORG_NOT_FOUND_SUB_CODE)

    def test_create_new_team_non_admin_fails(self):
        """
        Test that endpoint returns 403 when creating a team by a non-admin
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "description": None,
                "joinMethod": "ANY",
                "name": NEW_TEAM_NAME,
                "organisation_id": TEST_ORGANISATION_ID,
                "visibility": "PUBLIC",
            },
            headers={"Authorization": self.non_admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"],
            "User not permitted to create team for the Organisation",
        )
        self.assertEqual(response_body["SubCode"], "CreateTeamNotPermitted")

    def test_create_new_team_existent_org_passes(self):
        """
        Test that endpoint returns 201 when creating a team by admin for an existent organisation
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "description": None,
                "joinMethod": "ANY",
                "name": NEW_TEAM_NAME,
                "organisation_id": TEST_ORGANISATION_ID,
                "visibility": "PUBLIC",
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response_body, {"teamId": 1})

    # get
    def test_get_teams_authorised_passes(self):
        """
        Test that endpoint returns 200 when retrieving teams
        """
        self.test_team = return_canned_team(
            name=TEST_TEAM_NAME, org_name=self.test_org.name
        )
        self.test_team.create()
        response = self.client.get(
            self.endpoint_url, headers={"Authorization": self.admin_token}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["teams"]), 1)
        self.assertEqual(
            response_body["teams"],
            [
                {
                    "teamId": 2,
                    "organisationId": 23,
                    "description": None,
                    "joinMethod": "ANY",
                    "logo": None,
                    "managersCount": 0,
                    "members": [],
                    "membersCount": 0,
                    "name": TEST_TEAM_NAME,
                    "organisation": TEST_ORGANISATION_NAME,
                    "visibility": "PUBLIC",
                }
            ],
        )

    def test_get_teams_unauthorised_fails(self):
        response = self.client.get(
            self.endpoint_url,
        )
        self.assertEqual(response.status_code, 401)
