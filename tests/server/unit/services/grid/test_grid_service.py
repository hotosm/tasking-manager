import json
import unittest

import geojson

from server.models.dtos.grid_dto import GridDTO
from server.models.dtos.project_dto import DraftProjectDTO
from server.models.postgis.utils import InvalidGeoJson
from server.services.grid.grid_service import GridService
from tests.server.helpers.test_helpers import get_canned_json


class TestGridService(unittest.TestCase):
    skip_tests = False

    def test_feature_collection_to_multi_polygon_dissolve(self):
        # arrange
        grid_json = get_canned_json('test_grid.json')
        grid_dto = GridDTO(grid_json)
        aoi_geojson = geojson.loads(json.dumps(grid_dto.area_of_interest))
        expected = geojson.loads(json.dumps(get_canned_json('multi_polygon_dissolved.json')))


        # act
        result = GridService.merge_to_multi_polygon(aoi_geojson, True)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_feature_collection_to_multi_polygon_nodissolve(self):
        # arrange
        grid_json = get_canned_json('test_grid.json')
        grid_dto = GridDTO(grid_json)
        expected = geojson.loads(json.dumps(get_canned_json('multi_polygon.json')))
        aoi_geojson = geojson.loads(json.dumps(grid_dto.area_of_interest))

        # act
        result = GridService.merge_to_multi_polygon(aoi_geojson, False)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_trim_grid_to_aoi_clip(self):
        # arrange
        grid_json = get_canned_json('test_grid.json')

        grid_dto = GridDTO(grid_json)
        expected = geojson.loads(json.dumps(get_canned_json('clipped_feature_collection.json')))
        grid_dto.clip_to_aoi = True

        # act
        result = GridService.trim_grid_to_aoi(grid_dto)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_trim_grid_to_aoi_noclip(self):
        # arrange

        grid_json = get_canned_json('test_grid.json')
        grid_dto = GridDTO(grid_json)
        grid_dto.clip_to_aoi = False

        expected = geojson.loads(json.dumps(get_canned_json('feature_collection.json')))

        # act
        result = GridService.trim_grid_to_aoi(grid_dto)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_tasks_from_aoi_features(self):
        # arrange
        grid_json = get_canned_json('test_arbitrary.json')
        grid_dto = GridDTO(grid_json)
        expected = geojson.loads(json.dumps(get_canned_json('tasks_from_aoi_features.json')))

        # act
        result = GridService.tasks_from_aoi_features(grid_dto.area_of_interest)
        # assert
        self.assertEquals(str(expected), str(result))

    def test_feature_collection_multi_polygon_with_zcoord_nodissolve(self):
        # arrange
        project_json = get_canned_json('canned_kml_project.json')
        project_dto = DraftProjectDTO(project_json)
        expected = geojson.loads(json.dumps(get_canned_json('2d_multi_polygon.json')))
        aoi_geojson = geojson.loads(json.dumps(project_dto.area_of_interest))

        # act
        result = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=False)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_feature_collection_multi_polygon_with_zcoord_dissolve(self):
        # arrange
        project_json = get_canned_json('canned_kml_project.json')
        project_dto = DraftProjectDTO(project_json)
        expected = geojson.loads(json.dumps(get_canned_json('2d_multi_polygon.json')))
        aoi_geojson = geojson.loads(json.dumps(project_dto.area_of_interest))

        # act
        result = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=True)

        # assert
        self.assertEquals(str(expected), str(result))

    def test_raises_InvalidGeoJson_when_geometry_is_linestring(self):

        # arrange
        grid_json = get_canned_json('CHAI-Escuintla-West2.json')
        grid_dto = GridDTO(grid_json)
        grid_dto.clip_to_aoi = True

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            GridService.merge_to_multi_polygon(grid_dto.area_of_interest, dissolve=True)

    def test_cant_create_aoi_with_non_multipolygon_type(self):
        # Arrange
        bad_geom = geojson.Polygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 57.322)]])
        bad_feature = geojson.Feature(geometry=bad_geom)
        bad_feature_collection = geojson.FeatureCollection([bad_feature])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            GridService.merge_to_multi_polygon(geojson.dumps(bad_feature), dissolve=True)

    def test_cant_create_aoi_with_invalid_multipolygon(self):
        bad_multipolygon = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38)]])
        bad_feature = geojson.Feature(geometry=bad_multipolygon)
        bad_feature_collection = geojson.FeatureCollection([bad_feature])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            GridService.merge_to_multi_polygon(geojson.dumps(bad_feature_collection), dissolve=True)


