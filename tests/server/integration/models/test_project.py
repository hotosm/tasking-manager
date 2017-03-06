import os
import unittest
import geojson
from server import create_app
from server.services.project_service import Project, AreaOfInterest, Task


class TestProject(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_project_can_be_persisted_to_db(self):
        if self.skip_tests:
            return

        # Arrange
        multipoly_geojson = '{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],' \
            '[-4.0237, 56.0904]]]], "properties": {"x": 2402, "y": 1736, "zoom": 12}, "type": "MultiPolygon"}'

        task_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
                                     '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},'
                                     '"properties": {"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

        test_aoi = AreaOfInterest(multipoly_geojson)
        test_project = Project('Test', test_aoi)
        test_project.tasks.append(Task(1, task_feature))

        test_project.create()
        self.assertIsNotNone(test_project.id, 'ID should be set if project successfully persisted')

        test_project.delete()  # Tidy up, by removing test project
