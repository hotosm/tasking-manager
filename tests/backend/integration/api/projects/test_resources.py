from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_organisation,
    create_canned_project,
    generate_encoded_token,
    return_canned_user,
)
from backend.models.postgis.utils import NotFound
from backend.models.postgis.statuses import UserRole
from backend.services.project_service import ProjectService, ProjectAdminService


class TestProjectsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/"
        self.test_user = return_canned_user(username="Test User", id=11111)
        self.test_user.create()
        test_organistion = create_canned_organisation()
        self.test_project.organisation = test_organistion
        self.test_project.save()
        self.author_session_token = generate_encoded_token(self.test_author.id)
        self.user_session_token = generate_encoded_token(self.test_user.id)

    def test_delete_project_returns_401_without_token(self):
        "Test returns 401 on request without session token."
        # Act
        response = self.client.delete(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_delete_project_returns_403_on_if_request_by_unauthorized_user(self):
        "Test Requesting user must have at least PM role on project"
        # Arrange
        # Reset all tasks to READY so that project can be deleted
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_user.id)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "UserPermissionError")

    def test_project_with_mapped_tasks_cannot_be_deleted(self):
        "Test project with mapped tasks cannot be deleted"
        # Arrange
        # Only admin and org manager can delete project
        add_manager_to_organisation(self.test_project.organisation, self.test_author)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.author_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "HasMappedTasks")

    def test_org_manager_can_delete_project(self):
        "Test user with PM role can delete project"

        # Arrange
        # Only admin and org manager can delete project
        add_manager_to_organisation(self.test_project.organisation, self.test_author)
        # Reset all tasks to READY so that project can be deleted
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_user.id)

        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.author_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        with self.assertRaises(NotFound):
            ProjectService.get_project_by_id(self.test_project.id)

    def test_admin_can_delete_project(self):
        "Test project can be deleted by admins."

        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Reset all tasks to READY so that project can be deleted
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_user.id)

        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        with self.assertRaises(NotFound):
            ProjectService.get_project_by_id(self.test_project.id)
