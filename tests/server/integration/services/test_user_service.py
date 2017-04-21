import os
import unittest
from unittest.mock import patch
from server import create_app
from server.services.mapping_service import MappingService, Task
from tests.server.helpers.test_helpers import create_canned_project


class TestAuthenticationService(unittest.TestCase):
    skip_tests = False
    test_project = None
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

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.test_user.delete()
        self.ctx.pop()