from unittest.mock import patch
from flask import current_app

from backend.services.messaging.smtp_service import SMTPService
from backend.services.project_service import (
    ProjectService,
    Project,
    NotFound,
    ProjectStatus,
    MappingLevel,
    UserService,
    MappingNotAllowed,
    ValidatingNotAllowed,
    ProjectInfo,
)
from backend.services.project_service import ProjectAdminService
from backend.models.dtos.project_dto import LockedTasksForUser
from backend.models.postgis.task import Task
from tests.backend.base import BaseTestCase


class TestProjectService(BaseTestCase):
    def setUp(self):
        super().setUp()
        current_app.config[
            "SEND_PROJECT_EMAIL_UPDATES"
        ] = True  # Set to true to test email sending

    @patch.object(Project, "get")
    def test_project_service_raises_error_if_project_not_found(self, mock_project):
        mock_project.return_value = None

        with self.assertRaises(NotFound):
            ProjectService.get_project_by_id(123)

    @patch.object(UserService, "get_mapping_level")
    def test_user_not_allowed_to_map_if_level_enforced(self, mock_level):
        # Arrange
        mock_level.return_value = MappingLevel.BEGINNER

        # Act / Assert
        self.assertFalse(ProjectService._is_user_intermediate_or_advanced(1))

    @patch.object(UserService, "get_mapping_level")
    def test_user_is_allowed_to_map_if_level_enforced(self, mock_level):
        # Arrange
        mock_level.return_value = MappingLevel.ADVANCED

        # Act / Assert
        self.assertTrue(ProjectService._is_user_intermediate_or_advanced(1))

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    @patch.object(UserService, "is_user_blocked")
    @patch.object(UserService, "has_user_accepted_license")
    @patch.object(Task, "get_locked_tasks_for_user")
    @patch.object(Project, "get")
    def test_user_allowed_to_map(
        self,
        mock_project,
        mock_user_tasks,
        mock_user_license,
        mock_user_blocked,
        mock_user_is_action_permitted,
    ):
        # Mock project
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value
        stub_project.license_id = 11
        mock_project.return_value = stub_project

        # Admin user related
        mock_user_is_action_permitted.return_value = True
        mock_user_tasks.return_value = LockedTasksForUser()
        mock_user_tasks.return_value.locked_tasks = []
        mock_user_license.return_value = True
        mock_user_blocked.return_value = False

        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)

        self.assertTrue(allowed)
        self.assertEqual(reason, "User allowed to map")

        # Admin not accepted license should fail
        mock_user_license.return_value = False
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE)

        # Admin with already locked tasks should fail
        mock_user_license.return_value = True
        mock_user_tasks.return_value.locked_tasks = [1]
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED)

        # Admin can access draft projects
        stub_project.status = ProjectStatus.DRAFT.value
        mock_user_tasks.return_value.locked_tasks = []
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)
        self.assertTrue(allowed)
        self.assertEqual(reason, "User allowed to map")

        # Mappers
        mock_user_is_action_permitted.return_value = False
        mock_user_blocked.return_value = False

        # cannot access unpublished project
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, MappingNotAllowed.PROJECT_NOT_PUBLISHED)

        # Mappers not accepted license should fail
        mock_user_license.return_value = False
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE)

        # Blocked user
        mock_user_blocked.return_value = True
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST)

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    @patch.object(UserService, "is_user_blocked")
    @patch.object(UserService, "has_user_accepted_license")
    @patch.object(Task, "get_locked_tasks_for_user")
    @patch.object(Project, "get")
    def test_user_permitted_to_validate(
        self,
        mock_project,
        mock_user_tasks,
        mock_user_license,
        mock_user_blocked,
        mock_user_is_action_permitted,
    ):
        # Mock project
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value
        stub_project.license_id = 1
        mock_project.return_value = stub_project

        # Admin user related
        mock_user_is_action_permitted.return_value = True
        mock_user_tasks.return_value = LockedTasksForUser()
        mock_user_tasks.return_value.locked_tasks = []
        mock_user_license.return_value = True
        mock_user_blocked.return_value = False

        allowed, reason = ProjectService.is_user_permitted_to_validate(1, 1)

        self.assertTrue(allowed)
        self.assertEqual(reason, "User allowed to validate")

        # Admin not accepted license should fail
        mock_user_license.return_value = False
        allowed, reason = ProjectService.is_user_permitted_to_validate(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE)

        # Admin with already locked tasks should fail
        mock_user_license.return_value = True
        mock_user_tasks.return_value.locked_tasks = [1]
        allowed, reason = ProjectService.is_user_permitted_to_validate(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, ValidatingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED)

        # Blocked user
        mock_user_blocked.return_value = True
        allowed, reason = ProjectService.is_user_permitted_to_validate(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST)

        # Unpublished project
        stub_project.status = ProjectStatus.DRAFT.value
        mock_user_blocked.return_value = False
        mock_user_is_action_permitted.return_value = False
        allowed, reason = ProjectService.is_user_permitted_to_validate(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, ValidatingNotAllowed.PROJECT_NOT_PUBLISHED)

        # Admin can access draft projects
        stub_project.status = ProjectStatus.DRAFT.value
        mock_user_blocked.return_value = False
        mock_user_is_action_permitted.return_value = True
        mock_user_tasks.return_value.locked_tasks = []
        allowed, reason = ProjectService.is_user_permitted_to_validate(1, 1)
        self.assertTrue(allowed)
        self.assertEqual(reason, "User allowed to validate")

        # Mappers not accepted license should fail
        mock_user_blocked.return_value = False
        mock_user_is_action_permitted.return_value = False
        mock_user_license.return_value = False
        allowed, reason = ProjectService.is_user_permitted_to_validate(1, 1)
        self.assertFalse(allowed)
        self.assertEqual(reason, ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE)

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectInfo, "get_dto_for_locale")
    @patch.object(ProjectService, "get_project_by_id")
    def test_send_email_on_project_progress_sends_email_on_fifty_percent_progress(
        self, mock_project, mock_project_info, mock_project_completion, mock_send_email
    ):
        # Arrange
        mock_project.return_value = Project()
        mock_project_info.name.return_value = "TEST_PROJECT"
        mock_project_completion.return_value = 50
        # Act
        ProjectService.send_email_on_project_progress(1)
        # Assert
        mock_send_email.assert_called()

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectInfo, "get_dto_for_locale")
    @patch.object(ProjectService, "get_project_by_id")
    def test_send_email_on_project_progress_sends_email_on_project_completion(
        self, mock_project, mock_project_info, mock_project_completion, mock_send_email
    ):
        # Arrange
        mock_project.return_value = Project()
        mock_project_info.name.return_value = "TEST_PROJECT"
        mock_project_completion.return_value = 100
        # Act
        ProjectService.send_email_on_project_progress(1)
        # Assert
        mock_send_email.assert_called()

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectInfo, "get_dto_for_locale")
    @patch.object(ProjectService, "get_project_by_id")
    def test_send_email_on_project_progress_doesnt_send_email_except_on_fifty_and_hundred_percent(
        self, mock_project, mock_project_info, mock_project_completion, mock_send_email
    ):
        # Arrange
        mock_project.return_value = Project()
        mock_project_info.name.return_value = "TEST_PROJECT"
        mock_project_completion.return_value = 80
        # Act
        ProjectService.send_email_on_project_progress(1)
        # Assert
        self.assertFalse(mock_send_email.called)

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectService, "get_project_by_id")
    def test_send_email_on_project_progress_doesnt_send_email_if_email_already_sent(
        self, mock_project, mock_project_completion, mock_send_email
    ):
        # Arrange
        canned_project = Project()
        canned_project.progress_email_sent = True
        mock_project.return_value = canned_project
        mock_project.progress_email_sent.return_value = True
        mock_project_completion.return_value = 50
        # Act
        ProjectService.send_email_on_project_progress(1)
        # Assert
        self.assertFalse(mock_send_email.called)

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(ProjectService, "get_project_by_id")
    def test_send_email_on_project_progress_doesnt_send_email_if_send_project_update_email_is_disabled(
        self, mock_project, mock_send_email
    ):
        # Arrange
        mock_project.return_value = Project()
        current_app.config["SEND_PROJECT_EMAIL_UPDATES"] = False
        # Act
        ProjectService.send_email_on_project_progress(1)
        # Assert
        current_app.config[
            "SEND_PROJECT_EMAIL_UPDATES"
        ] = True  # Set to true for other tests
        self.assertFalse(mock_send_email.called)
