import pytest

from backend.exceptions import Conflict
from backend.models.dtos.mapping_level_dto import (
    MappingLevelCreateDTO,
    MappingLevelUpdateDTO,
    AssociatedBadge,
)
from backend.models.dtos.mapping_badge_dto import MappingBadgeCreateDTO
from backend.models.postgis.mapping_level import MappingLevel
from backend.services.mapping_levels import MappingLevelService
from backend.services.mapping_badges import MappingBadgeService

from tests.api.helpers.test_helpers import (
    get_or_create_levels,
    create_canned_user,
)


@pytest.mark.anyio
class TestMappingLevelService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        await get_or_create_levels(db_connection_fixture)
        request.cls.test_user = await create_canned_user(db_connection_fixture)
        request.cls.db = db_connection_fixture

    async def test_as_dto(self):
        badge = await MappingBadgeService.create(
            MappingBadgeCreateDTO(
                name="a badge",
                description="...",
                imagePath="/",
                requirements='{"roads": 10}',
            ),
            self.db,
        )
        orig = MappingLevelCreateDTO(
            name="the name",
            imagePath="the path",
            approvalsRequired=5,
            color="green",
            isBeginner=True,
            requiredBadges=[AssociatedBadge(id=badge.id)],
        )
        # Arrange
        level = await MappingLevel.create(orig, self.db)
        dto = level.as_dto()

        # Assert
        assert dto.name == orig.name
        assert dto.approvals_required == orig.approvals_required
        assert dto.approvals_required == 5
        assert dto.color == orig.color
        assert dto.ordering == 4
        assert dto.is_beginner == orig.is_beginner
        assert dto.is_beginner == True

    async def test_get_all(self):
        # Act
        levels = await MappingLevelService.get_all(self.db)

        # Assert
        assert len(levels.levels) == 3
        assert levels.levels[0].name == "BEGINNER"
        assert levels.levels[1].name == "INTERMEDIATE"
        assert levels.levels[2].name == "ADVANCED"

    async def test_create(self):
        # Arrange
        badge = await MappingBadgeService.create(
            MappingBadgeCreateDTO(
                name="a badge",
                description="...",
                imagePath="/",
                requirements='{"roads": 10}',
            ),
            self.db,
        )
        level = MappingLevelCreateDTO(
            name="new level",
            requiredBadges=[AssociatedBadge(id=badge.id)],
        )

        # Act
        new_from_db = await MappingLevelService.create(level, self.db)

        # Assert
        assert new_from_db.name == level.name
        assert new_from_db.ordering == 4
        assert new_from_db.required_badges == [
            AssociatedBadge(id=badge.id, name="a badge")
        ]

    async def test_update(self):
        # Arrange
        badge1 = await MappingBadgeService.create(
            MappingBadgeCreateDTO(
                name="one",
                description="...",
                imagePath="/",
                requirements='{"roads": 10}',
            ),
            self.db,
        )
        badge2 = await MappingBadgeService.create(
            MappingBadgeCreateDTO(
                name="two",
                description="...",
                imagePath="/",
                requirements='{"roads": 10}',
            ),
            self.db,
        )
        old_data = MappingLevelCreateDTO(
            name="old name",
            imagePath="https://old.com/path.jpg",
            required_badges=[AssociatedBadge(id=badge1.id)],
        )
        level = await MappingLevel.create(old_data, self.db)
        new_data = MappingLevelUpdateDTO(
            id=level.id,
            name="new name",
            imagePath="https://new.com/path.jpg",
            approvalsRequired=10,
            color="#acabad",
            isBeginner=True,
            requiredBadges=[AssociatedBadge(id=badge2.id)],
        )

        # Act
        from_db = await MappingLevelService.update(new_data, self.db)

        # Assert
        assert from_db.name == new_data.name
        assert from_db.approvals_required == new_data.approvals_required
        assert from_db.approvals_required == 10
        assert from_db.color == new_data.color
        assert from_db.ordering == 4
        assert from_db.is_beginner == new_data.is_beginner
        assert from_db.is_beginner
        assert from_db.required_badges == [AssociatedBadge(id=badge2.id, name="two")]

    async def test_delete(self):
        # Arrange
        old_data = MappingLevelCreateDTO(
            name="old name",
            imagePath="https://old.com/path.jpg",
        )
        level = await MappingLevel.create(old_data, self.db)

        # Act
        await MappingLevelService.delete(level.id, self.db)

        assert await MappingLevel.get_by_id(level.id, self.db) is None

    async def test_delete_fails_if_user_is_assigneed(self):
        # Arrange
        old_data = MappingLevelCreateDTO(
            name="old name",
            imagePath="https://old.com/path.jpg",
        )
        level = await MappingLevel.create(old_data, self.db)
        await self.test_user.set_mapping_level(level, self.db)

        # Act
        with pytest.raises(Conflict) as e:
            await MappingLevelService.delete(level.id, self.db)

        assert e.value.sub_code == "MAPPING_LEVEL_HAS_USERS"
