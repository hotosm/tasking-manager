import geojson
import unittest
from server.models.project import InvalidGeoJson, InvalidData, Task


class TestProject(unittest.TestCase):

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