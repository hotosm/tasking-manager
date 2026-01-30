import datetime
import xml.etree.ElementTree as ET
from unittest.mock import patch

from backend.services.project_service import ProjectService
import pytest

from backend.services.mapping_service import MappingService, Task
from backend.models.postgis.task import TaskStatus
from tests.api.helpers.test_helpers import create_canned_project

ORG_NAME = "HOT Tasking Manager"


@pytest.mark.anyio
class TestMappingService:
    skip_tests = False

    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_user, self.test_project_id = (
            await create_canned_project(self.db)
        )

    @patch.object(Task, "get_tasks")
    async def test_generate_gpx(self, mock_task):
        # Arrange
        project_id = self.test_project_id
        task_ids_str = "1,2"
        # grab a representative task from the persisted project (keeps original behaviour)
        task = await Task.get(1, self.test_project_id, self.db)
        mock_task.return_value = [task]

        timestamp = datetime.datetime(2017, 4, 13)

        # Act (generate_gpx is used synchronously like before)
        xml_str = await MappingService.generate_gpx(
            project_id, task_ids_str, self.db, timestamp
        )

        # Assert - parse XML
        root = ET.fromstring(xml_str)

        assert root.tag == "{http://www.topografix.com/GPX/1/1}gpx"
        assert root.attrib["creator"] == ORG_NAME
        assert root.attrib["version"] == "1.1"

        metadata = root.find("{http://www.topografix.com/GPX/1/1}metadata")
        assert metadata is not None

        link = metadata.find("{http://www.topografix.com/GPX/1/1}link")
        assert link is not None
        assert link.attrib["href"] == "https://github.com/hotosm/tasking-manager"

        text = link.find("{http://www.topografix.com/GPX/1/1}text")
        assert text is not None
        assert text.text.strip() == ORG_NAME

        time_el = metadata.find("{http://www.topografix.com/GPX/1/1}time")
        assert time_el is not None
        assert time_el.text.strip() == "2017-04-13T00:00:00"

        trk = root.find("{http://www.topografix.com/GPX/1/1}trk")
        assert trk is not None

        name = trk.find("{http://www.topografix.com/GPX/1/1}name")
        assert name is not None
        assert (
            name.text.strip()
            == f"Task for project {project_id}. Do not edit outside of this area!"
        )

        trkseg = trk.find("{http://www.topografix.com/GPX/1/1}trkseg")
        assert trkseg is not None

        trkpt_list = trkseg.findall("{http://www.topografix.com/GPX/1/1}trkpt")
        assert len(trkpt_list) == 5
        for trkpt in trkpt_list:
            assert "lat" in trkpt.attrib
            assert "lon" in trkpt.attrib

        wpt_list = root.findall("{http://www.topografix.com/GPX/1/1}wpt")
        assert len(wpt_list) == 5
        for wpt in wpt_list:
            assert "lat" in wpt.attrib
            assert "lon" in wpt.attrib

    @patch.object(Task, "get_tasks")
    async def test_generate_osm_xml(self, mock_task):
        # Arrange
        task_ids_str = "1"
        task_1 = await Task.get(1, self.test_project_id, self.db)
        task_2 = await Task.get(2, self.test_project_id, self.db)
        mock_task.return_value = [task_1]

        # Act & Assert for single task
        xml = await MappingService.generate_osm_xml(
            self.test_project_id, task_ids_str, self.db
        )
        assert xml is not None

        root = ET.fromstring(xml)
        assert root.tag == "osm"
        assert root.attrib["version"] == "0.6"
        assert root.attrib["upload"] == "never"
        assert root.attrib["creator"] == ORG_NAME

        nodes = root.findall("./node")
        assert len(nodes) == 5
        ways = root.findall("./way")
        assert len(ways) == 1

        # Multiple tasks
        task_ids_str = "1,2"
        mock_task.return_value = [task_1, task_2]
        xml = await MappingService.generate_osm_xml(
            self.test_project_id, task_ids_str, self.db
        )
        assert xml is not None

        root = ET.fromstring(xml)
        assert root.tag == "osm"
        assert root.attrib["version"] == "0.6"
        assert root.attrib["upload"] == "never"
        assert root.attrib["creator"] == ORG_NAME

        nodes = root.findall("./node")
        assert len(nodes) == 25
        ways = root.findall("./way")
        assert len(ways) == 2

    async def test_map_all_sets_counters_correctly(self):
        if self.skip_tests:
            pytest.skip("skipping mapping heavy tests")

        await MappingService.map_all_tasks(
            self.test_project_id, self.test_user.id, self.db
        )
        test_project = await ProjectService.get_project_by_id(
            self.test_project_id, self.db
        )
        # Assert
        assert (
            test_project.tasks_mapped
            == test_project.total_tasks
            - test_project.tasks_validated
            - test_project.tasks_bad_imagery
        )

    async def test_mapped_by_is_set_after_mapping_all(self):
        if self.skip_tests:
            pytest.skip("skipping mapping heavy tests")
        await self.db.fetch_one(
            "UPDATE tasks SET task_status=:status WHERE project_id=:project_id",
            values={"status": 0, "project_id": self.test_project_id},
        )
        # Act
        await MappingService.map_all_tasks(
            self.test_project_id, self.test_user.id, self.db
        )

        # Assert
        for task in self.test_project.tasks:
            task = await self.db.fetch_one(
                "SELECT id, mapped_by FROM tasks WHERE id=:id AND project_id=:project_id",
                values={"id": task.id, "project_id": self.test_project_id},
            )
            assert task.mapped_by is not None

    async def test_reset_all_bad_imagery(self):
        if self.skip_tests:
            pytest.skip("skipping mapping heavy tests")

        # Act
        await MappingService.reset_all_badimagery(
            self.test_project_id, self.test_user.id, self.db
        )

        # Assert
        for task in self.test_project.tasks:
            task = await Task.get(task.id, self.test_project_id, self.db)
            assert task.task_status != TaskStatus.BADIMAGERY.value
