import unittest
from server.services.grid_service import GridService
from server.models.dtos.grid_dto import GridDTO
from server.models.dtos.project_dto import DraftProjectDTO
from tests.server.helpers.test_helpers import get_canned_json
import geojson
import json

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
        grid_json = get_canned_json('test_grid.json')
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

