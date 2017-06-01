import unittest
from unittest.mock import patch

from server.services.users.user_service import UserService, UserServiceError, User, UserRole, MappingLevel
from tests.server.helpers.test_helpers import get_canned_simplified_osm_user_details


class TestUserService(unittest.TestCase):

    def test_user_service_can_parse_oms_user_details_xml(self):
        # Arrange
        osm_response = get_canned_simplified_osm_user_details()

        # Act
        dto = UserService._parse_osm_user_details_response(osm_response)

        # Assert
        self.assertEqual(dto.account_created, '2015-05-14T18:10:16Z')
        self.assertEqual(dto.changeset_count, 16)

    @patch.object(UserService, 'get_user_by_id')
    def test_user_correctly_identified_as_pm(self, mock_user):
        # Arrange
        test_user = User()
        test_user.role = UserRole.PROJECT_MANAGER.value

        mock_user.return_value = test_user

        # Act / Assert
        self.assertTrue(UserService.is_user_a_project_manager(123))

    @patch.object(UserService, 'get_user_by_id')
    def test_user_not_identified_as_pm(self, mock_user):
        # Arrange
        test_user = User()
        test_user.role = UserRole.MAPPER.value

        mock_user.return_value = test_user

        # Act / Assert
        self.assertFalse(UserService.is_user_a_project_manager(123))

    def test_user_service_raise_error_if_user_element_not_found(self):
        # Arrange
        osm_response = get_canned_simplified_osm_user_details()

        # Act / Assert
        with self.assertRaises(UserServiceError):
            UserService._parse_osm_user_details_response(osm_response, 'wont-find')

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
