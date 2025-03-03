from unittest.mock import patch

from backend.models.postgis.statuses import ProjectStatus, UserRole
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService, ProjectServiceError
from backend.services.team_service import TeamService
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project, return_canned_user


class TestProjectService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.project_author = create_canned_project()
        self.test_mapper = return_canned_user()
        self.test_mapper.username = "Test Mapper"
        self.test_mapper.id = 11111
        self.test_mapper.create()

    def test_get_project_dto_for_mapper_returns_project_dto(self):
        # Arrange
        # We need to change project status to published as it's set to draft while creating test project
        self.test_project.status = ProjectStatus.PUBLISHED.value
        # Act
        project_dto = ProjectService.get_project_dto_for_mapper(
            self.test_project.id, self.test_mapper.id
        )
        # Assert
        self.assertIsNotNone(project_dto)

    def test_get_project_dto_for_mapper_raises_error_if_draft_project(self):
        # Project status is already set as draft while creating test project so no need to change it's status
        # Act/Assert
        with self.assertRaises(ProjectServiceError):
            ProjectService.get_project_dto_for_mapper(
                self.test_project.id, self.test_mapper.id
            )

    def test_get_project_dto_for_mapper_returns_none_if_private_project(self):
        # Arrange
        # We need to change project status to published as it's set to draft while creating test project
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_project.private = True
        # Act
        project_dto = ProjectService.get_project_dto_for_mapper(
            self.test_project.id, self.test_mapper.id
        )
        # Assert
        self.assertIsNone(project_dto)

    def test_get_project_dto_for_mapper_returns_private_and_draft_project_dto_for_adimn(
        self,
    ):
        # Arrange
        self.test_mapper.role = UserRole.ADMIN.value
        self.test_project.private = True

        # Act
        project_dto = ProjectService.get_project_dto_for_mapper(
            self.test_project.id, self.test_mapper.id
        )
        # Assert
        self.assertIsNotNone(project_dto)

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    def test_get_project_dto_for_mapper_returns_private_and_draft_project_dto_for_managers(
        self, mock_is_user_manager
    ):
        # Arrange
        self.test_project.private = True
        mock_is_user_manager.return_value = True
        # Act
        project_dto = ProjectService.get_project_dto_for_mapper(
            self.test_project.id, self.test_mapper.id
        )
        # Assert
        self.assertIsNotNone(project_dto)

    @patch.object(TeamService, "check_team_membership")
    def test_get_project_dto_for_mapper_returns_private_project_dto_for_project_team_member(
        self, mock_is_team_member
    ):
        # Arrange
        self.test_project.private = True
        self.test_project.status = ProjectStatus.PUBLISHED.value
        mock_is_team_member.return_value = True
        # Act
        project_dto = ProjectService.get_project_dto_for_mapper(
            self.test_project.id, self.test_mapper.id
        )
        # Assert
        self.assertIsNotNone(project_dto)
