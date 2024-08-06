from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project
from backend.models.postgis.task import Task, TaskStatus, TaskAction


class TestProjectsLastActivitiesAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/activities/latest/"

    def test_returns_404_if_project_does_not_exist(self):
        """
        Test that the API returns a 404 if the project does not exist
        """
        # Act
        response = self.client.get("/api/v2/projects/999/activities/latest/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_project_exists(self):
        """
        Test that the API returns a 200 if the project exists
        """
        # Arrange
        task_2 = Task.get(2, self.test_project.id)
        # Lock the task for mapping
        task_2.lock_task_for_mapping(self.test_author.id)
        # Unlock the task
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.MAPPED)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["activity"]), self.test_project.total_tasks)
        self.assertEqual(response.json["activity"][1]["taskId"], 2)
        self.assertEqual(response.json["activity"][1]["taskStatus"], "MAPPED")
        self.assertEqual(
            response.json["activity"][1]["actionBy"], self.test_author.username
        )


class TestProjectsActivitiesAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/activities/"

    def test_returns_404_if_project_does_not_exist(self):
        """
        Test that the API returns a 404 if the project does not exist
        """
        # Act
        response = self.client.get("/api/v2/projects/999/activities/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_project_exists(self):
        """
        Test that the API returns a 200 if the project exists
        """
        # Arrange
        task_2 = Task.get(2, self.test_project.id)
        # Lock the task for mapping
        task_2.lock_task_for_mapping(self.test_author.id)
        # Unlock the task
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.MAPPED)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json.keys()), ["pagination", "activity"])
        self.assertEqual(
            set(response.json["activity"][0].keys()),
            set(
                [
                    "historyId",
                    "taskId",
                    "action",
                    "actionText",
                    "actionBy",
                    "actionDate",
                    "actionBy",
                    "pictureUrl",
                    "issues",
                ]
            ),
        )
        # Since we performed two actions above on task 2 i.e. Locked for mapping  and Mapped
        self.assertEqual(len(response.json["activity"]), 2)
        self.assertEqual(response.json["activity"][0]["taskId"], 2)
        self.assertEqual(
            response.json["activity"][0]["action"], TaskAction.STATE_CHANGE.name
        )
        self.assertEqual(
            response.json["activity"][0]["actionText"], TaskStatus.MAPPED.name
        )
        self.assertEqual(
            response.json["activity"][0]["actionBy"], self.test_author.username
        )
        self.assertEqual(response.json["activity"][1]["taskId"], 2)
        self.assertEqual(
            response.json["activity"][1]["action"], TaskAction.LOCKED_FOR_MAPPING.name
        )
        self.assertEqual(
            response.json["activity"][1]["actionBy"], self.test_author.username
        )
