from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import get_canned_osm_user_json_details
from backend.services.users.osm_service import OSMService, OSMServiceError


class TestOsmService(BaseTestCase):
    def test_parse_osm_user_details_raises_error_if_user_not_found(self):
        # Arrange
        osm_response = get_canned_osm_user_json_details()
        # Act/Assert
        with self.assertRaises(OSMServiceError):
            OSMService._parse_osm_user_details_response(osm_response, "wont-find")

    def test_parse_osm_user_details_can_parse_valid_osm_response(self):
        # Arrange
        osm_response = get_canned_osm_user_json_details()
        # Act
        dto = OSMService._parse_osm_user_details_response(osm_response, "user")
        # Assert
        self.assertEqual(dto.account_created, "2017-01-23T16:23:22Z")
        self.assertEqual(dto.changeset_count, 16)
