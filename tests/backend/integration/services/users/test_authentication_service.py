import os
import unittest

from backend import create_app
from backend.services.users.authentication_service import AuthenticationService
from tests.backend.helpers.test_helpers import (
    get_canned_osm_user_details,
    get_canned_osm_user_details_changed_name,
)


class TestAuthenticationService(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv("CI", "false")

        # Firewall rules mean we can't hit Postgres from CI so we have to skip them in the CI build
        if env == "true":
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

    def test_unknown_user_creates_user_in_db(self):
        if self.skip_tests:
            return

        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        params = AuthenticationService().login_user(osm_response, None)

        self.assertEqual(params["username"], "Thinkwhere Test")
        self.assertTrue(params["session_token"])

    def test_existing_user_changed_name(self):
        if self.skip_tests:
            return

        # Arrange
        osm_response = get_canned_osm_user_details_changed_name()

        # Act
        params = AuthenticationService().login_user(osm_response, None)

        self.assertEqual(params["username"], "Thinkwhere Test Changed")
        self.assertTrue(params["session_token"])
