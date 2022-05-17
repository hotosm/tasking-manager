from tests.backend.base import BaseTestCase
from backend.models.postgis.user import User, UserRole, MappingLevel


class TestUser(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = User()
        self.test_user.role = UserRole.MAPPER.value
        self.test_user.id = 12
        self.test_user.mapping_level = MappingLevel.BEGINNER.value
        self.test_user.username = "Thinkwhere Test"
        self.test_user.email_address = "thinkwheretest@test.com"

    def test_create_user(self):
        # Act
        self.test_user.create()
        # Assert
        self.assertEqual(self.test_user, User.get_by_id(12))

    def test_update_username(self):
        # Act
        self.test_user.update_username("mrtest")
        # Assert
        self.assertEqual(self.test_user.username, "mrtest")

    def test_update_picture_url(self):
        # Arrange
        test_picture_url = (
            "https://cdn.pixabay.com/photo/2022/04/29/08/50/desert-7162926_1280.jpg"
        )
        # Act
        self.test_user.update_picture_url(test_picture_url)
        # Assert
        self.assertEqual(self.test_user.picture_url, test_picture_url)
