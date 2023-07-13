from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    assign_team_to_project,
    create_canned_project,
    create_canned_team,
    return_canned_user,
    generate_encoded_token,
    TEST_TEAM_NAME,
)
from backend.models.postgis.statuses import UserRole, TeamRoles


class TestProjectsTeamsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author.role = UserRole.ADMIN.value
        self.test_team = create_canned_team()
        self.test_user = return_canned_user("test_user", 11111111)
        self.test_user.create()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)
        self.all_project_teams_url = f"/api/v2/projects/{self.test_project.id}/teams/"
        self.single_project_team_url = (
            f"/api/v2/projects/{self.test_project.id}/teams/{self.test_team.id}/"
        )
        self.non_existent_project_team_url = "/api/v2/projects/99/teams/99/"

    # get
    def test_get_project_teams_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when an unauthenticated user retrieves teams
        """
        response = self.client.get(self.all_project_teams_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_get_project_teams_for_non_existent_project_fails(self):
        """
        Test that endpoint returns 404 when retrieving teams for non-existent projects
        """
        response = self.client.get(
            "/api/v2/projects/99/teams/",
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["Error"], "Project Not Found")
        self.assertEqual(response_body["SubCode"], "NotFound")

    def test_get_project_teams_passes(self):
        """
        Test that endpoint returns 200 when an authenticated user retrieves teams
        """
        response = self.client.get(
            self.all_project_teams_url,
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["teams"]), 0)
        self.assertEqual(response_body["teams"], [])
        # setup: add team to project
        assign_team_to_project(project=self.test_project, team=self.test_team, role=0)
        response = self.client.get(
            self.all_project_teams_url,
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["teams"]), 1)
        self.assertEqual(response_body["teams"][0]["name"], TEST_TEAM_NAME)
        self.assertEqual(response_body["teams"][0]["role"], 0)

    # post
    def test_assign_team_to_project_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when unauthenticated user assigns team to project
        """
        response = self.client.post(
            self.single_project_team_url, json={"role": TeamRoles.MAPPER.name}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_assign_team_to_project_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when non admin assigns team to a project
        """
        response = self.client.post(
            self.single_project_team_url,
            json={"role": TeamRoles.MAPPER.name},
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "User is not an admin or a manager for the team"
        )
        self.assertEqual(response_body["SubCode"], "UserPermissionError")

    def test_assign_team_to_non_existent_project_fails(self):
        """
        Test that endpoint returns 404 when admin assigns a team to a non-existent project
        """
        response = self.client.post(
            f"/api/v2/projects/99/teams/{self.test_team.id}/",
            json={"role": TeamRoles.MAPPER.name},
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["Error"], "No Project Found")
        self.assertEqual(response_body["SubCode"], "NotFound")

    def test_assign_team_to_project_by_admin_passes(self):
        """
        Test that endpoint returns 201 when admin successfully assigns a team to a project
        """
        response = self.client.post(
            self.single_project_team_url,
            json={"role": TeamRoles.MAPPER.name},
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response_body["Success"],
            f"Team {self.test_team.id} assigned to project {self.test_project.id} with role MAPPER",
        )

    # patch
    def test_update_team_role_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when unauthenticated user updates project team role
        """
        response = self.client.patch(
            self.single_project_team_url, json={"role": TeamRoles.MAPPER.name}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_update_team_role_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when non admin updates project team role
        """
        response = self.client.patch(
            self.single_project_team_url,
            json={"role": TeamRoles.MAPPER.name},
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], "User is not a manager of the project")
        self.assertEqual(response_body["SubCode"], "UserPermissionError")

    def test_update_team_role_of_non_existent_project_fails(self):
        """
        Test that endpoint returns 404 when admin updates non-existent project team role
        """
        response = self.client.patch(
            self.non_existent_project_team_url,
            json={"role": TeamRoles.MAPPER.name},
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["SubCode"], "NotFound")

    def test_update_team_role_by_admin_passes(self):
        """
        Test that endpoint returns 200 when admin successfully updates project team role
        """
        assign_team_to_project(
            self.test_project, self.test_team, TeamRoles.MAPPER.value
        )
        response = self.client.patch(
            self.single_project_team_url,
            json={"role": TeamRoles.VALIDATOR.name},
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Status"], "Team role updated successfully")

    # delete
    def test_delete_project_team_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when unauthenticated user deletes project team
        """
        response = self.client.delete(self.single_project_team_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_delete_project_team_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when non admin deletes project team
        """
        response = self.client.delete(
            self.single_project_team_url,
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], "User is not a manager of the project")
        self.assertEqual(response_body["SubCode"], "UserPermissionError")

    def test_delete_non_existent_project_team_fails(self):
        """
        Test that endpoint returns 404 when admin deletes non-existent project team
        """
        response = self.client.delete(
            self.non_existent_project_team_url,
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["Error"], "No team found")
        self.assertEqual(response_body["SubCode"], "NotFound")

    def test_delete_project_team_by_admin_passes(self):
        """
        Test that endpoint returns 200 when admin successfully deletes project team
        """
        assign_team_to_project(
            self.test_project, self.test_team, TeamRoles.MAPPER.value
        )
        response = self.client.delete(
            self.single_project_team_url,
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], True)
