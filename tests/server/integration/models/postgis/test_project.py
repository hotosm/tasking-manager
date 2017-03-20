import os
import unittest
import geojson
import json
from server import create_app
from server.services.project_service import Project, AreaOfInterest, Task
from tests.server.integration.helpers.test_helpers import create_test_project


class TestProject(unittest.TestCase):
    skip_tests = False
    test_project = None

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

        if self.skip_tests:
            return

        self.test_project = create_test_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.ctx.pop()

    def test_project_can_be_persisted_to_db(self):
        # Checks that code we ran in setUp actually created a project in the DB
        self.assertIsNotNone(self.test_project.id, 'ID should be set if project successfully persisted')

    def test_task_can_generate_valid_feature_collection(self):
        # Act
        feature_collection = Task.get_tasks_as_geojson_feature_collection(self.test_project.id)

        # Assert
        self.assertIsInstance(feature_collection, geojson.FeatureCollection)
        self.assertEqual(1, len(feature_collection.features))

    def test_project_can_be_generated_as_dto(self):
        # Act
        project_dto = Project().as_dto_for_mapper(self.test_project.id, 'en')

        # Assert
        self.assertIsInstance(project_dto.area_of_interest, geojson.MultiPolygon)
        self.assertIsInstance(project_dto.tasks, geojson.FeatureCollection)
        # TODO test for project info
        # self.assertEqual(project_dto.project_name, 'Test')
        self.assertEqual(project_dto.project_id, self.test_project.id)
