import unittest
from server.services.users.osm_service import OSMService, OSMServiceError

from tests.server.helpers.test_helpers import get_canned_simplified_osm_user_details


class TestOSMService(unittest.TestCase):

    def test_osm_service_can_parse_oms_user_details_xml(self):
        # Arrange
        osm_response = get_canned_simplified_osm_user_details()

        # Act
        dto = OSMService._parse_osm_user_details_response(osm_response)

        # Assert
        self.assertEqual(dto.account_created, '2015-05-14T18:10:16Z')
        self.assertEqual(dto.changeset_count, 16)

    def test_osm_service_raise_error_if_user_element_not_found(self):
        # Arrange
        osm_response = get_canned_simplified_osm_user_details()

        # Act / Assert
        with self.assertRaises(OSMServiceError):
            OSMService._parse_osm_user_details_response(osm_response, 'wont-find')
