import os
import unittest
from server import create_app
import geojson
import json
from server.services.grid_service import GridService, GridServiceError
from tests.server.helpers.test_helpers import get_canned_json
from unittest.mock import MagicMock


class TestAuthenticationService(unittest.TestCase):
    skip_tests = False

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

    def tearDown(self):
        if self.skip_tests:
            return

        self.ctx.pop()

    def test_split_geom_returns_split_geometries(self):
        # arrange
        splittable_task = geojson.loads(json.dumps(get_canned_json('splittable_task.json')))
        expected = geojson.loads(json.dumps(get_canned_json('split_task.json')))

        # act
        result = GridService.split_geom(splittable_task)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_split_geom_raise_grid_service_error_when_task_not_splittable(self):
        # arrange
        task_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
                                     '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},'
                                     '"properties": {"x": 2402, "y": 1736, "zoom": 12, "splittable":false}, "type": "Feature"}')


        with self.assertRaises(GridServiceError):
            GridService.split_geom(task_feature)

    def test_split_geom_raise_grid_service_error_when_task_not_usable(self):
        with self.assertRaises(GridServiceError):
            GridService.split_geom(MagicMock)