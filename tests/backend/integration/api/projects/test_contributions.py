from datetime import datetime

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project, return_canned_user
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
        # Lock the task for validation
        task_2.lock_task_for_validating(self.test_author.id)
        # Unlock the task
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.VALIDATED)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        # Since Tasks 1,4 are mapped, 3 is set as bad imagery and Task 4 validated by the test user during test project
        # creation. We expect test user to have 4 contributions
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
                    "badImagery",
                    "total",
                    "mappedTasks",
                    "validatedTasks",
                    "badImageryTasks",
                    "name",
                    "dateRegistered",
                ]
            ),
        )
        self.assertEqual(test_user_contribution["username"], self.test_author.username)
        self.assertEqual(test_user_contribution["mapped"], 3)
        self.assertEqual(test_user_contribution["validated"], 2)
        self.assertEqual(test_user_contribution["badImagery"], 1)
        self.assertEqual(test_user_contribution["mappedTasks"], [4, 2, 1])
        self.assertEqual(test_user_contribution["badImageryTasks"], [3])
        self.assertEqual(test_user_contribution["validatedTasks"], [4, 1])

    def test_return_empty_list_if_no_contributions(self):
        task1 = Task.get(1, self.test_project.id)
        task1.task_status = TaskStatus.READY.value

        task2 = Task.get(2, self.test_project.id)
        task2.task_status = TaskStatus.READY.value

        task3 = Task.get(3, self.test_project.id)
        task3.task_status = TaskStatus.READY.value

        task4 = Task.get(3, self.test_project.id)
        task4.task_status = TaskStatus.READY.value

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["userContributions"]), 0)
        self.assertEqual(response.json["userContributions"], [])

    def test_returns_list_of_all_contributors(self):
        # Setup
        # new test user
        test_user = return_canned_user("test_user", 11111111)
        test_user.create()
        # contributions
        # Invalidate task 1 by test author
        task_1 = Task.get(1, self.test_project.id)
        task_1.lock_task_for_validating(self.test_author.id)
        task_1.unlock_task(self.test_author.id, new_state=TaskStatus.INVALIDATED)
        # Lock task 2 for mapping by test user
        task_2 = Task.get(2, self.test_project.id)
        task_2.lock_task_for_mapping(test_user.id)
        task_2.unlock_task(test_user.id, new_state=TaskStatus.BADIMAGERY)
        # Act
        response = self.client.get(self.url)
        user_contributions_response = response.json["userContributions"]
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(user_contributions_response), 2)
        # 1st contributor
        # Tasks 3,4 are mapped and task 4 validated by test_author during project creation
        self.assertEqual(
            user_contributions_response[0]["username"], self.test_author.username
        )
        self.assertEqual(user_contributions_response[0]["mapped"], 1)
        self.assertEqual(user_contributions_response[0]["validated"], 1)
        self.assertEqual(user_contributions_response[0]["badImagery"], 1)
        self.assertEqual(user_contributions_response[0]["mappedTasks"], [4])
        self.assertEqual(user_contributions_response[0]["validatedTasks"], [4])
        self.assertEqual(user_contributions_response[0]["badImageryTasks"], [3])
        # 2nd contributor
        self.assertEqual(user_contributions_response[1]["username"], test_user.username)
        self.assertEqual(user_contributions_response[1]["mapped"], 0)
        self.assertEqual(user_contributions_response[1]["badImagery"], 1)
        self.assertEqual(user_contributions_response[1]["validated"], 0)
        self.assertEqual(user_contributions_response[1]["mappedTasks"], [])
        self.assertEqual(user_contributions_response[1]["validatedTasks"], [])
        self.assertEqual(user_contributions_response[1]["badImageryTasks"], [2])


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
