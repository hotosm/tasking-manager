import pytest

from backend.models.dtos.mapping_badge_dto import (
    MappingBadgeCreateDTO,
    MappingBadgeUpdateDTO,
)
from backend.models.dtos.mapping_level_dto import MappingLevelCreateDTO
from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.user import UserLevelVote, UserNextLevel
from backend.services.mapping_badges import MappingBadgeService

from tests.api.helpers.test_helpers import (
    get_or_create_levels,
    create_canned_user,
    return_canned_user,
)


@pytest.mark.anyio
class TestMappingBadgeService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        await get_or_create_levels(db_connection_fixture)
        request.cls.test_user = await create_canned_user(db_connection_fixture)
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
        assert len(badges.badges) == 3

    async def test_create(self):
        badge = MappingBadgeCreateDTO(
            name="new badge",
            description="",
            imagePath="",
            requirements='{"roads": 100}',
            isEnabled=True,
            isInternal=True,
        )
        # Act
        new_badge = await MappingBadgeService.create(badge, self.db)

        # Assert
        badges = await MappingBadgeService.get_all(self.db)

        assert len(badges.badges) == 3
        assert badges.badges[2].name == "new badge"
        assert new_badge.id == badges.badges[2].id
        assert new_badge.is_internal == badges.badges[2].is_internal

    async def test_create_validates_requirements(self):
        with pytest.raises(ValueError):
            MappingBadgeCreateDTO(
                name="new badge",
                description="",
                imagePath="",
                requirements="{}",
                isEnabled=True,
                isInternal=True,
            )

    async def test_update_validates_requirements(self):
        with pytest.raises(ValueError):
            MappingBadgeUpdateDTO(
                name="new badge",
                description="",
                imagePath="",
                requirements="{}",
                isEnabled=True,
                isInternal=True,
            )

    async def test_update(self):
        # Arrange
        old_data = MappingBadgeCreateDTO(
            name="old name",
            description="old description",
            imagePath="https://old.com/path.jpg",
            requirements='{"waterways":10}',
            isEnabled=True,
            isInternal=False,
        )
        badge = await MappingBadge.create(old_data, self.db)
        new_data = MappingBadgeUpdateDTO(
            id=badge.id,
            name="new name",
            description="new description",
            imagePath="https://new.com/path.jpg",
            requirements='{"buildings":10}',
            isEnabled=False,
        )
        level = await MappingLevel.create(MappingLevelCreateDTO(name="level"), self.db)
        voter = await create_canned_user(
            self.db, await return_canned_user(self.db, id=24934, username="foo")
        )
        await UserNextLevel.nominate(self.test_user.id, level.id, self.db)
        await UserLevelVote.vote(self.test_user.id, level.id, voter.id, self.db)

        # Act
        await MappingBadgeService.update(new_data, self.db)

        # Assert
        from_db = await MappingBadge.get_by_id(badge.id, self.db)

        assert from_db.name == new_data.name
        assert from_db.description == new_data.description
        assert from_db.image_path == new_data.image_path
        assert from_db.requirements == new_data.requirements
        assert from_db.is_enabled == new_data.is_enabled
        assert not (
            await UserNextLevel.is_nominated(self.test_user.id, level.id, self.db)
        )
        assert (await UserLevelVote.count(self.test_user.id, level.id, self.db)) == 0

    async def test_delete(self):
        # Arrange
        old_data = MappingBadgeCreateDTO(
            name="old name",
            description="old description",
            imagePath="https://old.com/path.jpg",
            requirements='{"roads": 10}',
            isEnabled=True,
        )
        badge = await MappingBadge.create(old_data, self.db)

        # Act
        await MappingBadgeService.delete(badge.id, self.db)

        # Assert
        assert await MappingBadge.get_by_id(badge.id, self.db) is None

    async def test_get_for_user(self):
        # Arrange
        assigned_badge_dto = MappingBadgeCreateDTO(
            name="assigned badge",
            description="",
            imagePath="",
            requirements='{"roads": 10}',
            isEnabled=True,
        )
        hidden_badge_dto = MappingBadgeCreateDTO(
            name="hidden badge",
            description="",
            imagePath="",
            requirements='{"roads": 10}',
            isEnabled=True,
            isInternal=True,
        )
        disabled_badge_dto = MappingBadgeCreateDTO(
            name="disabled badge",
            description="",
            imagePath="",
            requirements='{"roads": 10}',
            isEnabled=False,
            isInternal=False,
        )
        unassigned_badge_dto = MappingBadgeCreateDTO(
            name="unassigned badge",
            description="",
            imagePath="",
            requirements='{"roads": 10}',
            isEnabled=True,
        )
        assigned_badge = await MappingBadge.create(assigned_badge_dto, self.db)
        hidden_badge = await MappingBadge.create(hidden_badge_dto, self.db)
        disabled_badge = await MappingBadge.create(disabled_badge_dto, self.db)
        await MappingBadge.create(unassigned_badge_dto, self.db)

        # assign them
        await self.test_user.assign_badges(
            [
                assigned_badge.id,
                hidden_badge.id,
                disabled_badge.id,
            ],
            self.db,
        )

        # Act
        badges = await MappingBadgeService.get_for_user(self.test_user.id, self.db)

        # Assert
        assert len(badges.badges) == 1
        assert badges.badges[0].name == "assigned badge"
