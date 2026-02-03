import json
import pytest
from backend.services.project_search_service import ProjectSearchService
from backend.services.users.user_service import UserService
from backend.models.postgis.project import ProjectInfo, Project
from backend.models.dtos.project_dto import ProjectSearchBBoxDTO
from backend.models.postgis.user import User
from tests.backend.helpers.test_helpers import get_canned_json
from unittest.mock import patch, MagicMock, AsyncMock
from shapely.geometry import Polygon, box
import shapely.wkt


@pytest.mark.anyio
class TestProjectSearchService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

    @patch.object(ProjectSearchService, "_make_4326_polygon_from_bbox")
    @patch.object(ProjectSearchService, "validate_bbox_area")
    @patch.object(UserService, "get_user_by_username", new_callable=AsyncMock)
    @patch.object(
        ProjectSearchService, "_get_intersecting_projects", new_callable=AsyncMock
    )
    @patch.object(ProjectInfo, "get_dto_for_locale", new_callable=AsyncMock)
    async def test_get_intersecting_projects(
        self,
        get_dto_for_locale,
        _get_intersecting_projects,
        get_user_by_username,
        validate_bbox_area,
        _make_4326_polygon_from_bbox,
    ):
        # arrange _make_4326_polygon_from_bbox mock
        _make_4326_polygon_from_bbox.return_value = Polygon(
            [
                (34.68826225820438, -12.59912449955007),
                (34.68826225820438, -11.57858317689196),
                (32.50198296132938, -11.57858317689196),
                (32.50198296132938, -12.59912449955007),
                (34.68826225820438, -12.59912449955007),
            ]
        )
        # arrange validate_bbox_area mock
        validate_bbox_area.return_value = True
        # arrange get_user_by_username mock
        get_user_by_username.return_value = User(id=3488526)
        # arrange _get_intersecting_projects mock
        polygon = json.dumps(get_canned_json("search_bbox_feature.json"))
        project = Project(id=2274, status=0, default_locale="en", geometry=polygon)
        projects = [project]
        _get_intersecting_projects.return_value = projects
        # arrange get_dto_for_locale mock
        get_dto_for_locale.return_value = ProjectInfo(name="PEPFAR Kenya: Homa Bay")
        # arrange dto
        dto = ProjectSearchBBoxDTO(
            bbox=list(map(float, "34.404,-1.034,34.717,-0.624".split(","))),
            preferred_locale="en",
            input_srid=4326,
            project_author=3488526,
        )
        # arrange expected result
        expected = get_canned_json("search_bbox_result.json")
        # act
        result = await ProjectSearchService.get_projects_geojson(dto, db=self.db)

        # assert
        def assert_dict_approx_equal(d1, d2, abs_tol=1e-6):
            if isinstance(d1, dict) and isinstance(d2, dict):
                assert d1.keys() == d2.keys()
                for k in d1:
                    assert_dict_approx_equal(d1[k], d2[k], abs_tol=abs_tol)
            elif isinstance(d1, list) and isinstance(d2, list):
                assert len(d1) == len(d2)
                for a, b in zip(d1, d2):
                    assert_dict_approx_equal(a, b, abs_tol=abs_tol)
            elif isinstance(d1, float) and isinstance(d2, float):
                assert d1 == pytest.approx(d2, abs=abs_tol)
            else:
                assert d1 == d2

        assert_dict_approx_equal(result, expected)

    @patch("geoalchemy2.shape.to_shape")
    @patch("geoalchemy2.shape.from_shape")
    async def test_make_polygon_from_3857_bbox(self, mock_from_shape, mock_to_shape):
        # arrange
        bbox = [
            3618104.193026841,
            -1413969.7644834695,
            3861479.691086842,
            -1297785.4814900015,
        ]
        srid = 3857
        expected = (
            32.50198296132938,
            -12.59912449955007,
            34.68826225820438,
            -11.578583176891955,
        )
        # Mock from_shape to return a mock with wkt
        mock_geometry = MagicMock()
        mock_geometry.wkt = shapely.wkt.dumps(box(bbox[0], bbox[1], bbox[2], bbox[3]))
        mock_from_shape.return_value = mock_geometry
        # Mock the db.fetch_one
        with patch.object(self.db, "fetch_one") as mock_fetch_one:
            mock_geom = MagicMock()
            mock_to_shape.return_value = Polygon(
                [
                    (expected[0], expected[1]),
                    (expected[0], expected[3]),
                    (expected[2], expected[3]),
                    (expected[2], expected[1]),
                    (expected[0], expected[1]),
                ]
            )
            mock_fetch_one.return_value = {"geom_4326": mock_geom}
            # act
            polygon = await ProjectSearchService._make_4326_polygon_from_bbox(
                bbox,
                srid,
                db=self.db,
            )
            # assert
            for expected_val, actual_val in zip(expected, polygon.bounds):
                assert actual_val == pytest.approx(expected_val, abs=1e-10)

    async def test_get_area_from_3857_bbox(self):
        # polygon = await ProjectSearchService._make_4326_polygon_from_bbox(
        #     [3618104.193026841, -1413969.7644834695, 3861479.691086842, -1297785.4814900015], 3857, db=self.db)
        polygon = Polygon(
            [
                (34.68826225820438, -12.59912449955007),
                (34.68826225820438, -11.57858317689196),
                (32.50198296132938, -11.57858317689196),
                (32.50198296132938, -12.59912449955007),
                (34.68826225820438, -12.59912449955007),
            ]
        )
        # act
        area = await ProjectSearchService._get_area_sqm(polygon, db=self.db)
        # assert
        assert area == pytest.approx(28276407740.2797, abs=1e-3)
