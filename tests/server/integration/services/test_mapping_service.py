import datetime
import hashlib
import os
import unittest
from unittest.mock import patch
from server import create_app
from server.services.mapping_service import MappingService, Task
from tests.server.helpers.test_helpers import create_canned_project


class TestMappingService(unittest.TestCase):

    skip_tests = False
    test_project = None
    test_user = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('CI', 'false')

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
    def test_gpx_xml_file_generated_correctly(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]
        timestamp = datetime.date(2017, 4, 13)

        # Act
        gpx_xml = MappingService.generate_gpx(1, '1,2', timestamp)

        # Covert XML into a hash that should be identical every time
        gpx_xml_str = gpx_xml.decode('utf-8')
        gpx_hash = hashlib.md5(gpx_xml_str.encode('utf-8')).hexdigest()

        # Assert
        self.assertEqual(gpx_hash, '97c4274c013964091974916ffee07846')

    @patch.object(Task, 'get_all_tasks')
    def test_gpx_xml_file_generated_correctly_all_tasks(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]
        timestamp = datetime.date(2017, 4, 13)

        # Act
        gpx_xml = MappingService.generate_gpx(1, None, timestamp)

        # Convert XML into a hash that should be identical every time
        gpx_xml_str = gpx_xml.decode('utf-8')
        gpx_hash = hashlib.md5(gpx_xml_str.encode('utf-8')).hexdigest()

        # Assert
        self.assertEqual(gpx_hash, '97c4274c013964091974916ffee07846')

    @patch.object(Task, 'get_tasks')
    def test_osm_xml_file_generated_correctly(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]

        # Act
        osm_xml = MappingService.generate_osm_xml(1, '1,2')

        # Covert XML into a hash that should be identical every time
        osm_xml_str = osm_xml.decode('utf-8')
        osm_hash = hashlib.md5(osm_xml_str.encode('utf-8')).hexdigest()

        # Assert
        self.assertEqual(osm_hash, 'eafd0760a0d372e2ab139e25a2d300f1')

    @patch.object(Task, 'get_all_tasks')
    def test_osm_xml_file_generated_correctly_all_tasks(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]

        # Act
        osm_xml = MappingService.generate_osm_xml(1, None)

        # Convert XML into a hash that should be identical every time
        osm_xml_str = osm_xml.decode('utf-8')
        osm_hash = hashlib.md5(osm_xml_str.encode('utf-8')).hexdigest()
        f = open('/home/enelson/test.xml', 'w')
        f.write(osm_xml_str)
        f.close()

        # Assert
        self.assertEqual(osm_hash, 'eafd0760a0d372e2ab139e25a2d300f1')
