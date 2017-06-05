import os
import unittest
from server import create_app
from server.services.validator_service import ValidatorService
from tests.server.helpers.test_helpers import create_canned_project


class TestValidationService(unittest.TestCase):

    skip_tests = False
    test_project = None
    test_user = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.test_project, self.test_user = create_canned_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.test_user.delete()
        self.ctx.pop()

    def test_validate_all_sets_counters_correctly(self):
        if self.skip_tests:
            return

        # Act
        ValidatorService.validate_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        self.assertEqual(self.test_project.tasks_validated, self.test_project.total_tasks)
        self.assertEqual(self.test_project.tasks_mapped, self.test_project.total_tasks)

    def test_invalidate_all_sets_counters_correctly(self):
        if self.skip_tests:
            return

        # Act
        ValidatorService.invalidate_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        self.assertEqual(0, self.test_project.tasks_mapped)
        self.assertEqual(0, self.test_project.tasks_validated)
