import unittest
from unittest.mock import patch
from server.models.postgis.user import User
from server.services.users.user_service import UserService, UserServiceError, UserRole, OSMService, MappingLevel, UserOSMDTO
from server.models.postgis.project import Project


class TestUserService(unittest.TestCase):

    @patch.object(UserService, 'get_user_by_id')
    def test_user_correctly_identified_as_pm(self, mock_user):
        # Arrange
        test_proj = Project()
        test_user = User()
        test_user.role = UserRole.PROJECT_MANAGER.value

        mock_user.return_value = test_user

        # Act / Assert
        self.assertTrue(UserService.is_user_a_project_manager(123))
        self.assertTrue(test_proj)

    @patch.object(UserService, 'get_user_by_id')
    def test_user_not_identified_as_pm(self, mock_user):
        # Arrange
        test_user = User()
        test_user.role = UserRole.MAPPER.value

        mock_user.return_value = test_user

        # Act / Assert
        self.assertFalse(UserService.is_user_a_project_manager(123))

    @patch.object(UserService, 'get_user_by_id')
    def test_mapper_role_is_not_recognized_as_a_validator(self, mock_user):
        # Arrange
        stub_user = User()
        stub_user.role = UserRole.MAPPER.value
        mock_user.return_value = stub_user

        # Act / Assert
        self.assertFalse(UserService.is_user_validator(123))

    @patch.object(UserService, 'get_user_by_id')
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
            UserService.add_role_to_user(1, 'test', 'TEST')

    @patch.object(UserService, 'get_user_by_id')
    def test_pm_not_allowed_to_add_admin_role_when_setting_role(self, mock_admin):
        # Arrange
        admin = User()
        admin.role = UserRole.PROJECT_MANAGER.value
        mock_admin.return_value = admin

        # Act
        with self.assertRaises(UserServiceError):
            UserService.add_role_to_user(1, 'test', 'ADMIN')

    def test_unknown_level_raise_error_when_setting_level(self):
        # Act / Assert
        with self.assertRaises(UserServiceError):
            UserService.set_user_mapping_level('test', 'TEST')
