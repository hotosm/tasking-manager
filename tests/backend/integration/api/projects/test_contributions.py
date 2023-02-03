from datetime import datetime

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project
from backend.models.postgis.task import Task, TaskStatus


class TestProjectsContributionsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/contributions/"

    def test_returns_404_if_project_does_not_exist(self):
        # Act
        response = self.client.get("/api/v2/projects/999999/contributions/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_project_exists(self):
        # Arrange
        task = Task.get(2, self.test_project.id)
        # Lock the task for mapping
        task.lock_task_for_mapping(self.test_author.id)
        # Unlock the task
        task.unlock_task(self.test_author.id, new_state=TaskStatus.MAPPED)
        task_2 = Task.get(1, self.test_project.id)
        # Lock the task for mapping
        task_2.lock_task_for_validating(self.test_author.id)
        # Unlock the task
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.VALIDATED)
        # Actt
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        # Since Task 1 and are mapped and Task 4 is mapped and validated by the test user during test project creation
        # We expect test user to have 4 contributions
        test_user_contribution = response.json["userContributions"][0]
        self.assertEqual(
            set(test_user_contribution.keys()),
            set(
                [
                    "username",
                    "mappingLevel",
                    "pictureUrl",
                    "mapped",
                    "validated",
                    "total",
                    "mappedTasks",
                    "validatedTasks",
                    "name",
                    "dateRegistered",
                    "invalidated",
                    "split",
                    "marked_bad_imagery",
                ]
            ),
        )
        self.assertEqual(test_user_contribution["username"], self.test_author.username)
        self.assertEqual(test_user_contribution["mapped"], 1)
        self.assertEqual(test_user_contribution["validated"], 1)
        self.assertEqual(test_user_contribution["mappedTasks"], [2])
        self.assertEqual(test_user_contribution["validatedTasks"], [1])


class TestProjectsContributionsQueriesDayAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/contributions/queries/day/"

    def test_returns_404_if_project_does_not_exist(self):
        # Act
        response = self.client.get("/api/v2/projects/999999/contributions/queries/day/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_project_exists(self):
        # Arrange
        # Since contribs_by_day calculates the contributions using
        # TaskHistory all of the actions need to be registered in TaskHistory.
        # Arrange
        task_2 = Task.get(2, self.test_project.id)
        # Lock the task for mapping
        task_2.lock_task_for_mapping(self.test_author.id)
        # Unlock the task
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.MAPPED)
        task_2.lock_task_for_validating(self.test_author.id)
        # Unlock the task
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.VALIDATED)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        # Since we only have history of today, we expect only one element in the stats array
        self.assertEqual(len(response.json["stats"]), 1)
        self.assertEqual(
            set(response.json["stats"][0].keys()),
            set(
                [
                    "date",
                    "mapped",
                    "validated",
                    "cumulative_mapped",
                    "cumulative_validated",
                    "total_tasks",
                ]
            ),
        )
        self.assertEqual(
            response.json["stats"][0]["date"], datetime.today().strftime("%Y-%m-%d")
        )
        self.assertEqual(response.json["stats"][0]["mapped"], 1)
        self.assertEqual(response.json["stats"][0]["validated"], 1)
        self.assertEqual(response.json["stats"][0]["cumulative_mapped"], 1)
        self.assertEqual(response.json["stats"][0]["cumulative_validated"], 1)
        self.assertEqual(response.json["stats"][0]["total_tasks"], 4)
