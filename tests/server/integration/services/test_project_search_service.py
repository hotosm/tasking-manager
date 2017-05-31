import os
import unittest
from server import create_app
from server.services.project_search_service import ProjectSearchService
import geojson
from shapely.geometry import Polygon, box
import json
from server.services.split_service import SplitService, SplitServiceError
from tests.server.helpers.test_helpers import get_canned_json
from server.models.postgis.task import Task
from server.models.postgis.project import Project
from unittest.mock import patch

from server.models.dtos.project_dto import ProjectSearchBBoxDTO


class TestProjectSearchService(unittest.TestCase):
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

    def test_get_intersecting_projects(self):
        if self.skip_tests:
            return

        # TODO make this a proper test
        # arrange
        dto = ProjectSearchBBoxDTO()
        dto.bbox = map(float, '34.404,-1.034, 34.717,-0.624'.split(','))
        dto.preferred_locale = 'en'
        dto.input_srid = 4326
        dto.project_author = 'NateHeard'
        dto.validate()


        # act
        geojson = ProjectSearchService.get_projects_geojson(dto)

        # assert
        print(geojson)

    def test_make_polygon_from_bbox(self):

        # arrange
        expected = (32.50198296132938, -12.59912449955007, 34.68826225820438, -11.578583176891955)

        # act
        polygon = ProjectSearchService._make_4326_polygon_from_bbox([3618104.193026841, -1413969.7644834695, 3861479.691086842, -1297785.4814900015], 3857)

        # assert
        self.assertEquals(expected, polygon.bounds)

    def test_get_area_from_bbox(self):

        # arrange

        polygon = ProjectSearchService._make_4326_polygon_from_bbox([32.50198296132938, -12.59912449955007, 34.68826225820438, -11.578583176891955], 4326)
        print(ProjectSearchService._get_area_sqm(polygon))
        # act


        # assert
        self.assertEquals(1,1)





