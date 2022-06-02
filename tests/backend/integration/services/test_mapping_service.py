import datetime
import hashlib
from unittest.mock import patch
from backend.services.mapping_service import MappingService, Task
from backend.models.postgis.task import TaskStatus
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project


class TestMappingService(BaseTestCase):

    skip_tests = False
    test_project = None
    test_user = None

    def setUp(self):
        super().setUp()
        self.test_project, self.test_user = create_canned_project()

    @patch.object(Task, "get_tasks")
    def test_gpx_xml_file_generated_correctly(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]
        timestamp = datetime.date(2017, 4, 13)

        # Act
        gpx_xml = MappingService.generate_gpx(1, "1,2", timestamp)

        # Covert XML into a hash that should be identical every time
        gpx_xml_str = gpx_xml.decode("utf-8")
        gpx_hash = hashlib.md5(gpx_xml_str.encode("utf-8")).hexdigest()

        # Assert
        self.assertEqual(gpx_hash, "17c95ad7772b6b264c3a7eaafcb7c0aa")

    @patch.object(Task, "get_all_tasks")
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
        gpx_xml_str = gpx_xml.decode("utf-8")
        gpx_hash = hashlib.md5(gpx_xml_str.encode("utf-8")).hexdigest()

        # Assert
        self.assertEqual(gpx_hash, "17c95ad7772b6b264c3a7eaafcb7c0aa")

    @patch.object(Task, "get_tasks")
    def test_osm_xml_file_generated_correctly(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]

        # Act
        osm_xml = MappingService.generate_osm_xml(1, "1,2")

        # Covert XML into a hash that should be identical every time
        osm_xml_str = osm_xml.decode("utf-8")
        osm_hash = hashlib.md5(osm_xml_str.encode("utf-8")).hexdigest()

        # Assert
        self.assertEqual(osm_hash, "6f51169314543c73eb2e2a94ad17ffd9")

    @patch.object(Task, "get_all_tasks")
    def test_osm_xml_file_generated_correctly_all_tasks(self, mock_task):
        if self.skip_tests:
            return

        # Arrange
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]

        # Act
        osm_xml = MappingService.generate_osm_xml(1, None)

        # Convert XML into a hash that should be identical every time
        osm_xml_str = osm_xml.decode("utf-8")
        osm_hash = hashlib.md5(osm_xml_str.encode("utf-8")).hexdigest()

        # Assert
        self.assertEqual(osm_hash, "6f51169314543c73eb2e2a94ad17ffd9")

    def test_map_all_sets_counters_correctly(self):
        if self.skip_tests:
            return

        # Act
        MappingService.map_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        self.assertEqual(self.test_project.tasks_mapped, self.test_project.total_tasks)

    def test_mapped_by_is_set_after_mapping_all(self):
        if self.skip_tests:
            return

        # Act
        MappingService.map_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        for task in self.test_project.tasks:
            self.assertIsNotNone(task.mapped_by)

    def test_reset_all_bad_imagery(
        self,
    ):
        if self.skip_tests:
            return

        # Act
        MappingService.reset_all_badimagery(self.test_project.id, self.test_user.id)

        # Assert
        for task in self.test_project.tasks:
            self.assertNotEqual(task.task_status, TaskStatus.BADIMAGERY.value)
