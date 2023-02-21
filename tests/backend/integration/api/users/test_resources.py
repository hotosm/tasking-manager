from backend.models.postgis.task import Task

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    return_canned_user,
    generate_encoded_token,
    create_canned_project,
)


TEST_USERNAME = "test_user"
TEST_USER_ID = 1111111


class TestUsersQueriesOwnLockedDetailsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = "/api/v2/users/queries/tasks/locked/details/"

    def test_returns_401_without_session_token(self):
        """ Test that the API returns 401 if no session token is provided """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_no_tasks_locked(self):
        """ Test that the API returns 404 if no task is locked by user"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["SubCode"], "NotFound")

    def test_returns_200_if_tasks_locked(self):
        """ Test that the API returns 200 if a task is locked by user """
        # Arrange
        # Lock a task
        test_project, _ = create_canned_project()
        task = Task.get(1, test_project.id)
        task.lock_task_for_mapping(self.user.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 1)
        self.assertEqual(response.json["tasks"][0]["taskId"], 1)
        self.assertEqual(response.json["tasks"][0]["projectId"], test_project.id)
