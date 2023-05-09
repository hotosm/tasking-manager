import time

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    generate_encoded_token,
)
from backend.services.project_admin_service import ProjectAdminService
from backend.models.postgis.task import Task, TaskStatus


class TestProjectStatisticsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/statistics/"

    def test_returns_404_if_project_not_found(self):
        """Test that 404 is returned if project not found"""
        # Act
        response = self.client.get("/api/v2/projects/9999999999/statistics/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_project_found(self):
        """Test that 200 is returned if project found"""
        # Arrange
        # Let's reset all tasks to Ready state
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_author.id)
        task = Task.get(1, self.test_project.id)
        task.lock_task_for_mapping(self.test_author.id)
        time.sleep(3)
        task.unlock_task(self.test_author.id, TaskStatus.MAPPED)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["totalTasks"], 4)
        self.assertEqual(
            response.json["totalMappingTime"], 3.0
        )  # Since we slept for 3 seconds
        self.assertEqual(
            response.json["totalTimeSpent"], 3.0
        )  # Since we slept for 3 seconds
        # Since we slept for 3 seconds and only 1 task was mapped
        self.assertEqual(response.json["averageMappingTime"], 3.0)
        self.assertEqual(response.json["timeToFinishMapping"], 12.0)
        self.assertEqual(
            response.json["timeToFinishValidating"], 0.0
        )  # No tasks were validated


class TestProjectsStatisticsQueriesUsernameAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/statistics/queries/{self.test_author.username}/"

    def test_returns_404_if_project_not_found(self):
        """Test that 404 is returned if project not found"""
        # Act
        response = self.client.get(
            f"/api/v2/projects/9999999999/statistics/queries/{self.test_author.username}/"
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_404_if_username_not_found(self):
        """Test that 404 is returned if username not found"""
        # Act
        response = self.client.get(
            f"/api/v2/projects/{self.test_project.id}/statistics/queries/username/"
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_project_found(self):
        """Test that 200 is returned if project and username found"""
        # Arrange
        task = Task.get(1, self.test_project.id)
        task.lock_task_for_mapping(self.test_author.id)
        # Let's sleep for 3 seconds which will be used to calculate time spent
        time.sleep(3)
        task.unlock_task(self.test_author.id, TaskStatus.MAPPED)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json["timeSpentMapping"], 3.0
        )  # Since we slept for 3 seconds
        self.assertEqual(
            response.json["timeSpentValidating"], 0.0
        )  # No tasks were validated
        self.assertEqual(
            response.json["totalTimeSpent"], 3.0
        )  # Since we slept for 3 seconds
