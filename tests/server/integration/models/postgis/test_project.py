import os
import unittest
import geojson
import json
from server import create_app
from server.models.dtos.project_dto import DraftProjectDTO
from server.models.postgis.project import Project, AreaOfInterest, Task, ProjectDTO, ProjectInfoDTO, ProjectStatus, ProjectPriority
from server.models.postgis.user import User

TEST_USER_ID = 7777777


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

        # Setup test user
        test_user = User()
        test_user.id = TEST_USER_ID
        test_user.username = 'Thinkwhere TEST'
        test_user.mapping_level = 1
        test_user.create()

        self.create_test_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        user = User().get_by_id(TEST_USER_ID)
        user.delete()
        self.ctx.pop()

    def test_project_can_be_persisted_to_db(self):
        if self.skip_tests:
            return

        # Checks that code we ran in setUp actually created a project in the DB
        self.assertIsNotNone(self.test_project.id, 'ID should be set if project successfully persisted')

    def test_task_can_generate_valid_feature_collection(self):
        if self.skip_tests:
            return

        # Act
        feature_collection = Task.get_tasks_as_geojson_feature_collection(self.test_project.id)

        # Assert
        self.assertIsInstance(feature_collection, geojson.FeatureCollection)
        self.assertEqual(1, len(feature_collection.features))

    def test_project_can_be_generated_as_dto(self):
        if self.skip_tests:
            return

        # Arrange
        self.update_project_with_info()

        # Act
        project_dto = self.test_project.as_dto_for_mapping('en')

        # Assert
        self.assertIsInstance(project_dto.area_of_interest, geojson.MultiPolygon)
        self.assertIsInstance(project_dto.tasks, geojson.FeatureCollection)
        # TODO test for project info
        # self.assertEqual(project_dto.project_name, 'Test')
        self.assertEqual(project_dto.project_id, self.test_project.id)

    def test_update_project_adds_project_info(self):
        if self.skip_tests:
            return

        # Act
        self.update_project_with_info()

        # Assert
        self.assertEqual(self.test_project.status, ProjectStatus.PUBLISHED.value)
        self.assertEqual(self.test_project.priority, ProjectPriority.MEDIUM.value)
        self.assertEqual(self.test_project.default_locale, 'en')
        self.assertEqual(self.test_project.project_info[0].name, 'Thinkwhere Test')

    def test_partial_translation_uses_default_trans_for_empty_fields(self):
        if self.skip_tests:
            return

        # Arrange
        self.update_project_with_info()

        locales = []
        test_info = ProjectInfoDTO()
        test_info.locale = 'it'
        locales.append(test_info)

        test_dto = ProjectDTO()
        test_dto.project_status = ProjectStatus.PUBLISHED.name
        test_dto.project_priority = ProjectPriority.MEDIUM.name
        test_dto.default_locale = 'en'
        test_dto.project_info_locales = locales
        test_dto.mapper_level = 'BEGINNER'

        # Act - Create empty italian translation
        self.test_project.update(test_dto)
        dto = self.test_project.as_dto_for_mapping('it')

        # Assert
        self.assertEqual(dto.project_info['name'], 'Thinkwhere Test',
                         'English translation should be returned as Italian name was not provided')

    def create_test_project(self):
        """ Helper function that creates a valid test project in the db """
        if self.skip_tests:
            return

        multipoly_geojson = json.loads('{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],'
                                       '[-4.0237, 56.0904]]]], "properties": {"x": 2402, "y": 1736, "zoom": 12},'
                                       '"type": "MultiPolygon"}')

        task_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
                                     '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},'
                                     '"properties": {"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

        test_aoi = AreaOfInterest(multipoly_geojson)

        test_project_dto = DraftProjectDTO()
        test_project_dto.project_name = 'Test'
        test_project_dto.user_id = TEST_USER_ID

        self.test_project = Project()
        self.test_project.create_draft_project(test_project_dto, test_aoi)
        self.test_project.tasks.append(Task.from_geojson_feature(1, task_feature))
        self.test_project.create()

    def update_project_with_info(self):

        locales = []
        test_info = ProjectInfoDTO()
        test_info.locale = 'en'
        test_info.name = 'Thinkwhere Test'
        test_info.description = 'Test Description'
        test_info.short_description = 'Short description'
        test_info.instructions = 'Instructions'
        locales.append(test_info)

        test_dto = ProjectDTO()
        test_dto.project_status = ProjectStatus.PUBLISHED.name
        test_dto.project_priority = ProjectPriority.MEDIUM.name
        test_dto.default_locale = 'en'
        test_dto.project_info_locales = locales
        test_dto.mapper_level = 'BEGINNER'

        self.test_project.update(test_dto)

