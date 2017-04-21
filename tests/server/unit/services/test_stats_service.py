import unittest
from unittest.mock import patch
from server.services.stats_service import StatsService, ProjectService, UserService, TaskStatus
from server.models.postgis.project import Project
from server.models.postgis.user import User


class TestStatsService(unittest.TestCase):

    @patch.object(Project, 'save')
    @patch.object(UserService, 'get_user_by_id')
    @patch.object(ProjectService, 'get_project_by_id')
    def test_update_after_mapping_increments_counter(self, mock_project, mock_user, mock_save):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0
        mock_project.return_value = test_project

        test_user = User()
        test_user.tasks_mapped = 0
        mock_user.return_value = test_user

        # Act
        project, user = StatsService.update_stats_after_task_state_change(1, 1, TaskStatus.MAPPED, TaskStatus.READY)

        # Assert
        self.assertEqual(project.tasks_mapped, 1)
        self.assertEqual(user.tasks_mapped, 1)

    @patch.object(Project, 'save')
    @patch.object(UserService, 'get_user_by_id')
    @patch.object(ProjectService, 'get_project_by_id')
    def test_update_after_invalidating_increments_counter(self, mock_project, mock_user, mock_save):
        # Arrange
        test_user = User()
        test_user.tasks_invalidated = 0
        mock_user.return_value = test_user

        # Act
        project, user = StatsService.update_stats_after_task_state_change(1, 1, TaskStatus.INVALIDATED,
                                                                          TaskStatus.MAPPED)

        # Assert
        self.assertEqual(user.tasks_invalidated, 1)

    @patch.object(Project, 'save')
    @patch.object(UserService, 'get_user_by_id')
    @patch.object(ProjectService, 'get_project_by_id')
    def test_update_after_validating_increments_counter(self, mock_project, mock_user, mock_save):
        # Arrange
        test_project = Project()
        test_project.tasks_validated = 0
        mock_project.return_value = test_project

        test_user = User()
        test_user.tasks_validated = 0
        mock_user.return_value = test_user

        # Act
        project, user = StatsService.update_stats_after_task_state_change(1, 1, TaskStatus.VALIDATED, TaskStatus.MAPPED)

        # Assert
        self.assertEqual(project.tasks_validated, 1)
        self.assertEqual(user.tasks_validated, 1)
