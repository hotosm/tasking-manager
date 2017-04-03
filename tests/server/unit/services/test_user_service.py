import unittest
from unittest.mock import patch
from server.services.user_service import UserService, UserServiceError, User, UserRole
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

    def test_user_service_raise_error_if_user_element_not_found(self):
        # Arrange
        osm_response = get_canned_simplified_osm_user_details()

        # Act / Assert
        with self.assertRaises(UserServiceError):
            UserService._parse_osm_user_details_response(osm_response, 'wont-find')

    @patch.object(User, 'get_by_id')
    def test_mapper_role_is_not_recognized_as_a_validator(self, mock_user):
        # Arrange
        stub_user = User()
        stub_user.role = UserRole.MAPPER.value
        mock_user.return_value = stub_user

        # Act / Assert
        self.assertFalse(UserService.is_user_validator(123))

    @patch.object(User, 'get_by_id')
    def test_admin_role_is_recognized_as_a_validator(self, mock_user):
        # Arrange
        stub_user = User()
        stub_user.role = UserRole.ADMIN.value
        mock_user.return_value = stub_user

        # Act / Assert
        self.assertTrue(UserService.is_user_validator(123))
