from backend.exceptions import NotFound
from backend.services.project_service import ProjectService
from backend.services.users.user_service import UserService
from tests.backend.helpers.test_helpers import create_canned_project
from tests.backend.base import BaseTestCase


class TestFavoriteService(BaseTestCase):
    def test_project_favorite(self):
        self.test_project, self.test_user = create_canned_project()

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
