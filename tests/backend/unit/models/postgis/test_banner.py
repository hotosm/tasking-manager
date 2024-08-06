from unittest.mock import patch

from tests.backend.base import BaseTestCase
from backend.models.postgis.banner import Banner
from backend.models.dtos.banner_dto import BannerDTO


class TestBanner(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.message = "Test message"
        self.visible = True

    def create_banner(self):
        banner = Banner()
        banner.message = self.message
        banner.visible = self.visible

        banner.create()

    def test_create_banner(self):
        # Arrange
        self.create_banner()
        # Act
        banner = Banner.get()
        # Assert
        self.assertIsNotNone(banner)
        self.assertEqual(banner.message, self.message)
        self.assertTrue(banner.visible)

    @patch.object(Banner, "query")
    def test_get_banner_creates_one_if_none(self, mock_query):
        # Arrange
        mock_query.first.return_value = None
        # Act
        banner = Banner.get()
        # Assert
        self.assertIsNotNone(banner)
        self.assertEqual(banner.message, "Welcome to the API")
        self.assertTrue(banner.visible)

    def test_update_banner(self):
        # Arrange
        self.create_banner()

        banner_1 = Banner.get()
        banner_1.message = "Updated message"
        # Act
        banner_1.update()
        # Assert
        banner_2 = Banner.get()
        self.assertEqual(banner_1.message, banner_2.message)

    def test_update_banner_from_dto(self):
        # Arrange
        self.create_banner()
        # Act
        banner = Banner.get()
        banner_dto = BannerDTO()
        banner_dto.message = "Updated message"
        banner_dto.visible = False
        banner.update_from_dto(banner_dto)
        # Assert
        banner = Banner.get()
        self.assertEqual(banner.message, banner_dto.message)
        self.assertFalse(banner.visible)

    def test_as_dto(self):
        # Arrange
        self.create_banner()
        # Act
        banner = Banner.get()
        banner_dto = banner.as_dto()
        # Assert
        self.assertEqual(banner_dto.message, self.message)
        self.assertTrue(banner_dto.visible)

    def test_to_html(self):
        # Arrange
        self.create_banner()
        # Act
        banner = Banner.get()
        html = banner.to_html(f"### {self.message}")
        # Assert
        self.assertEqual(html, f"<h3>{self.message}</h3>")
