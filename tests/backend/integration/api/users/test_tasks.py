from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    generate_encoded_token,
)
from backend.models.postgis.task import Task, TaskStatus
from backend.models.postgis.statuses import ProjectStatus


class TetUsersTasksAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.user_session_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/users/{self.test_author.id}/tasks/"

    def test_returns_401_if_no_token(self):
        """Test that the API returns a 401 if no token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def change_task_status(self, task_id, status, project_id):
        """Helper function to change the status of a task"""
        task = Task.get(task_id, project_id)
        if status == TaskStatus.MAPPED:
            task.lock_task_for_mapping(self.test_author.id)
        elif status == TaskStatus.VALIDATED:
            task.lock_task_for_validating(self.test_author.id)
        task.unlock_task(self.test_author.id, status)

    def test_returns_200_on_success(self):
        """Test that the API returns a 200 on success"""
        # Arrange
        self.change_task_status(1, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(2, TaskStatus.VALIDATED, self.test_project.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"project_id": self.test_project.id},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 2)
        self.assertEqual(response.json["tasks"][0]["taskId"], 2)

    def test_returns_paginated_results(self):
        """Test that the API returns paginated results"""
        # Arrange
        self.change_task_status(1, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(2, TaskStatus.VALIDATED, self.test_project.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"project_id": self.test_project.id, "page_size": 1},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 1)
        self.assertEqual(response.json["pagination"]["total"], 2)
        self.assertEqual(response.json["pagination"]["page"], 1)
        self.assertEqual(response.json["pagination"]["perPage"], 1)
        self.assertEqual(response.json["pagination"]["hasNext"], True)

    def test_filters_by_project_if_project_id_passed(self):
        """Test that the API filters by project if project_id is passed"""
        # Arrange
        test_project_2, _ = create_canned_project()
        self.change_task_status(1, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(2, TaskStatus.VALIDATED, self.test_project.id)
        self.change_task_status(1, TaskStatus.MAPPED, test_project_2.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"project_id": test_project_2.id},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 1)
        self.assertEqual(response.json["tasks"][0]["taskId"], 1)
        self.assertEqual(response.json["tasks"][0]["projectId"], test_project_2.id)
        self.assertEqual(
            response.json["tasks"][0]["taskStatus"], TaskStatus.MAPPED.name
        )

    def test_filters_by_status_if_status_passed(self):
        """Test that the API filters by status if status is passed"""
        # Arrange
        self.change_task_status(1, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(2, TaskStatus.VALIDATED, self.test_project.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "project_id": self.test_project.id,
                "status": TaskStatus.MAPPED.name,
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 1)
        self.assertEqual(response.json["tasks"][0]["taskId"], 1)
        self.assertEqual(response.json["tasks"][0]["projectId"], self.test_project.id)
        self.assertEqual(
            response.json["tasks"][0]["taskStatus"], TaskStatus.MAPPED.name
        )

    def test_filters_by_project_status_if_project_status_passed(self):
        """Test that the API filters by project status if passed"""
        # Arrange
        test_project_2, _ = create_canned_project()
        test_project_2.status = ProjectStatus.PUBLISHED.value
        test_project_2.save()
        self.change_task_status(1, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(1, TaskStatus.MAPPED, test_project_2.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"project_status": ProjectStatus.PUBLISHED.name},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 1)
        self.assertEqual(response.json["tasks"][0]["taskId"], 1)
        self.assertEqual(response.json["tasks"][0]["projectId"], test_project_2.id)

    def test_sorts_results_by_project_id_in_defined_order(self):
        """Test that the API sorts results by project id in defined order"""
        # Arrange
        test_project_2, _ = create_canned_project()
        self.change_task_status(1, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(2, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(1, TaskStatus.MAPPED, test_project_2.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"sort_by": "project_id"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 3)
        self.assertEqual(response.json["tasks"][0]["projectId"], self.test_project.id)
        self.assertEqual(response.json["tasks"][1]["projectId"], self.test_project.id)
        self.assertEqual(response.json["tasks"][2]["projectId"], test_project_2.id)

        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"sort_by": "-project_id"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 3)
        self.assertEqual(response.json["tasks"][0]["projectId"], test_project_2.id)
        self.assertEqual(response.json["tasks"][1]["projectId"], self.test_project.id)
        self.assertEqual(response.json["tasks"][2]["projectId"], self.test_project.id)

    def test_sorts_results_by_action_date_in_defined_order(self):
        """Test that the API sorts results by action date in defined order"""
        # Arrange
        self.change_task_status(1, TaskStatus.MAPPED, self.test_project.id)
        self.change_task_status(2, TaskStatus.MAPPED, self.test_project.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"sort_by": "action_date"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 2)
        self.assertEqual(response.json["tasks"][0]["taskId"], 1)
        self.assertEqual(response.json["tasks"][1]["taskId"], 2)

        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"sort_by": "-action_date"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 2)
        self.assertEqual(response.json["tasks"][0]["taskId"], 2)
        self.assertEqual(response.json["tasks"][1]["taskId"], 1)
