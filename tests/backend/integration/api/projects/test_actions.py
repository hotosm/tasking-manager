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
        """Test that the endpoint returns 401 if the user is not authenticated"""
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_400_if_invalid_data(self):
        """Test that the endpoint returns 400 if the data is invalid"""
        # Act
        response = self.client.post(
            self.url,
            json={"grid": "invalid"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)

    def test_returns_clipped_grid_if_clip_to_aoi_set_true(self):
        """Test that the endpoint returns a clipped grid if clipToAoi is set to true"""
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
        self.assertDeepAlmostEqual(expected_response, geojson.loads(response.text))

    def test_returns_not_clipped_grid_if_clip_to_aoi_set_false(self):
        """Test that the endpoint returns a not clipped grid if clipToAoi is set to false"""
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
        self.assertDeepAlmostEqual(expected_response, geojson.loads(response.text))

    def test_raises_invalid_geojson_exception_if_invalid_aoi(self):
        """Test that the endpoint raises an InvalidGeoJson exception if the grid is invalid"""
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
        """Test that the endpoint raises an InvalidGeoJson exception if the aoi is self intersecting"""
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
        self.test_message = "Test message"
        self.test_subject = "Test subject"
        self.test_user = return_canned_user("Test User", 1111111)
        self.test_user.create()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)
        self.test_author_access_token = generate_encoded_token(self.test_author.id)

    def test_returns_401_if_not_authenticated(self):
        """Test that the endpoint returns 401 if the user is not authenticated"""
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_project_not_found(self):
        """Test that the endpoint returns 404 if the project is not found"""
        # Act
        response = self.client.post(
            "/api/v2/projects/999/actions/message-contributors/",
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_403_if_user_dont_have_PM_permissions(self):
        """Test that the endpoint returns 403 if the user is not the project author"""
        # Act
        response = self.client.post(
            self.url,
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_400_if_invalid_data(self):
        """Test that the endpoint returns 400 if the data is invalid"""
        # Act
        response = self.client.post(
            self.url,
            json={"subject": self.test_subject},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_project_author(
        self, mock_thread
    ):
        """Test that the endpoint sends a message to the project contributors"""
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
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": self.test_author_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_organisation_manager(
        self, mock_thread
    ):
        """Test that the endpoint sends a message to the project contributors"""
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
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_admin(self, mock_thread):
        """Test that the endpoint sends a message to the project contributors"""
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
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)

    @patch("threading.Thread.start")
    def test_sends_message_to_contributors_is_allowed_to_project_team_members_with_PM_permission(
        self, mock_thread
    ):
        """Test that the endpoint sends a message to the project contributors"""
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
            json={"message": self.test_message, "subject": self.test_subject},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_thread.call_count, 1)


class TestProjectsActionsTransferAPI(BaseTestCase):
    """Tests for the transfer project endpoint"""

    def setUp(self):
        super().setUp()
        self.test_user = return_canned_user("test_user_1", 111111)
        self.test_user.create()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)
        self.test_project, self.test_author = create_canned_project()
        self.test_author_access_token = generate_encoded_token(self.test_author.id)
        self.url = (
            f"/api/v2/projects/{self.test_project.id}/actions/transfer-ownership/"
        )
        self.test_organisation = create_canned_organisation()
        self.test_project.organisation = self.test_organisation
        self.test_project.save()

    def test_returns_401_if_unauthorized(self):
        """Test that the endpoint returns 401 if the user is not logged in"""
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_project_does_not_exist(self):
        """Test that the endpoint returns 404 if the project does not exist"""
        # Act
        response = self.client.post(
            "/api/v2/projects/1111111/actions/transfer-ownership/",
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user"},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_403_if_user_is_not_project_admin_org_manager_project_author(self):
        """Test that the endpoint returns 403 if the user is not the project owner"""
        # Arrange
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user_1"},
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_403_if_new_owner_is_not_admin_or_manager_of_org_project_is_in_(
        self,
    ):
        """Test returns 403 if the new owner is not admin or a manager of the organisation the project is in"""
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user_1"},
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_404_if_new_owner_does_not_exist(self):
        """Test that the endpoint returns 404 if the new owner does not exist"""
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user_2"},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    # Patch the thread start method to avoid application context issues
    @patch("threading.Thread.start")
    def test_returns_200_if_new_owner_is_admin_or_manager_of_org_project_is_in(
        self, mock_thread
    ):
        """Test that the endpoint returns 200 if the new owner is an admin of the organisation the project is in"""
        # Test new owner is admin
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        test_user_2 = return_canned_user("test_user_2", 222222)
        test_user_2.role = UserRole.ADMIN.value
        test_user_2.create()
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user_2"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.test_project.author_id, test_user_2.id)

        # Test new owner is manager of org project is in
        # Arrange
        test_user_2.role = UserRole.MAPPER.value
        test_user_2.save()
        add_manager_to_organisation(self.test_organisation, test_user_2)
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user_2"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.test_project.author_id, test_user_2.id)

    @patch("threading.Thread.start")
    def test_returns_200_if_requesting_user_is_project_author(self, mock_thread):
        """Test that the endpoint returns 200 if the requesting user is the project author"""
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_author_access_token},
            json={"username": "test_user_1"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.test_project.author_id, self.test_user.id)

    @patch("threading.Thread.start")
    def test_returns_200_if_requesting_user_is_org_manager(self, mock_thread):
        """Test that the endpoint returns 200 if the requesting user is an org manager"""
        # Test org manager
        # Arrange
        test_user_2 = return_canned_user("test_user_2", 222222)
        test_user_2.role = UserRole.ADMIN.value
        test_user_2.create()
        add_manager_to_organisation(self.test_organisation, self.test_user)
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user_2"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.test_project.author_id, test_user_2.id)

    @patch("threading.Thread.start")
    def test_returns_200_if_requesting_user_is_admin(self, mock_thread):
        """Test that the endpoint returns 200 if the requesting user is an admin"""
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        test_user_2 = return_canned_user("test_user_2", 222222)
        test_user_2.role = UserRole.ADMIN.value
        test_user_2.create()
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"username": "test_user_2"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.test_project.author_id, test_user_2.id)
