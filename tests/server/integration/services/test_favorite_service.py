import os
import unittest
from server import create_app
from server.models.postgis.utils import NotFound
from server.services.project_service import ProjectService
from server.services.users.user_service import UserService
from tests.server.helpers.test_helpers import create_canned_project


class TestFavoriteService(unittest.TestCase):
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

        self.test_project, self.test_user = create_canned_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.test_user.delete()
        self.ctx.pop()

    def test_project_favorite(self):
        if self.skip_tests:
            return
        # Validate that project has not been favorited by user.
        fav = ProjectService.is_favorited(self.test_project.id, self.test_user.id)
        self.assertFalse(fav)

        # Get project favorites from user.
        favorites = UserService.get_projects_favorited(self.test_user.id)
        json_data = favorites.to_primitive()
        self.assertEqual(len(json_data["favoritedProjects"]), 0)

        # Now favorite a new project.
        ProjectService.favorite(self.test_project.id, self.test_user.id)
        fav = ProjectService.is_favorited(self.test_project.id, self.test_user.id)
        self.assertTrue(fav)

        # Get project favorites from user.
        favorites = UserService.get_projects_favorited(self.test_user.id)
        json_data = favorites.to_primitive()
        self.assertEqual(len(json_data["favoritedProjects"]), 1)

        # Now unfavorite it.
        ProjectService.unfavorite(self.test_project.id, self.test_user.id)
        fav = ProjectService.is_favorited(self.test_project.id, self.test_user.id)
        self.assertFalse(fav)

        # Unfavorite a project not been favorited previously.
        with self.assertRaises(ValueError):
            ProjectService.unfavorite(self.test_project.id, self.test_user.id)

        # Verify that NotFound exists.
        with self.assertRaises(NotFound):
            ProjectService.is_favorited(100, self.test_user.id)
            ProjectService.favorite(100, self.test_user.id)
            ProjectService.unfavorite(100, self.test_user.id)
