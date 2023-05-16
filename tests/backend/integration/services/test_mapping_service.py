import datetime
import xml.etree.ElementTree as ET
from unittest.mock import patch
from backend.services.mapping_service import MappingService, Task
from backend.models.postgis.task import TaskStatus
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project


ORG_NAME = "HOT Tasking Manager"


class TestMappingService(BaseTestCase):
    skip_tests = False
    test_project = None
    test_user = None

    def setUp(self):
        super().setUp()
        self.test_project, self.test_user = create_canned_project()

    @patch.object(Task, "get_tasks")
    def test_generate_gpx(self, mock_task):
        # Create a sample project ID and task IDs string
        project_id = 1
        task_ids_str = "1,2"
        task = Task.get(1, self.test_project.id)
        mock_task.return_value = [task]

        timestamp = datetime.datetime(2017, 4, 13)

        # Call the generate_gpx function with some test data
        xml_str = MappingService.generate_gpx(1, task_ids_str, timestamp)

        # Parse the XML string and retrieve the root element
        root = ET.fromstring(xml_str)

        # Test root element
        self.assertEqual(root.tag, "{http://www.topografix.com/GPX/1/1}gpx")
        self.assertEqual(root.attrib["creator"], ORG_NAME)
        self.assertEqual(root.attrib["version"], "1.1")

        # Test metadata element
        metadata = root.find("{http://www.topografix.com/GPX/1/1}metadata")
        self.assertIsNotNone(metadata)

        link = metadata.find("{http://www.topografix.com/GPX/1/1}link")
        self.assertIsNotNone(link)
        self.assertEqual(
            link.attrib["href"], "https://github.com/hotosm/tasking-manager"
        )
        text = link.find("{http://www.topografix.com/GPX/1/1}text")
        self.assertIsNotNone(text)
        self.assertEqual(text.text.strip(), ORG_NAME)

        time = metadata.find("{http://www.topografix.com/GPX/1/1}time")
        self.assertIsNotNone(time)
        self.assertEqual(time.text.strip(), "2017-04-13T00:00:00")

        # Test trk element
        trk = root.find("{http://www.topografix.com/GPX/1/1}trk")
        self.assertIsNotNone(trk)

        name = trk.find("{http://www.topografix.com/GPX/1/1}name")
        self.assertIsNotNone(name)
        self.assertEqual(
            name.text.strip(),
            f"Task for project {project_id}. Do not edit outside of this area!",
        )

        trkseg = trk.find("{http://www.topografix.com/GPX/1/1}trkseg")
        self.assertIsNotNone(trkseg)

        trkpt_list = trkseg.findall("{http://www.topografix.com/GPX/1/1}trkpt")
        self.assertEqual(len(trkpt_list), 5)
        for trkpt in trkpt_list:
            self.assertIn("lat", trkpt.attrib)
            self.assertIn("lon", trkpt.attrib)

        # Test wpt elements
        wpt_list = root.findall("{http://www.topografix.com/GPX/1/1}wpt")
        self.assertEqual(len(wpt_list), 5)
        for wpt in wpt_list:
            self.assertIn("lat", wpt.attrib)
            self.assertIn("lon", wpt.attrib)

    @patch.object(Task, "get_tasks")
    def test_generate_osm_xml(self, mock_task):
        # Test with a single task
        task_ids_str = "1"
        task_1 = Task.get(1, self.test_project.id)
        task_2 = Task.get(2, self.test_project.id)
        mock_task.return_value = [task_1]

        xml = MappingService.generate_osm_xml(1, task_ids_str)
        self.assertIsNotNone(xml)

        # Assert that the generated XML is in the correct format
        root = ET.fromstring(xml)
        self.assertEqual(root.tag, "osm")
        self.assertEqual(root.attrib["version"], "0.6")
        self.assertEqual(root.attrib["upload"], "never")
        self.assertEqual(root.attrib["creator"], ORG_NAME)

        # Assert that the correct number of nodes and ways were generated
        nodes = root.findall("./node")
        self.assertEqual(len(nodes), 5)
        ways = root.findall("./way")
        self.assertEqual(len(ways), 1)

        # Test with multiple tasks
        task_ids_str = "1,2"
        mock_task.return_value = [task_1, task_2]
        xml = MappingService.generate_osm_xml(1, task_ids_str)
        self.assertIsNotNone(xml)

        # Assert that the generated XML is in the correct format
        root = ET.fromstring(xml)
        self.assertEqual(root.tag, "osm")
        self.assertEqual(root.attrib["version"], "0.6")
        self.assertEqual(root.attrib["upload"], "never")
        self.assertEqual(root.attrib["creator"], ORG_NAME)

        # Assert that the correct number of nodes and ways were generated
        nodes = root.findall("./node")
        self.assertEqual(len(nodes), 25)
        ways = root.findall("./way")
        self.assertEqual(len(ways), 2)

    def test_map_all_sets_counters_correctly(self):
        if self.skip_tests:
            return

        # Act
        MappingService.map_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        self.assertEqual(
            self.test_project.tasks_mapped,
            self.test_project.total_tasks
            - self.test_project.tasks_validated
            - self.test_project.tasks_bad_imagery,
        )

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
