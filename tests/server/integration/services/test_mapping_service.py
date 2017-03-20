import os
import unittest
import geojson
import json
from server import create_app
from server.services.mapping_service import MappingService
from server.services.project_service import Project, AreaOfInterest, Task


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

        self.create_test_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.ctx.pop()

    def test_lock_task_for_mapping_adds_locked_history(self, mock_task, mock_update):
        # Arrange
        mock_task.return_value = self.task_stub

        # Act
        test_task = MappingService().lock_task_for_mapping(1, 1)

        # Assert
        self.assertEqual(TaskAction.LOCKED.name, test_task.task_history[0].action)