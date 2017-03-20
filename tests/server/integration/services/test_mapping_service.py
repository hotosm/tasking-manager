import os
import unittest
from server import create_app
from server.services.mapping_service import MappingService
from tests.server.integration.helpers.test_helpers import create_test_project


class TestMappingService(unittest.TestCase):
    skip_tests = False
    test_project = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        if self.skip_tests:
            return

        self.test_project = create_test_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.ctx.pop()

    def test_lock_task_for_mapping_adds_locked_history(self):
        # Act
        test_task = MappingService().lock_task_for_mapping(1, self.test_project.id)

        # Assert
        self.assertTrue(test_task.task_locked)

