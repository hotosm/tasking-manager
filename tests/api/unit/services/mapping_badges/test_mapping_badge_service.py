import pytest

from backend.models.dtos.mapping_badge_dto import (
    MappingBadgeCreateDTO,
    MappingBadgeUpdateDTO,
)
from backend.models.postgis.mapping_badge import MappingBadge
from backend.services.mapping_badges import MappingBadgeService

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
                name, description, requirements, is_enabled, is_internal
            )
            VALUES (:name, :description, :requirements, :is_enabled, :is_internal)
        """
        await self.db.execute(
            stmt,
            {
                "name": "BEGINNER",
                "description": "",
                "requirements": "{}",
                "is_enabled": True,
                "is_internal": False,
            },
        )

        # Act
        badges = await MappingBadgeService.get_all(self.db)

        # Assert
        assert len(badges.badges) == 1

    async def test_create(self):
        badge = MappingBadgeCreateDTO(
            name="new badge",
            description="",
            imagePath="",
            requirements="{}",
            isEnabled=True,
            isInternal=True,
        )
        # Act
        new_badge = await MappingBadgeService.create(badge, self.db)

        # Assert
        badges = await MappingBadgeService.get_all(self.db)

        assert len(badges.badges) == 1
        assert badges.badges[0].name == "new badge"
        assert new_badge.id == badges.badges[0].id
        assert new_badge.is_internal == badges.badges[0].is_internal

    async def test_update(self):
        # Arrange
        old_data = MappingBadgeCreateDTO(
            name="old name",
            description="old description",
            imagePath="https://old.com/path.jpg",
            requirements="{}",
            isEnabled=True,
            isInternal=False,
        )
        badge = await MappingBadge.create(old_data, self.db)
        new_data = MappingBadgeUpdateDTO(
            id=badge.id,
            name="new name",
            description="new description",
            imagePath="https://new.com/path.jpg",
            requirements="{}",
            isEnabled=False,
        )

        # Act
        await MappingBadgeService.update(new_data, self.db)

        # Assert
        from_db = await MappingBadge.get_by_id(badge.id, self.db)

        assert from_db.name == new_data.name
        assert from_db.description == new_data.description
        assert from_db.image_path == new_data.image_path
        assert from_db.requirements == new_data.requirements
        assert from_db.is_enabled == new_data.is_enabled

    async def test_delete(self):
        # Arrange
        old_data = MappingBadgeCreateDTO(
            name="old name",
            description="old description",
            imagePath="https://old.com/path.jpg",
            requirements="{}",
            isEnabled=True,
        )
        level = await MappingBadge.create(old_data, self.db)

        # Act
        await MappingBadgeService.delete(level.id, self.db)

        assert await MappingBadge.get_by_id(level.id, self.db) is None
