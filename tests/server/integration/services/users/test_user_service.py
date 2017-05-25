import os
import unittest

from server import create_app
from server.services.users.user_service import UserService, MappingLevel
from tests.server.helpers.test_helpers import create_canned_project


class TestAuthenticationService(unittest.TestCase):
    skip_tests = False
    test_user = None
    test_project = None

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
