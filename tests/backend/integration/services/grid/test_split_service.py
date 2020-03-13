import json
import os
from shapely.geometry import Polygon
from geoalchemy2 import shape
import unittest
from unittest.mock import patch

import geojson

from backend import create_app
from backend.models.dtos.grid_dto import SplitTaskDTO
from backend.models.postgis.project import Project
from backend.models.postgis.task import Task
from backend.services.grid.split_service import SplitService, SplitServiceError
from tests.backend.helpers.test_helpers import get_canned_json
from tests.backend.helpers.test_helpers import create_canned_project


class TestSplitService(unittest.TestCase):
    skip_tests = False
    test_project = None
    test_user = None
    maxDiff = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv("CI", "false")

        # Firewall rules mean we can't hit Postgres from CI so we have to skip them in the CI build
        if env == "true":
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

    def test_split_geom_returns_split_geometries(self):
        if self.skip_tests:
            return

        # arrange
        x = 1010
        y = 1399
        zoom = 11
        task_stub = Task()
        task_stub.is_square = True

        expected = geojson.loads(json.dumps(get_canned_json("split_task.json")))

        # act
        result = SplitService._create_split_tasks(x, y, zoom, task_stub)

        # assert
        self.assertEqual(str(expected), str(result))

    def test_split_geom_raise_grid_service_error_when_task_not_usable(self):
        if self.skip_tests:
            return
        with self.assertRaises(SplitServiceError):
            task_stub = Task()
            task_stub.is_square = True
            SplitService._create_split_tasks("foo", "bar", "dum", task_stub)

    @patch.object(Task, "get_per_task_instructions")
    @patch.object(Project, "tasks")
    @patch.object(Project, "save")
    @patch.object(Project, "get")
    @patch.object(Task, "delete")
    @patch.object(Task, "create")
    @patch.object(Task, "get_max_task_id_for_project")
    @patch.object(Task, "get")
    def test_split_task_helper(
        self,
        mock_task_get,
        mock_task_get_max_task_id_for_project,
        mock_task_create,
        mock_task_delete,
        mock_project_get,
        mock_project_save,
        mock_project_tasks,
        mock_instructions,
    ):
        if self.skip_tests:
            return

        # arrange
        task_stub = Task()
        task_stub.id = 1
        task_stub.project_id = 1
        task_stub.task_status = 1
        task_stub.locked_by = 1234
        task_stub.lock_holder = 1234
        task_stub.is_square = True
        task_stub.x = 16856
        task_stub.y = 17050
        task_stub.zoom = 15
        task_stub.geometry = shape.from_shape(
            Polygon(
                [
                    (5.1855468740711421, 7.2970875628719796),
                    (5.1855468740711421, 7.3079847788619219),
                    (5.1965332021941588, 7.3079847788619219),
                    (5.1965332021941588, 7.2970875628719796),
                    (5.1855468740711421, 7.2970875628719796),
                ]
            )
        )
        mock_task_get.return_value = task_stub
        mock_task_get_max_task_id_for_project.return_value = 1
        mock_project_get.return_value = Project()
        mock_project_tasks.return_value = [task_stub]
        splitTaskDTO = SplitTaskDTO()
        splitTaskDTO.user_id = 1234
        splitTaskDTO.project_id = 1
        splitTaskDTO.task_id = 1

        # act
        result = SplitService.split_task(splitTaskDTO)

        # assert
        self.assertEqual(4, len(result.tasks))

    @patch.object(Task, "get_tasks")
    def test_split_non_square_task(self, mock_task):
        if self.skip_tests:
            return

        # Lock task for mapping
        task = Task.get(2, self.test_project.id)
        task.lock_task_for_mapping(self.test_user.id)

        splitTaskDTO = SplitTaskDTO()
        splitTaskDTO.user_id = self.test_user.id
        splitTaskDTO.project_id = self.test_project.id
        splitTaskDTO.task_id = 2

        # Split tasks
        expected = geojson.loads(
            json.dumps(get_canned_json("non_square_split_results.json"))
        )
        result = SplitService._create_split_tasks(task.x, task.y, task.zoom, task)

        self.assertEqual(str(expected), str(result))
