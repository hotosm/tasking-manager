import hashlib
import unittest
from unittest.mock import patch
from server.services.project_service import ProjectService, Project, NotFound, ProjectStatus, ProjectServiceError, \
    MappingLevel, UserService, ProjectSearchDTO, MappingTypes


class TestProjectService(unittest.TestCase):

    @patch.object(Project, 'get')
    def test_project_service_raises_error_if_project_not_found(self, mock_project):
        mock_project.return_value = None

        with self.assertRaises(NotFound):
            ProjectService.get_project_by_id(123)

    @patch.object(ProjectService, 'get_project_by_id')
    def test_get_project_dto_for_mapping_raises_error_if_project_not_published(self, mock_project):
        # Arrange
        test_project = Project()
        test_project.status = ProjectStatus.DRAFT.value
        mock_project.return_value = test_project

        # Act / Assert
        with self.assertRaises(ProjectServiceError):
            ProjectService.get_project_dto_for_mapper(123, 'en')

    @patch.object(UserService, 'get_mapping_level')
    def test_user_not_allowed_to_map_if_level_enforced(self, mock_level):
        # Arrange
        mock_level.return_value = MappingLevel.BEGINNER

        # Act / Assert
        self.assertFalse(ProjectService._is_user_mapping_level_at_or_above_level_requests(MappingLevel.INTERMEDIATE, 1))

    @patch.object(UserService, 'get_mapping_level')
    def test_user_is_allowed_to_map_if_level_enforced(self, mock_level):
        # Arrange
        mock_level.return_value = MappingLevel.ADVANCED

        # Act / Assert
        self.assertTrue(ProjectService._is_user_mapping_level_at_or_above_level_requests(MappingLevel.ADVANCED, 1))

    @patch.object(Project, 'get_locked_tasks_for_user')
    @patch.object(Project, 'get')
    def test_user_not_permitted_to_map_if_already_locked_tasks(self, mock_project, mock_user_tasks):
        # Arrange
        mock_project.return_value = Project()
        mock_user_tasks.return_value = [1]

        #Act
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)

        # Assert
        self.assertFalse(allowed)

    @patch.object(UserService, 'has_user_accepted_license')
    @patch.object(Project, 'get_locked_tasks_for_user')
    @patch.object(Project, 'get')
    def test_user_not_permitted_to_map_if_user_has_not_accepted_license(self, mock_project, mock_user_tasks,
                                                                        mock_user_service):
        # Arrange
        stub_project = Project()
        stub_project.license_id = 11

        mock_project.return_value = stub_project
        mock_user_tasks.return_value = []
        mock_user_service.return_value = False

        #Act
        allowed, reason = ProjectService.is_user_permitted_to_map(1, 1)

        # Assert
        self.assertFalse(allowed)

    @patch.object(Project, 'get_locked_tasks_for_user')
    @patch.object(Project, 'get')
    def test_user_not_permitted_to_map_if_already_locked_tasks(self, mock_project, mock_user_tasks):
        # Arrange
        mock_project.return_value = Project()
        mock_user_tasks.return_value = []

        #Act / Assert
        with self.assertRaises(NotFound):
            ProjectService.get_task_for_logged_in_user(1, 1)
