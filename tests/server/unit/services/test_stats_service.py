import unittest
from unittest.mock import patch
from server.services.stats_service import StatsService, TaskStatus, TaskHistory
from server.models.postgis.project import Project
from server.models.postgis.user import User


class TestStatsService(unittest.TestCase):

    def test_update_after_mapping_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0

        test_user = User()
        test_user.tasks_mapped = 0

        # Act
        StatsService._set_counters_after_mapping(test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_mapped, 1)
        self.assertEqual(test_user.tasks_mapped, 1)

    def test_update_after_validating_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_validated = 0

        test_user = User()
        test_user.tasks_validated = 0

        # Act
        StatsService._set_counters_after_validated(test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_validated, 1)
        self.assertEqual(test_user.tasks_validated, 1)

    def test_update_after_flagging_bad_imagery(self):
        # Arrange
        test_project = Project()
        test_project.tasks_bad_imagery = 0

        # Act
        StatsService._set_counters_after_bad_imagery(test_project)

        # Assert
        self.assertEqual(test_project.tasks_bad_imagery, 1)

    @patch.object(TaskHistory, 'get_last_status')
    def test_update_after_invalidating_mapped_task_sets_counters_correctly(self, last_status):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        last_status.return_value = TaskStatus.MAPPED

        # Act
        StatsService._set_counters_after_invalidated(1, test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)

    @patch.object(TaskHistory, 'get_last_status')
    def test_update_after_invalidating_bad_imagery_task_sets_counters_correctly(self, last_status):
        # Arrange
        test_project = Project()
        test_project.tasks_bad_imagery = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        last_status.return_value = TaskStatus.BADIMAGERY

        # Act
        StatsService._set_counters_after_invalidated(1, test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_bad_imagery, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)

    @patch.object(TaskHistory, 'get_last_status')
    def test_update_after_invalidating_validated_task_sets_counters_correctly(self, last_status):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1
        test_project.tasks_validated = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        last_status.return_value = TaskStatus.VALIDATED

        # Act
        StatsService._set_counters_after_invalidated(1, test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_validated, 0)
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)
