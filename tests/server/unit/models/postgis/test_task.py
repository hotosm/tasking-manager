import geojson
import unittest
from server import create_app
from server.models.postgis.task import InvalidGeoJson, InvalidData, Task, TaskAction


class TestTask(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_cant_add_task_if_feature_geometry_is_invalid(self):
        # Arrange
        invalid_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],' \
                                        '[-3.8122, 56.098], [-4.0237]]]], "type": "MultiPolygon"}, "properties":' \
                                        '{"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

        with self.assertRaises(InvalidGeoJson):
            Task.from_geojson_feature(1, invalid_feature)

    def test_cant_add_task_if_feature_has_missing_properties(self):
        # Arrange
        # Missing zoom
        invalid_properties = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],' \
                                           '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},' \
                                           '"properties": {"x": 2402, "y": 1736}, "type": "Feature"}')

        with self.assertRaises(InvalidData):
            Task.from_geojson_feature(1, invalid_properties)

    def test_lock_task_for_mapping_adds_locked_history(self):
        # Arrange
        test_task = Task()

        # Act
        test_task.set_task_history(action=TaskAction.LOCKED_FOR_MAPPING, user_id=123454)

        # Assert
        self.assertEqual(TaskAction.LOCKED_FOR_MAPPING.name, test_task.task_history[0].action)

    def test_cant_add_task_if_not_supplied_feature_type(self):
        # Arrange
        invalid_feature = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 10.33)]])
        # Arrange

        with self.assertRaises(InvalidGeoJson):
            Task.from_geojson_feature(1, invalid_feature)
