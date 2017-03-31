import unittest
from server.services.user_service import UserService, UserServiceError
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
