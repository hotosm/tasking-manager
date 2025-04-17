import pytest
from backend.services.users.osm_service import OSMService, OSMServiceError
from tests.backend.helpers.test_helpers import get_canned_osm_user_json_details


class TestOsmService:
    def test_parse_osm_user_details_raises_error_if_user_not_found(self):
        # Arrange
        osm_response = get_canned_osm_user_json_details()

        # Act & Assert
        with pytest.raises(OSMServiceError):
            OSMService._parse_osm_user_details_response(osm_response, "wont-find")

    def test_parse_osm_user_details_can_parse_valid_osm_response(self):
        # Arrange
        osm_response = get_canned_osm_user_json_details()

        # Act
        dto = OSMService._parse_osm_user_details_response(osm_response, "user")

        # Assert
        assert dto.account_created == "2017-01-23T16:23:22Z"
        assert dto.changeset_count == 16
