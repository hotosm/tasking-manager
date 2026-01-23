import pytest
from pytest import raises

from backend.services.users.osm_service import OSMService, OSMServiceError


@pytest.mark.anyio
class TestOsmService:
    async def test_get_osm_details_for_user_raises_error_if_invalid_user_id(self):
        # Act / Assert
        with raises(OSMServiceError):
            await OSMService.get_osm_details_for_user("1xcf")

    async def test_get_osm_details_for_user_returns_user_details_if_valid_user_id(self):
        # Act
        dto = OSMService.get_osm_details_for_user(13526430)

        # Assert
        assert dto.account_created == "2021-06-10T01:27:18Z"
