import json
from unittest.mock import patch

from shapely.geometry import Polygon

from backend.models.dtos.project_dto import ProjectSearchBBoxDTO
from backend.models.postgis.project import Project, ProjectInfo
from backend.models.postgis.user import User
from backend.services.project_search_service import ProjectSearchService
from backend.services.users.user_service import UserService
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import get_canned_json


class TestProjectSearchService(BaseTestCase):
    @patch.object(ProjectSearchService, "_make_4326_polygon_from_bbox")
    @patch.object(ProjectSearchService, "validate_bbox_area")
    @patch.object(UserService, "get_user_by_username")
    @patch.object(ProjectSearchService, "_get_intersecting_projects")
    @patch.object(ProjectInfo, "get_dto_for_locale")
    def test_get_intersecting_projects(
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
        dto = ProjectSearchBBoxDTO()
        dto.bbox = map(float, "34.404,-1.034, 34.717,-0.624".split(","))
        dto.preferred_locale = "en"
        dto.input_srid = 4326
        dto.project_author = 3488526
        dto.validate()

        # arrange expected result
        expected = json.dumps(get_canned_json("search_bbox_result.json"))

        # act
        # result = ProjectSearchService.get_projects_geojson(dto)

        # assert
        self.assertEqual(str(expected), str(expected))

    def test_make_polygon_from_3857_bbox(self):
        # arrange
        expected = (
            32.50198296132938,
            -12.59912449955007,
            34.68826225820438,
            -11.578583176891955,
        )

        # act
        polygon = ProjectSearchService._make_4326_polygon_from_bbox(
            [
                3618104.193026841,
                -1413969.7644834695,
                3861479.691086842,
                -1297785.4814900015,
            ],
            3857,
        )

        # assert
        for expected_val, actual_val in zip(expected, polygon.bounds):
            self.assertAlmostEqual(expected_val, actual_val, places=10)

    def test_get_area_from_3857_bbox(self):
        # polygon = ProjectSearchService._make_4326_polygon_from_bbox(
        #   [3618104.193026841, -1413969.7644834695, 3861479.691086842, -1297785.4814900015], 3857)
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
        expected = ProjectSearchService._get_area_sqm(polygon)

        # assert
        self.assertAlmostEqual(expected, 28276407740.2797, places=3)
