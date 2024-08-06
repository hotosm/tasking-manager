from tests.backend.base import BaseTestCase
from backend.services.users.osm_service import OSMService, OSMServiceError


class TestOsmService(BaseTestCase):
    def test_get_osm_details_for_user_raises_error_if_invalid_user_id(self):
        # Act/Assert
        with self.assertRaises(OSMServiceError):
            OSMService.get_osm_details_for_user("1xcf")

    def test_get_osm_details_for_user_returns_user_details_if_valid_user_id(self):
        # Act
        dto = OSMService.get_osm_details_for_user(13526430)
        # Assert
        self.assertEqual(dto.account_created, "2021-06-10T01:27:18Z")
