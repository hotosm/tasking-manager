import pytest
from backend.services.mapping_badges import MappingBadgeService
from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.dtos.mapping_badge_dto import MappingBadgeCreateDTO
from tests.api.helpers.test_helpers import get_or_create_levels


@pytest.mark.anyio
class TestMappingBadgeService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        await get_or_create_levels(db_connection_fixture)
        request.cls.db = db_connection_fixture

    async def test_get_all(self):
        # Arrange
        stmt = """
            INSERT INTO mapping_badges (
                name, description, requirements, is_enabled
            )
            VALUES (:name, :description, :requirements, :is_enabled)
        """
        await self.db.execute(stmt, {
            "name": "BEGINNER",
            "description": "",
            "requirements": "{}",
            "is_enabled": True,
        })

        # Act
        badges = await MappingBadgeService.get_all(self.db)

        # Assert
        assert len(badges) == 1

    async def test_create(self):
        badge = MappingBadgeCreateDTO(
            name='new badge',
            description='',
            image_path='',
            requirements='{}',
            is_enabled=True,
        )
        # Act
        new_badge = await MappingBadgeService.create(badge, self.db)

        # Assert
        badges = await MappingBadgeService.get_all(self.db)

        assert len(badges) == 1
        assert badges[0].name == 'new badge'
        assert new_badge.id == badges[0].id
