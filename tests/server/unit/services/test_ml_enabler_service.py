import os
import unittest
from server.services.ml_enabler_service import MLEnablerService
from server import create_app


class TestMLEnablerServiceBase:
    aggregator = None
    bbox = "-86.3001904518,12.1460982787,-86.2963900131,12.1492471534"

    @unittest.skipIf(os.getenv("CI", "false") == "true", "skipping for CI")
    def test_get_all_models(self):
        json = MLEnablerService.get_all_models()
        self.assertEqual(type(json), list)

    @unittest.skipIf(os.getenv("CI", "false") == "true", "skipping for CI")
    def test_get_prediction_from_bbox(self):
        json = MLEnablerService.get_prediction_from_bbox(self.aggregator, self.bbox, 18)
        self.assertEqual(type(json), dict)


class TestMLEnablerServiceLookingGlass(unittest.TestCase, TestMLEnablerServiceBase):
    """Tests ml-enabler integration servivce with Looking Glass"""

    aggregator = "looking_glass"

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()


class TestMLEnablerServiceBuildingAPI(unittest.TestCase, TestMLEnablerServiceBase):
    """Tests ml-enabler integration servivce with building api"""

    aggregator = "building_api"

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()
