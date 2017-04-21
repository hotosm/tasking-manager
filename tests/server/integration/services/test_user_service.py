import os
import unittest
from server import create_app
from server.services.user_service import UserService
from tests.server.helpers.test_helpers import create_canned_project


class TestAuthenticationService(unittest.TestCase):
    skip_tests = False
    test_user = None

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
        # Arrange
        UserService.upsert_mapped_projects(self.test_user.id, 1)

        # Act
        projects = UserService.get_mapped_projects(self.test_user.id, 'en')

        iain = projects

