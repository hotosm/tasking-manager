import time

from backend.models.postgis.task import Task, TaskStatus
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    generate_encoded_token,
)


class TestUsersStatisticsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_user = create_canned_project()
        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.url = f"/api/v2/users/{self.test_user.username}/statistics/"

    def test_returns_401_if_no_token(self):
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_return_404_if_user_not_found(self):
        # Act
        response = self.client.get(
            "/api/v2/users/doesntexist/statistics/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["SubCode"], "NotFound")

    def test_return_200_if_user_found(self):
        # Arrange
        task = Task.get(1, self.test_project.id)
        task.lock_task_for_mapping(self.test_user.id)
        time.sleep(5)
        task.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        print(response.json)
        self.assertEqual(response.json["totalTimeSpent"], 5)
        self.assertEqual(response.json["timeSpentMapping"], 5)
        self.assertEqual(response.json["timeSpentValidating"], 0)
        self.assertEqual(response.json["projectsMapped"], 0)
        self.assertEqual(response.json["countriesContributed"]["total"], 0)
        self.assertEqual(response.json["tasksMapped"], 1)
        self.assertEqual(response.json["tasksValidated"], 0)
        self.assertEqual(response.json["tasksInvalidated"], 0)
        self.assertEqual(response.json["tasksInvalidatedByOthers"], 0)
        self.assertEqual(response.json["tasksValidatedByOthers"], 0)
        self.assertEqual(response.json["ContributionsByInterest"], [])
