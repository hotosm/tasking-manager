import pytest

from backend.exceptions import Conflict
from backend.models.dtos.mapping_level_dto import (
    MappingLevelCreateDTO,
    MappingLevelUpdateDTO,
)
from backend.models.postgis.mapping_level import MappingLevel
from backend.services.mapping_levels import MappingLevelService

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
        orig = MappingLevelCreateDTO(
            name="the name",
            imagePath="the path",
            approvalsRequired=5,
            color="green",
            ordering=4,
            isBeginner=True,
        )
        # Arrange
        level = await MappingLevel.create(orig, self.db)
        dto = level.as_dto()

        # Assert
        assert dto.name == orig.name
        assert dto.image_path == orig.image_path
        assert dto.image_path == "the path"
        assert dto.approvals_required == orig.approvals_required
        assert dto.approvals_required == 5
        assert dto.color == orig.color
        assert dto.ordering == orig.ordering
        assert dto.is_beginner == orig.is_beginner
        assert dto.is_beginner == True

    async def test_get_all(self):
        # Act
        levels = await MappingLevelService.get_all(self.db)

        # Assert
        assert len(levels) == 3
        assert levels[0].name == "BEGINNER"
        assert levels[1].name == "INTERMEDIATE"
        assert levels[2].name == "ADVANCED"

    async def test_create(self):
        # Arrange
        level = MappingLevelCreateDTO(
            name="new level",
            image_path="",
            ordering=4,
        )

        # Act
        new_level = await MappingLevelService.create(level, self.db)

        # Assert
        new_from_db = await MappingLevelService.get_by_id(new_level.id, self.db)

        assert new_from_db.name == new_level.name
        assert new_from_db.ordering == new_level.ordering

    async def test_update(self):
        # Arrange
        old_data = MappingLevelCreateDTO(
            name="old name",
            imagePath="https://old.com/path.jpg",
            ordering=1,
        )
        level = await MappingLevel.create(old_data, self.db)
        new_data = MappingLevelUpdateDTO(
            id=level.id,
            name="new name",
            imagePath="https://new.com/path.jpg",
            approvalsRequired=10,
            color="#acabad",
            ordering=2,
            isBeginner=True,
        )

        # Act
        await MappingLevelService.update(new_data, self.db)

        # Assert
        from_db = await MappingLevel.get_by_id(level.id, self.db)

        assert from_db.name == new_data.name
        assert from_db.image_path == new_data.image_path
        assert from_db.image_path == "https://new.com/path.jpg"
        assert from_db.approvals_required == new_data.approvals_required
        assert from_db.approvals_required == 10
        assert from_db.color == new_data.color
        assert from_db.ordering == new_data.ordering
        assert from_db.is_beginner == new_data.is_beginner
        assert from_db.is_beginner

    async def test_delete(self):
        # Arrange
        old_data = MappingLevelCreateDTO(
            name="old name",
            imagePath="https://old.com/path.jpg",
            ordering=1,
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
            ordering=1,
        )
        level = await MappingLevel.create(old_data, self.db)
        await self.test_user.set_mapping_level(level, self.db)

        # Act
        with pytest.raises(Conflict) as e:
            await MappingLevelService.delete(level.id, self.db)

        assert e.value.sub_code == "MAPPING_LEVEL_HAS_USERS"
