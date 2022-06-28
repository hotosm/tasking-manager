from unittest.mock import patch
from backend.models.postgis.user import User
from backend.services.users.user_service import (
    UserService,
    UserServiceError,
    UserRole,
    NotFound,
)
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_user, return_canned_user


class TestUserService(BaseTestCase):
    def test_get_user_by_id_returns_user(self):
        # Arrange
        test_user = create_canned_user()
        # Act
        user = UserService.get_user_by_id(777777)
        # Assert
        self.assertEqual(user.username, test_user.username)

    def test_get_user_by_id_raises_error_if_user_not_found(self):
        # Act/Assert
        with self.assertRaises(NotFound):
            UserService.get_user_by_id(123456)

    def test_get_user_by_username_returns_user(self):
        # Arrange
        test_user = create_canned_user()
        # Act
        user = UserService.get_user_by_username(test_user.username)
        # Assert
        self.assertEqual(user.id, 777777)

    def test_get_user_by_username_raises_error_if_user_not_found(self):
        # Act/Assert
        with self.assertRaises(NotFound):
            UserService.get_user_by_username("Thinkwhere")

    def test_is_user_admin_returns_true_for_admin(self):
        # Arrange
        user = return_canned_user()
        user.role = UserRole.ADMIN.value
        user.create()

        # Act
        self.assertTrue(UserService.is_user_an_admin(user.id))

    def test_is_user_admin_returns_false_for_non_admin(self):
        # Arrange
        user = create_canned_user()
        # Act
        self.assertFalse(UserService.is_user_an_admin(user.id))

    @patch.object(UserService, "get_user_by_id")
    def test_mapper_role_is_not_recognized_as_a_validator(self, mock_user):
        # Arrange
        stub_user = User()
        stub_user.role = UserRole.MAPPER.value
        mock_user.return_value = stub_user

        # Act / Assert
        self.assertFalse(UserService.is_user_validator(123))

    @patch.object(UserService, "get_user_by_id")
    def test_admin_role_is_recognized_as_a_validator(self, mock_user):
        # Arrange
        stub_user = User()
        stub_user.role = UserRole.ADMIN.value
        mock_user.return_value = stub_user

        # Act / Assert
        self.assertTrue(UserService.is_user_validator(123))

    def test_unknown_role_raise_error_when_setting_role(self):
        # Act / Assert
        with self.assertRaises(UserServiceError):
            UserService.add_role_to_user(1, "test", "TEST")

    def test_unknown_level_raise_error_when_setting_level(self):
        # Act / Assert
        with self.assertRaises(UserServiceError):
            UserService.set_user_mapping_level("test", "TEST")
