from backend.models.postgis.project_info import ProjectInfo
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from backend.models.dtos.project_dto import LockedTasksForUser
from backend.models.postgis.task import Task
from backend.services.messaging.smtp_service import SMTPService
from backend.services.project_service import (
    MappingLevel,
    MappingNotAllowed,
    Project,
    ProjectAdminService,
    ProjectService,
    ProjectStatus,
    UserService,
    ValidatingNotAllowed,
)


@pytest.mark.anyio
class TestProjectService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

    @patch.object(Project, "get")
    async def test_project_service_raises_error_if_project_not_found(
        self, mock_project
    ):
        # Arrange
        mock_project.return_value = None

        # Act / Assert
        with pytest.raises(HTTPException):
            await ProjectService.get_project_by_id(123, self.db)

    @patch.object(UserService, "get_mapping_level")
    async def test_user_not_allowed_to_map_if_level_enforced(self, mock_level):
        # Arrange
        mock_level.return_value = MappingLevel.BEGINNER

        # Act
        allowed = await ProjectService._is_user_beginner(1, self.db)

        # Assert
        assert allowed

    @patch.object(UserService, "get_mapping_level")
    async def test_user_is_allowed_to_map_if_level_enforced(self, mock_level):
        # Arrange
        mock_level.return_value = MappingLevel.ADVANCED

        # Act
        allowed = await ProjectService._is_user_beginner(1, self.db)

        # Assert
        assert not allowed

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    @patch.object(UserService, "is_user_blocked")
    @patch.object(UserService, "has_user_accepted_license")
    @patch.object(Task, "get_locked_tasks_for_user")
    @patch.object(ProjectService, "get_project_by_id")
    async def test_user_allowed_to_map(
        self,
        mock_project,
        mock_user_tasks,
        mock_user_license,
        mock_user_blocked,
        mock_user_is_action_permitted,
    ):
        # Arrange - Mock project
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value
        stub_project.license_id = 11
        mock_project.return_value = stub_project

        # Admin user related
        mock_user_is_action_permitted.return_value = True
        mock_user_tasks.return_value = LockedTasksForUser(locked_tasks=[])
        mock_user_license.return_value = True
        mock_user_blocked.return_value = False

        # Act / Assert - Admin allowed to map
        allowed, reason = await ProjectService.is_user_permitted_to_map(1, 1, self.db)
        assert allowed
        assert reason == "User allowed to map"

        # Admin not accepted license should fail
        mock_user_license.return_value = False
        allowed, reason = await ProjectService.is_user_permitted_to_map(1, 1, self.db)
        assert not allowed
        assert reason == MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        # Admin with already locked tasks should fail
        mock_user_license.return_value = True
        mock_user_tasks.return_value = LockedTasksForUser(locked_tasks=[1])
        allowed, reason = await ProjectService.is_user_permitted_to_map(1, 1, self.db)
        assert not allowed
        assert reason == MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        # Admin can access draft projects
        stub_project.status = ProjectStatus.DRAFT.value
        mock_user_tasks.return_value = LockedTasksForUser(locked_tasks=[])
        allowed, reason = await ProjectService.is_user_permitted_to_map(1, 1, self.db)
        assert allowed
        assert reason == "User allowed to map"

        # Mappers
        mock_user_is_action_permitted.return_value = False
        mock_user_blocked.return_value = False

        # Cannot access unpublished project
        allowed, reason = await ProjectService.is_user_permitted_to_map(1, 1, self.db)
        assert not allowed
        assert reason == MappingNotAllowed.PROJECT_NOT_PUBLISHED

        # Mappers not accepted license should fail
        mock_user_license.return_value = False
        allowed, reason = await ProjectService.is_user_permitted_to_map(1, 1, self.db)
        assert not allowed
        assert reason == MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        # Blocked user
        mock_user_blocked.return_value = True
        allowed, reason = await ProjectService.is_user_permitted_to_map(1, 1, self.db)
        assert not allowed
        assert reason == MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    @patch.object(UserService, "is_user_blocked")
    @patch.object(UserService, "has_user_accepted_license")
    @patch.object(Task, "get_locked_tasks_for_user")
    @patch.object(ProjectService, "get_project_by_id")
    async def test_user_permitted_to_validate(
        self,
        mock_project,
        mock_user_tasks,
        mock_user_license,
        mock_user_blocked,
        mock_user_is_action_permitted,
    ):
        # Arrange - Mock project
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value
        stub_project.license_id = 1
        mock_project.return_value = stub_project

        # Admin user related
        mock_user_is_action_permitted.return_value = True
        mock_user_tasks.return_value = LockedTasksForUser(locked_tasks=[])
        mock_user_license.return_value = True
        mock_user_blocked.return_value = False

        # Act / Assert - Admin allowed to validate
        allowed, reason = await ProjectService.is_user_permitted_to_validate(
            1, 1, self.db
        )
        assert allowed
        assert reason == "User allowed to validate"

        # Admin not accepted license should fail
        mock_user_license.return_value = False
        allowed, reason = await ProjectService.is_user_permitted_to_validate(
            1, 1, self.db
        )
        assert not allowed
        assert reason == ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        # Admin with already locked tasks should fail
        mock_user_license.return_value = True
        mock_user_tasks.return_value = LockedTasksForUser(locked_tasks=[1])
        allowed, reason = await ProjectService.is_user_permitted_to_validate(
            1, 1, self.db
        )
        assert not allowed
        assert reason == ValidatingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        # Blocked user
        mock_user_blocked.return_value = True
        allowed, reason = await ProjectService.is_user_permitted_to_validate(
            1, 1, self.db
        )
        assert not allowed
        assert reason == ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        # Unpublished project
        stub_project.status = ProjectStatus.DRAFT.value
        mock_user_blocked.return_value = False
        mock_user_is_action_permitted.return_value = False
        allowed, reason = await ProjectService.is_user_permitted_to_validate(
            1, 1, self.db
        )
        assert not allowed
        assert reason == ValidatingNotAllowed.PROJECT_NOT_PUBLISHED

        # Admin can access draft projects
        stub_project.status = ProjectStatus.DRAFT.value
        mock_user_blocked.return_value = False
        mock_user_is_action_permitted.return_value = True
        mock_user_tasks.return_value = LockedTasksForUser(locked_tasks=[])
        allowed, reason = await ProjectService.is_user_permitted_to_validate(
            1, 1, self.db
        )
        assert allowed
        assert reason == "User allowed to validate"

        # Mappers not accepted license should fail
        mock_user_blocked.return_value = False
        mock_user_is_action_permitted.return_value = False
        mock_user_license.return_value = False
        allowed, reason = await ProjectService.is_user_permitted_to_validate(
            1, 1, self.db
        )
        assert not allowed
        assert reason == ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectInfo, "get_dto_for_locale")
    @patch.object(ProjectService, "get_project_by_id")
    @patch("backend.services.project_service.get_settings")
    async def test_send_email_on_project_progress_sends_email_on_fifty_percent_progress(
        self,
        mock_settings,
        mock_project,
        mock_project_info,
        mock_project_completion,
        mock_send_email,
    ):
        # Arrange
        project = Project()
        project.progress_email_sent = False
        project.tasks_mapped = 50
        project.tasks_validated = 0
        project.total_tasks = 100
        project.tasks_bad_imagery = 0
        project.default_locale = "en"
        project.progress_email_sent = False
        mock_project.return_value = project
        mock_project_info.return_value = {
            "name": "TEST_PROJECT"
        }  # Match what fetch_val expects
        mock_project_completion.return_value = 50  # Ensure consistent return value
        mock_send_email.return_value = AsyncMock()
        mock_settings.return_value = type(
            "Settings", (), {"SEND_PROJECT_EMAIL_UPDATES": True}
        )()  # Mock settings object

        # Act
        await ProjectService.send_email_on_project_progress(1)

        # Assert
        mock_send_email.assert_called_once()

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectInfo, "get_dto_for_locale")
    @patch.object(ProjectService, "get_project_by_id")
    @patch("backend.services.project_service.get_settings")
    async def test_send_email_on_project_progress_sends_email_on_project_completion(
        self,
        mock_settings,
        mock_project,
        mock_project_info,
        mock_project_completion,
        mock_send_email,
    ):
        # Arrange
        project = Project()
        project.progress_email_sent = False
        project.tasks_mapped = 0
        project.tasks_validated = 100
        project.total_tasks = 100
        project.tasks_bad_imagery = 0
        project.default_locale = "en"
        project.progress_email_sent = False
        mock_project.return_value = project
        mock_project_info.return_value = {"name": "TEST_PROJECT"}
        mock_project_completion.return_value = 100
        mock_send_email.return_value = AsyncMock()
        mock_settings.return_value = type(
            "Settings", (), {"SEND_PROJECT_EMAIL_UPDATES": True}
        )()

        # Act
        await ProjectService.send_email_on_project_progress(1)

        # Assert
        mock_send_email.assert_called_once()

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectInfo, "get_dto_for_locale")
    @patch.object(ProjectService, "get_project_by_id")
    @patch("backend.services.project_service.get_settings")
    async def test_send_email_on_project_progress_doesnt_send_email_except_on_fifty_and_hundred_percent(
        self,
        mock_settings,
        mock_project,
        mock_project_info,
        mock_project_completion,
        mock_send_email,
    ):
        # Arrange
        project = Project()
        project.progress_email_sent = False
        project.tasks_mapped = 40
        project.tasks_validated = 40
        project.total_tasks = 100
        project.tasks_bad_imagery = 0
        project.default_locale = "en"
        project.progress_email_sent = False
        mock_project.return_value = project
        mock_project_info.return_value = {"name": "TEST_PROJECT"}
        mock_project_completion.return_value = 80
        mock_send_email.return_value = AsyncMock()
        mock_settings.return_value = type(
            "Settings", (), {"SEND_PROJECT_EMAIL_UPDATES": True}
        )()

        # Act
        await ProjectService.send_email_on_project_progress(1)

        # Assert
        assert not mock_send_email.called

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(Project, "calculate_tasks_percent")
    @patch.object(ProjectService, "get_project_by_id")
    @patch("backend.services.project_service.get_settings")
    async def test_send_email_on_project_progress_doesnt_send_email_if_email_already_sent(
        self, mock_settings, mock_project, mock_project_completion, mock_send_email
    ):
        # Arrange
        project = Project()
        project.progress_email_sent = True
        project.tasks_mapped = 50
        project.total_tasks = 100
        project.tasks_validated = 0
        project.tasks_bad_imagery = 0
        mock_project.return_value = project
        mock_project_completion.return_value = 50
        mock_send_email.return_value = AsyncMock()
        mock_settings.return_value = type(
            "Settings", (), {"SEND_PROJECT_EMAIL_UPDATES": True}
        )()

        # Act
        await ProjectService.send_email_on_project_progress(1)

        # Assert
        assert not mock_send_email.called

    @patch.object(SMTPService, "send_email_to_contributors_on_project_progress")
    @patch.object(ProjectService, "get_project_by_id")
    @patch("backend.services.project_service.get_settings")
    async def test_send_email_on_project_progress_doesnt_send_email_if_send_project_update_email_is_disabled(
        self, mock_settings, mock_project, mock_send_email
    ):
        # Arrange
        project = Project()
        project.progress_email_sent = False
        project.tasks_mapped = 50
        project.total_tasks = 100
        project.tasks_validated = 0
        project.tasks_bad_imagery = 0
        project.default_locale = "en"
        mock_project.return_value = project
        mock_send_email.return_value = AsyncMock()
        mock_settings.return_value = type(
            "Settings", (), {"SEND_PROJECT_EMAIL_UPDATES": False}
        )()

        # Act
        await ProjectService.send_email_on_project_progress(1)

        # Assert
        assert not mock_send_email.called
