import os
import unittest
from server import create_app
import geojson
import json
from server.services.split_service import SplitService, SplitServiceError
from tests.server.helpers.test_helpers import get_canned_json
from tests.server.helpers.test_helpers import create_canned_project
from server.models.postgis.task import Task
from server.models.postgis.project import Project
from server.models.dtos.grid_dto import SplitTaskDTO
from unittest.mock import patch


class TestSplitService(unittest.TestCase):
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

    def test_split_geom_returns_split_geometries(self):
        # arrange
        x = 1010
        y = 1399
        zoom = 11
        expected = geojson.loads(json.dumps(get_canned_json('split_task.json')))

        # act
        result = SplitService._create_split_tasks(x, y, zoom)

        # assert
        self.assertEquals(str(expected), str(result))


    def test_split_geom_raise_grid_service_error_when_task_not_usable(self):
        with self.assertRaises(SplitServiceError):
            SplitService._create_split_tasks("foo", "bar", "dum")

    def test_split_geom_returns_split_geometries_for_task(self):
        # arrange
        task = Task.get(1, self.test_project.id)
        x = task.x
        y = task.y
        zoom = task.zoom
        expected = geojson.loads(json.dumps(get_canned_json('split_task.json')))

        # act
        result = SplitService._create_split_tasks(x, y, zoom)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_get_max_id(self):
        expected = 1
        result = Task.get_max_task_id_for_project(self.test_project.id)
        self.assertEquals(result, 1)

    @patch.object(Project, 'tasks')
    @patch.object(Project, 'save')
    @patch.object(Project, 'get')
    @patch.object(Task, 'delete')
    @patch.object(Task, 'create')
    @patch.object(Task, 'get_max_task_id_for_project')
    @patch.object(Task, 'get')
    def test_split_task_helper(self, mock_task_get, mock_task_get_max_task_id_for_project,
                               mock_task_create, mock_task_delete, mock_project_get, mock_project_save,
                               mock_project_tasks):
        # arrange
        task_stub = Task()
        task_stub.id = 1
        task_stub.project_id = self.test_project.id
        task_stub.task_status = 1
        task_stub.locked_by = self.test_user.id
        task_stub.lock_holder = self.test_user.id
        task_stub.splittable = True
        task_stub.x = 1010
        task_stub.y = 1399
        task_stub.zoom = 11
        mock_task_get.return_value = task_stub

        mock_task_get_max_task_id_for_project.return_value = 1

        mock_project_get.return_value = Project();

        mock_project_tasks.return_value = [task_stub]



        splitTaskDTO = SplitTaskDTO() # Task.get(1, self.test_project.id)
        splitTaskDTO.user_id = self.test_user.id
        splitTaskDTO.project_id = self.test_project.id
        splitTaskDTO.task_id = 1

        # act
        result = SplitService.split_task(splitTaskDTO)

        # assert
        self.assertEquals(4, len(result.tasks))


