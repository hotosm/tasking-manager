import json
import pytest
import geojson
from shapely.geometry import shape

from backend.models.dtos.grid_dto import GridDTO
from backend.models.dtos.project_dto import DraftProjectDTO
from backend.models.postgis.utils import InvalidGeoJson
from backend.services.grid.grid_service import GridService
from tests.api.helpers.test_helpers import get_canned_json


# Custom pytest fixture for deep almost equal assertion. Referenced from base.py of tests.
@pytest.fixture
def assert_deep_almost_equal():
    def _assert_deep_almost_equal(expected, actual, *args, places=7, **kwargs):
        """
        Assert that two complex structures have almost equal contents.

        Compares lists, dicts and tuples recursively. Checks numeric values
        using pytest's pytest.approx and checks all other values with assert.
        """
        kwargs.pop("__trace", "ROOT")
        if (
            hasattr(expected, "__geo_interface__")
            and hasattr(actual, "__geo_interface__")
            and expected.__geo_interface__["type"] == actual.__geo_interface__["type"]
            and expected.__geo_interface__["type"]
            not in ["Feature", "FeatureCollection"]
        ):
            shape_expected = shape(expected)
            shape_actual = shape(actual)
            assert shape_expected.equals(shape_actual)
        elif isinstance(expected, (int, float, complex)):
            if places is not None:
                # Calculate acceptable delta based on places
                delta = 0.5 * 10 ** (-places)
                assert expected == pytest.approx(actual, abs=delta)
            else:
                assert expected == pytest.approx(actual)
        elif isinstance(expected, (list, tuple)):
            assert len(expected) == len(actual)
            for index in range(len(expected)):
                v1, v2 = expected[index], actual[index]
                _assert_deep_almost_equal(
                    v1, v2, places=places, __trace=repr(index), *args, **kwargs
                )
        elif isinstance(expected, dict):
            assert set(expected) == set(actual)
            for key in expected:
                _assert_deep_almost_equal(
                    expected[key],
                    actual[key],
                    places=places,
                    __trace=repr(key),
                    *args,
                    **kwargs,
                )
        else:
            assert expected == actual

    return _assert_deep_almost_equal


@pytest.mark.anyio
class TestGridService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup required test data and configure geojson precision"""
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

        # Store the default precision and set to 7 for tests
        self.default_precision = geojson.geometry.DEFAULT_PRECISION
        geojson.geometry.DEFAULT_PRECISION = 7

        # Clean up after test
        yield

        # Restore default precision
        geojson.geometry.DEFAULT_PRECISION = self.default_precision

    async def test_feature_collection_to_multi_polygon_dissolve(
        self, assert_deep_almost_equal
    ):
        # Arrange
        grid_json = get_canned_json("test_grid.json")
        grid_dto = GridDTO(**grid_json)
        aoi_geojson = geojson.loads(json.dumps(grid_dto.area_of_interest))
        expected = geojson.loads(
            json.dumps(get_canned_json("multi_polygon_dissolved.json"))
        )

        # Act
        result = GridService.merge_to_multi_polygon(aoi_geojson, True)

        # Assert
        assert_deep_almost_equal(expected, result)

    async def test_feature_collection_to_multi_polygon_nodissolve(self):
        # Arrange
        grid_json = get_canned_json("test_grid.json")
        grid_dto = GridDTO(**grid_json)
        expected = geojson.loads(json.dumps(get_canned_json("multi_polygon.json")))
        aoi_geojson = geojson.loads(json.dumps(grid_dto.area_of_interest))

        # Act
        result = GridService.merge_to_multi_polygon(aoi_geojson, False)

        # Assert
        assert str(expected) == str(result)

    async def test_trim_grid_to_aoi_clip(self, assert_deep_almost_equal):
        # Arrange
        grid_json = get_canned_json("test_grid.json")
        grid_dto = GridDTO(**grid_json)
        expected = geojson.loads(
            json.dumps(get_canned_json("clipped_feature_collection.json"))
        )
        grid_dto.clip_to_aoi = True

        # Act
        result = GridService.trim_grid_to_aoi(grid_dto)

        # Assert
        assert_deep_almost_equal(expected, result, places=6)

    async def test_trim_grid_to_aoi_noclip(self, assert_deep_almost_equal):
        # Arrange
        grid_json = get_canned_json("test_grid.json")
        grid_dto = GridDTO(**grid_json)
        grid_dto.clip_to_aoi = False

        expected = geojson.loads(json.dumps(get_canned_json("feature_collection.json")))

        # Act
        result = GridService.trim_grid_to_aoi(grid_dto)

        # Assert
        assert_deep_almost_equal(expected, result)

    async def test_tasks_from_aoi_features(self):
        # Arrange
        grid_json = get_canned_json("test_arbitrary.json")
        grid_dto = GridDTO.construct(**grid_json)  # Bypass required fields validation.
        expected = geojson.loads(
            json.dumps(get_canned_json("tasks_from_aoi_features.json"))
        )

        # Act
        result = GridService.tasks_from_aoi_features(grid_dto.area_of_interest)

        # Assert
        assert str(expected) == str(result)

    async def test_feature_collection_multi_polygon_with_zcoord_nodissolve(self):
        # Arrange
        project_json = get_canned_json("canned_kml_project.json")
        project_dto = DraftProjectDTO(**project_json)
        expected = geojson.loads(json.dumps(get_canned_json("2d_multi_polygon.json")))
        aoi_geojson = geojson.loads(json.dumps(project_dto.area_of_interest))

        # Act
        result = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=False)

        # Assert
        assert str(expected) == str(result)

    async def test_feature_collection_multi_polygon_with_zcoord_dissolve(self):
        # Arrange
        project_json = get_canned_json("canned_kml_project.json")
        project_dto = DraftProjectDTO(**project_json)
        expected = geojson.loads(json.dumps(get_canned_json("2d_multi_polygon.json")))
        aoi_geojson = geojson.loads(json.dumps(project_dto.area_of_interest))

        # Act
        result = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=True)

        # Assert
        assert str(expected) == str(result)

    async def test_raises_InvalidGeoJson_when_geometry_is_linestring(self):
        # Arrange
        grid_json = get_canned_json("CHAI-Escuintla-West2.json")
        grid_dto = GridDTO(**grid_json)
        grid_dto.clip_to_aoi = True

        # Act / Assert
        with pytest.raises(InvalidGeoJson):
            GridService.merge_to_multi_polygon(grid_dto.area_of_interest, dissolve=True)

    async def test_cant_create_aoi_with_non_multipolygon_type(self):
        # Arrange
        bad_geom = geojson.Polygon(
            [[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 57.322)]]
        )
        bad_feature = geojson.Feature(geometry=bad_geom)

        # Act / Assert
        with pytest.raises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            GridService.merge_to_multi_polygon(
                geojson.dumps(bad_feature), dissolve=True
            )

    async def test_cant_create_aoi_with_invalid_multipolygon(self):
        # Arrange
        bad_multipolygon = geojson.MultiPolygon(
            [[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38)]]
        )
        bad_feature = geojson.Feature(geometry=bad_multipolygon)
        bad_feature_collection = geojson.FeatureCollection([bad_feature])

        # Act / Assert
        with pytest.raises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            GridService.merge_to_multi_polygon(
                geojson.dumps(bad_feature_collection), dissolve=True
            )

    async def test_to_shapely_geometries(self):
        # Arrange
        grid_json = get_canned_json("test_arbitrary.json")
        grid_dto = GridDTO.construct(**grid_json)  # Bypass required fields validation.
        grid_geojson = json.dumps(grid_dto.area_of_interest)

        # Act
        features = GridService._to_shapely_geometries(grid_geojson)

        # Assert
        assert len(features) > 0
