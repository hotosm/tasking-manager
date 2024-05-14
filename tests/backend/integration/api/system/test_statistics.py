from backend.models.postgis.task import Task

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import return_canned_user, create_canned_project


class TestSystemStatisticsAPI(BaseTestCase):
    def setUp(self):
        return super().setUp()

    def test_returns_home_page_stats(self):
        """Test that the API returns the home page stats"""

        # Arrange
        test_user = return_canned_user("Test User", 2222222)
        test_user.create()
        test_project, _ = create_canned_project()
        # Lock a task for mapping as mappers online is calculated based on locked tasks
        task = Task.get(
            2, test_project.id
        )  # Set task 2 to mapped since it's created unmapped
        task.lock_task_for_mapping(test_user.id)
        url = "/api/v2/system/statistics/"
        # Act
        response = self.client.get(url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["mappersOnline"], 1)
        self.assertEqual(response.json["tasksMapped"], 2)
        self.assertEqual(response.json["totalMappers"], 2)
        self.assertEqual(response.json["totalProjects"], 1)
