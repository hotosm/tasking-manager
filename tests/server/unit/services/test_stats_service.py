import unittest
from unittest.mock import patch
from server.services.stats_service import StatsService, ProjectService, UserService, TaskStatus
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

    def test_update_after_invalidating_mapped_task_sets_counters_correctly(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        StatsService._set_counters_after_invalidated(TaskStatus.MAPPED, test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)

    def test_update_after_invalidating_bad_imagery_task_sets_counters_correctly(self):
        # Arrange
        test_project = Project()
        test_project.tasks_bad_imagery = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        StatsService._set_counters_after_invalidated(TaskStatus.BADIMAGERY, test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_bad_imagery, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)

    def test_update_after_invalidating_validated_task_sets_counters_correctly(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1
        test_project.tasks_validated = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        StatsService._set_counters_after_invalidated(TaskStatus.VALIDATED, test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_validated, 0)
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)
