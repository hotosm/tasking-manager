import os
import unittest
from unittest.mock import patch


from server import create_app
from server.services.users.user_service import UserService, MappingLevel, User, OSMService, UserOSMDTO
from tests.server.helpers.test_helpers import create_canned_project
from server.models.postgis.message import Message


class TestAuthenticationService(unittest.TestCase):
    skip_tests = False
    test_user = None
    test_project = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('CI', 'false')

        # Firewall rules mean we can't hit Postgres from CI so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.test_project, self.test_user = create_canned_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.test_user.delete()
        self.ctx.pop()

    def test_upsert_inserts_project_if_not_exists(self):
        if self.skip_tests:
            return

        # Arrange
        UserService.upsert_mapped_projects(self.test_user.id, self.test_project.id)

        # Act
        projects = UserService.get_mapped_projects(self.test_user.username, 'en')

        # Assert
        mapped_project = projects.mapped_projects[0]
        self.assertEqual(mapped_project.project_id, self.test_project.id)  # We should find we've mapped the test project

    def test_set_level_adds_level_to_user(self):
        if self.skip_tests:
            return

        # Act
        user = UserService.set_user_mapping_level(self.test_user.username, MappingLevel.ADVANCED.name)

        # Assert
        self.assertEqual(MappingLevel(user.mapping_level), MappingLevel.ADVANCED)

    @patch.object(User, 'create')
    def test_user_can_register_with_correct_mapping_level(self, mock_user):
        # Act
        test_user = UserService().register_user(12, 'Thinkwhere', 300)

        # Assert
        self.assertEqual(test_user.mapping_level, MappingLevel.INTERMEDIATE.value)

    @patch.object(Message, 'save')
    @patch.object(User, 'save')
    @patch.object(OSMService, 'get_osm_details_for_user')
    @patch.object(UserService, 'get_user_by_id')
    def test_mapper_level_updates_correctly(self, mock_user, mock_osm, mock_save, mock_message):
        # Arrange
        test_user = User()
        test_user.username = 'Test User'
        test_user.mapping_level = MappingLevel.BEGINNER.value
        mock_user.return_value = test_user

        test_osm = UserOSMDTO()
        test_osm.changeset_count = 350
        mock_osm.return_value = test_osm

        # Act
        UserService.check_and_update_mapper_level(12)

        #Assert
        self.assertTrue(test_user.mapping_level, MappingLevel.INTERMEDIATE.value)
