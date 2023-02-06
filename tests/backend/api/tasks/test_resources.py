from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    return_canned_user,
    create_canned_organisation,
    generate_encoded_token,
    add_manager_to_organisation,
)

from backend.models.postgis.statuses import UserRole
from backend.services.project_service import ProjectService


class TestGetTasksQueriesJsonAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/"

    def test_returns_404_if_project_does_not_exist(self):
        """ Test that a 404 is returned if the project does not exist. """
        # Act
        response = self.client.get("/api/projects/999/tasks")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_all_tasks_if_task_ids_not_specified(self):
        """ Test that all tasks are returned if no task_ids are specified. """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json.keys(), {"type", "features"})
        self.assertEqual(response.json["type"], "FeatureCollection")
        self.assertEqual(len(response.json["features"]), 4)

    def test_returns_only_specified_tasks_if_task_ids_specified(self):
        """ Test that only the specified tasks are returned if task_ids are specified. """
        # Act
        response = self.client.get(self.url + "?tasks=1,2")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["features"]), 2)
        self.assertEqual(response.json["features"][0]["properties"]["taskId"], 1)
        self.assertEqual(response.json["features"][1]["properties"]["taskId"], 2)

    def test_returns_tasks_as_file_id_as_file_set_true(self):
        """ Test that the tasks are returned with the file_id as the file if file_set is true. """
        # Act
        response = self.client.get(self.url + "?as_file=true")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(
            response.headers["Content-Disposition"],
            f"attachment; filename={self.test_project.id}-tasks.geojson",
        )
        self.assertEqual(response.json.keys(), {"type", "features"})
        self.assertEqual(response.json["type"], "FeatureCollection")
        self.assertEqual(len(response.json["features"]), 4)


class TestDeleteTasksJsonAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/"
        self.test_user = return_canned_user("test_user", 11111)
        self.test_user.create()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)
        self.test_author_access_token = generate_encoded_token(self.test_author.id)
        self.test_organization = create_canned_organisation()
        self.test_project.organization = self.test_organization
        self.test_project.save()

    def test_returns_401_if_not_authorized(self):
        """ Test that a 401 is returned if the user is not authorized. """
        # Act
        response = self.client.delete(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_403_if_user_not_admin(self):
        """ Test that a 403 is returned if the user is not a project manager. """
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_404_if_project_does_not_exist(self):
        """ Test that a 404 is returned if the project does not exist. """
        # Act
        response = self.client.delete("/api/projects/999/tasks")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_even_org_manager_cannot_delete_tasks(self):
        """ Test that an org manager cannot delete tasks. """
        # Arrange
        add_manager_to_organisation(self.test_organization, self.test_user)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_400_if_no_task_ids_specified(self):
        """ Test that a 400 is returned if no task_ids are specified. """
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={},
        )
        # Assert
        self.assertEqual(response.status_code, 400)

    def test_returns_404_if_task_not_found(self):
        """ Test that a 400 is returned if the task is not found. """
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"tasks": [999]},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_deletes_specified_tasks_if_user_admin(self):
        """ Test that the specified tasks are deleted. """
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"tasks": [1, 2]},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        project_tasks = ProjectService.get_project_tasks(self.test_project.id, None)
        self.assertEqual(len(project_tasks["features"]), 2)
        self.assertEqual(project_tasks["features"][0]["properties"]["taskId"], 3)
        self.assertEqual(project_tasks["features"][1]["properties"]["taskId"], 4)


