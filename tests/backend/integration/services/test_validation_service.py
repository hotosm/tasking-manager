from backend.services.validator_service import ValidatorService
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project


class TestValidationService(BaseTestCase):
    def setUp(self):
        super().setUp()

        self.test_project, self.test_user = create_canned_project()

    def test_validate_all_sets_counters_correctly(self):

        # Act
        ValidatorService.validate_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        self.assertEqual(
            self.test_project.tasks_validated, self.test_project.total_tasks
        )
        self.assertEqual(self.test_project.tasks_mapped, self.test_project.total_tasks)

    def test_invalidate_all_sets_counters_correctly(self):

        # Act
        ValidatorService.invalidate_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        self.assertEqual(0, self.test_project.tasks_mapped)
        self.assertEqual(0, self.test_project.tasks_validated)

    def test_mapped_by_and_validated_by_are_null_after_invalidating_all(self):

        ValidatorService.validate_all_tasks(self.test_project.id, self.test_user.id)
        ValidatorService.invalidate_all_tasks(self.test_project.id, self.test_user.id)

        for task in self.test_project.tasks:
            self.assertIsNone(task.mapped_by)
            self.assertIsNone(task.validated_by)

    def test_mapped_by_and_validated_by_is_set_after_validating_all(self):

        ValidatorService.validate_all_tasks(self.test_project.id, self.test_user.id)

        for task in self.test_project.tasks:
            self.assertIsNotNone(task.mapped_by)
            self.assertEqual(task.validated_by, self.test_user.id)
