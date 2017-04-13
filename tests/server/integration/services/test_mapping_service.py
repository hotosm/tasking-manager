import datetime
import hashlib
import os
import unittest
from unittest.mock import patch
from server import create_app
from server.services.mapping_service import MappingService, Task
from tests.server.helpers.test_helpers import create_canned_project


class TestAuthenticationService(unittest.TestCase):
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

    @patch.object(Task, 'get_tasks')
    def test_gpx(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]
        timestamp = datetime.date(2017, 4, 13)

        # Act
        gpx_xml = MappingService.generate_gpx(1, '1,2', timestamp)

        # Covert XML into a has that should be identical every time
        gpx_xml_str = gpx_xml.decode('utf-8')
        gpx_hash = hashlib.md5(gpx_xml_str.encode('utf-8')).hexdigest()

        # Assert
        self.assertEqual(gpx_hash, '6b808eadc04cff17b68a55d8d2a1a570')
