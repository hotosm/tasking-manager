from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    generate_encoded_token,
)
from backend.services.project_service import ProjectService


class TestValidateProjectFavouritedAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/favorite/"

    def test_returns_401_if_no_token(self):
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(401, response.status_code)

    def test_returns_404_if_project_does_not_exist(self):
        # Arrange
        url = "/api/v2/projects/999/favorite/"
        # Act
        response = self.client.get(
            url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(404, response.status_code)

    def test_returns_correct_favourite_status(self):
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(200, response.status_code)
        self.assertEqual({"favorited": False}, response.json)

        # Arrange
        ProjectService.favorite(self.test_project.id, self.test_author.id)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(200, response.status_code)
        self.assertEqual({"favorited": True}, response.json)


class SetProjectFavouriteAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/favorite/"

    def test_returns_401_if_no_token(self):
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(401, response.status_code)

    def test_returns_404_if_project_does_not_exist(self):
        # Arrange
        url = "/api/v2/projects/99999/favorite/"
        # Act
        response = self.client.post(
            url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(404, response.status_code)

    def test_returns_200_if_user_authenticated_and_project_exists(self):
        # Act
        response = self.client.post(
            self.url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(200, response.status_code)
        self.assertEqual(
            ProjectService.is_favorited(self.test_project.id, self.test_author.id), True
        )


class UnsetProjectFavouriteAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/favorite/"

    def test_returns_401_if_no_token(self):
        # Act
        response = self.client.delete(self.url)
        # Assert
        self.assertEqual(401, response.status_code)

    def test_returns_404_if_project_does_not_exist(self):
        # Arrange
        url = "/api/v2/projects/999999/favorite/"
        # Act
        response = self.client.delete(
            url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(404, response.status_code)

    def test_returns_400_on_not_favourited_projects(self):
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(400, response.status_code)

    def test_returns_200_if_project_unfavourited(self):
        # Arrange
        ProjectService.favorite(self.test_project.id, self.test_author.id)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_author_session_token}
        )
        # Assert
        self.assertEqual(200, response.status_code)
        self.assertEqual(
            ProjectService.is_favorited(self.test_project.id, self.test_author.id),
            False,
        )
