import pytest
from backend.services.mapping_levels import MappingLevelService
from tests.api.helpers.test_helpers import get_or_create_levels


@pytest.mark.anyio
class TestMappingLevelService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        await get_or_create_levels(db_connection_fixture)
        request.cls.db = db_connection_fixture

    async def test_get_all(self):
        # Act
        levels = await MappingLevelService.get_all(self.db)

        # Assert
        assert len(levels) == 3
        assert levels[0].name == "BEGINNER"
        assert levels[1].name == "INTERMEDIATE"
        assert levels[2].name == "ADVANCED"
