from backend.services.stats_service import StatsService, TaskStatus
from backend.models.postgis.project import Project
from backend.models.postgis.user import User
from tests.backend.base import BaseTestCase


class TestStatsService(BaseTestCase):
    def test_update_after_mapping_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0

        test_user = User()
        test_user.tasks_mapped = 0

        # Act
        test_project, test_user = StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.READY, TaskStatus.MAPPED
        )

        # Assert
        self.assertEqual(test_project.tasks_mapped, 1)
        self.assertEqual(test_user.tasks_mapped, 1)

    def test_same_state_keeps_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0

        test_user = User()
        test_user.tasks_mapped = 0

        # Act
        test_project, test_user = StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.MAPPED, TaskStatus.MAPPED
        )

        # Assert
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_user.tasks_mapped, 0)

    def test_update_after_validating_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1
        test_project.tasks_validated = 0

        test_user = User()
        test_user.tasks_validated = 0

        # Act
        test_project, test_user = StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.MAPPED, TaskStatus.VALIDATED
        )

        # Assert
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_project.tasks_validated, 1)
        self.assertEqual(test_user.tasks_validated, 1)

    def test_update_after_flagging_bad_imagery(self):
        # Arrange
        test_project = Project()
        test_project.tasks_bad_imagery = 0

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        test_project, test_user = StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.READY, TaskStatus.BADIMAGERY
        )

        # Assert
        self.assertEqual(test_project.tasks_bad_imagery, 1)

    def test_update_after_invalidating_mapped_task_sets_counters_correctly(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        test_project, test_user = StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.MAPPED, TaskStatus.INVALIDATED
        )

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
        test_project, test_user = StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.BADIMAGERY, TaskStatus.INVALIDATED
        )

        # Assert
        self.assertEqual(test_project.tasks_bad_imagery, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)

    def test_update_after_invalidating_validated_task_sets_counters_correctly(self):
        # Arrange
        test_project = Project()
        test_project.tasks_validated = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        test_project, test_user = StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.VALIDATED, TaskStatus.INVALIDATED
        )

        # Assert
        self.assertEqual(test_project.tasks_validated, 0)
        self.assertEqual(test_user.tasks_invalidated, 1)

    def test_tasks_state_representation(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0
        test_project.tasks_validated = 0
        test_project.tasks_bad_imagery = 0

        test_mapper = User()
        test_mapper.tasks_mapped = 0
        test_mapper.tasks_validated = 0
        test_mapper.tasks_invalidated = 0

        test_validator = User()
        test_validator.tasks_mapped = 0
        test_validator.tasks_validated = 0
        test_validator.tasks_invalidated = 0

        test_admin = User()
        test_admin.tasks_mapped = 0
        test_admin.tasks_validated = 0
        test_admin.tasks_invalidated = 0

        # Mapper marks task as mapped
        test_project, test_mapper = StatsService._update_tasks_stats(
            test_project, test_mapper, TaskStatus.READY, TaskStatus.MAPPED
        )

        # Validator marks task as bad imagery
        test_project, test_validator = StatsService._update_tasks_stats(
            test_project, test_validator, TaskStatus.MAPPED, TaskStatus.BADIMAGERY
        )

        # Admin undo marking task as bad imagery
        test_project, test_admin = StatsService._update_tasks_stats(
            test_project, test_admin, TaskStatus.BADIMAGERY, TaskStatus.MAPPED, "undo"
        )

        # Validator marks task as invalid
        test_project, test_validator = StatsService._update_tasks_stats(
            test_project, test_validator, TaskStatus.MAPPED, TaskStatus.INVALIDATED
        )

        # Mapper marks task as mapped
        test_project, test_mapper = StatsService._update_tasks_stats(
            test_project, test_mapper, TaskStatus.INVALIDATED, TaskStatus.MAPPED
        )

        # Admin undo marking task as mapped (test_mapper is given to the function though, as the author of the
        # last_change - compare with MappingServer.undo_mapping() method)
        test_project, test_mapper = StatsService._update_tasks_stats(
            test_project, test_mapper, TaskStatus.MAPPED, TaskStatus.INVALIDATED, "undo"
        )

        # Mapper marks task as mapped
        test_project, test_mapper = StatsService._update_tasks_stats(
            test_project, test_mapper, TaskStatus.INVALIDATED, TaskStatus.MAPPED
        )

        # Validator marks task as valid
        test_project, test_validator = StatsService._update_tasks_stats(
            test_project, test_validator, TaskStatus.MAPPED, TaskStatus.VALIDATED
        )

        # Assert
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_project.tasks_validated, 1)
        self.assertEqual(test_project.tasks_bad_imagery, 0)
        self.assertEqual(test_mapper.tasks_mapped, 2)
        self.assertEqual(test_mapper.tasks_validated, 0)
        self.assertEqual(test_mapper.tasks_invalidated, 0)
        self.assertEqual(test_validator.tasks_mapped, 0)
        self.assertEqual(test_validator.tasks_validated, 1)
        self.assertEqual(test_validator.tasks_invalidated, 1)
        self.assertEqual(test_admin.tasks_mapped, 0)
        self.assertEqual(test_admin.tasks_validated, 0)
        self.assertEqual(test_admin.tasks_invalidated, 0)
