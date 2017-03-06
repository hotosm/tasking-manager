import geojson
import unittest
from server.models.project import AreaOfInterest, InvalidGeoJson, InvalidData, Project, Task


class TestProject(unittest.TestCase):

    def test_cant_create_aoi_with_non_multipolygon_type(self):
        # Arrange
        bad_geom = geojson.Polygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 57.322)]])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            AreaOfInterest(geojson.dumps(bad_geom))

    def test_cant_create_aoi_with_invalid_multipolygon(self):
        bad_multipolygon = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38)]])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            AreaOfInterest(geojson.dumps(bad_multipolygon))

    def test_cant_create_project_with_empty_project_name(self):
        # Act / Assert
        with self.assertRaises(InvalidData):
            # Only geometries of type MultiPolygon are valid
            Project('', 'aoi')

    def test_cant_add_task_if_not_supplied_feature_type(self):
        # Arrange
        invalid_feature = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 10.33)]])
        # Arrange

        with self.assertRaises(InvalidGeoJson):
            Task(1, invalid_feature)

    def test_cant_add_task_if_feature_geometry_is_invalid(self):
        # Arrange
        invalid_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],' \
                                        '[-3.8122, 56.098], [-4.0237]]]], "type": "MultiPolygon"}, "properties":' \
                                        '{"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

        with self.assertRaises(InvalidGeoJson):
            Task(1, invalid_feature)

    def test_cant_add_task_if_feature_has_missing_properties(self):
        # Arrange
        # Missing zoom
        invalid_properties = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],' \
                                           '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},' \
                                           '"properties": {"x": 2402, "y": 1736}, "type": "Feature"}')

        with self.assertRaises(InvalidData):
            Task(1, invalid_properties)
