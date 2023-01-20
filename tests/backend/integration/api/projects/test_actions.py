import json
import geojson
from unittest.mock import patch

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    get_canned_json,
    create_canned_project,
    return_canned_user,
    create_canned_organisation,
    add_manager_to_organisation,
    create_canned_team,
    assign_team_to_project,
    add_user_to_team,
)
from backend.models.postgis.task import Task
from backend.models.postgis.statuses import (
    UserRole,
    TaskStatus,
    TeamMemberFunctions,
    TeamRoles,
)


class TestProjectActionsIntersectingTilesAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.url = "/api/v2/projects/actions/intersecting-tiles/"
        self.test_user = create_canned_user()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)

    def test_returns_401_if_not_authenticated(self):
        """ Test that the endpoint returns 401 if the user is not authenticated """
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_400_if_invalid_data(self):
        """ Test that the endpoint returns 400 if the data is invalid """
        # Act
        response = self.client.post(
            self.url,
            json={"grid": "invalid"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)

    def test_returns_clipped_grid_if_clip_to_aoi_set_true(self):
        """ Test that the endpoint returns a clipped grid if clipToAoi is set to true """
        # Arrange
        payload = get_canned_json("test_grid.json")
        payload["clipToAoi"] = True
        expected_response = geojson.loads(
            json.dumps(get_canned_json("clipped_feature_collection.json"))
        )
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(response.json, expected_response)

    def test_returns_not_clipped_grid_if_clip_to_aoi_set_false(self):
        """ Test that the endpoint returns a not clipped grid if clipToAoi is set to false """
        # Arrange
        payload = get_canned_json("test_grid.json")
        payload["clipToAoi"] = False
        expected_response = geojson.loads(
            json.dumps(get_canned_json("feature_collection.json"))
        )
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(response.json, expected_response)

    def test_raises_invalid_geojson_exception_if_invalid_aoi(self):
        """ Test that the endpoint raises an InvalidGeoJson exception if the grid is invalid """
        # Arrange
        payload = get_canned_json("test_grid.json")
        payload["areaOfInterest"]["features"] = []
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "MustHaveFeatures")

    def test_raises_invalid_geojson_exception_if_self_intersecting_aoi(self):
        """ Test that the endpoint raises an InvalidGeoJson exception if the aoi is self intersecting """
        # Arrange
        payload = get_canned_json("self_intersecting_aoi.json")
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "SelfIntersectingAOI")


class TestProjectsActionsMessageContributorsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = (
            f"/api/v2/projects/{self.test_project.id}/actions/message-contributors/"
        )
        self.test_user = return_canned_user("Test User", 1111111)
        self.test_user.create()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)
        self.test_author_access_token = generate_encoded_token(self.test_author.id)

    def test_returns_401_if_not_authenticated(self):
        """ Test that the endpoint returns 401 if the user is not authenticated """
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_project_not_found(self):
        """ Test that the endpoint returns 404 if the project is not found """
        # Act
        response = self.client.post(
            "/api/v2/projects/999/actions/message-contributors/",
            json={"message": "test message", "subject": "test subject"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_403_if_user_dont_have_PM_permissions(self):
        """ Test that the endpoint returns 403 if the user is not the project author """
        # Act
        response = self.client.post(
            self.url,
            json={"subject": "test subject", "message": "test message"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_400_if_invalid_data(self):
        """ Test that the endpoint returns 400 if the data is invalid """
        # Act
        response = self.client.post(
            self.url,
            json={"subject": "test subject"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_project_author(
        self, mock_thread
    ):
        """ Test that the endpoint sends a message to the project contributors """
        # Arrange
        # Add a contributor to the project
        task = Task.get(2, self.test_project.id)
        task.lock_task_for_mapping(self.test_user.id)
        task.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        # Mock the thread start method to avoid application context issues
        mock_thread.return_value = None
        # Act
        response = self.client.post(
            self.url,
            json={"subject": "test subject", "message": "test message"},
            headers={"Authorization": self.test_author_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_organisation_manager(
        self, mock_thread
    ):
        """ Test that the endpoint sends a message to the project contributors """
        # Arrange
        test_organisation = create_canned_organisation()
        self.test_project.organisation = test_organisation
        add_manager_to_organisation(test_organisation, self.test_user)
        # Add a contributor to the project
        task = Task.get(2, self.test_project.id)
        task.lock_task_for_mapping(self.test_user.id)
        task.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        # Mock the thread start method to avoid application context issues
        mock_thread.return_value = None
        # Act
        response = self.client.post(
            self.url,
            json={"subject": "test subject", "message": "test message"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_admin(self, mock_thread):
        """ Test that the endpoint sends a message to the project contributors """
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        # Add a contributor to the project
        task = Task.get(2, self.test_project.id)
        task.lock_task_for_mapping(self.test_user.id)
        task.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        # Mock the thread start method to avoid application context issues
        mock_thread.return_value = None
        # Act
        response = self.client.post(
            self.url,
            json={"subject": "test subject", "message": "test message"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_project_team_members_with_PM_permission(
        self, mock_thread
    ):
        """ Test that the endpoint sends a message to the project contributors """
        # Arrange
        test_organisation = create_canned_organisation()
        self.test_project.organisation = test_organisation
        test_team = create_canned_team()
        add_user_to_team(
            test_team, self.test_user, TeamMemberFunctions.MEMBER.value, True
        )
        assign_team_to_project(
            self.test_project, test_team, TeamRoles.PROJECT_MANAGER.value
        )
        # Add a contributor to the project
        task = Task.get(2, self.test_project.id)
        task.lock_task_for_mapping(self.test_user.id)
        task.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        # Mock the thread start method to avoid application context issues
        mock_thread.return_value = None
        # Act
        response = self.client.post(
            self.url,
            json={"subject": "test subject", "message": "test message"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)
