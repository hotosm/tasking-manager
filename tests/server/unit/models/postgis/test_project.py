import unittest
import geojson
from server.models.postgis.project import AreaOfInterest, InvalidGeoJson, Task


class TestProject(unittest.TestCase):

    def test_cant_create_aoi_with_non_multipolygon_type(self):
        # Arrange
        bad_geom = geojson.Polygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 57.322)]])
        bad_feature = geojson.Feature(geometry=bad_geom)
        bad_feature_collection = geojson.FeatureCollection([bad_feature])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            AreaOfInterest(geojson.dumps(bad_feature))

    def test_cant_create_aoi_with_invalid_multipolygon(self):
        bad_multipolygon = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38)]])
        bad_feature = geojson.Feature(geometry=bad_multipolygon)
        bad_feature_collection = geojson.FeatureCollection([bad_feature])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            AreaOfInterest(geojson.dumps(bad_feature_collection))

    def test_cant_add_task_if_not_supplied_feature_type(self):
        # Arrange
        invalid_feature = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 10.33)]])
        # Arrange

        with self.assertRaises(InvalidGeoJson):
            Task.from_geojson_feature(1, invalid_feature)
