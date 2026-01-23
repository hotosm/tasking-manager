from backend.models.postgis.mapping_badge import MappingBadge
import pytest
from unittest.mock import patch, AsyncMock

from backend.services.users.user_service import (
    UserService,
    MappingLevel,
    User,
)
from tests.api.helpers.test_helpers import (
    create_canned_user,
    return_canned_user,
    create_mapping_levels,
)


@pytest.mark.anyio
class TestUserService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        await create_mapping_levels(self.db)

        # Create a default user used by multiple tests
        canned = await return_canned_user(
            username="New Thinkwhere TEST",
            id=7777777,
            db=self.db,
        )
        self.test_user = await create_canned_user(self.db, canned)

    async def test_set_level_adds_level_to_user(self):
        # Act
        user = await UserService.set_user_mapping_level(
            self.test_user.username,
            "ADVANCED",
            db=self.db,
        )

        user = await UserService.get_user_by_id(
            self.test_user.id,
            db=self.db,
        )
        # Assert
        assert user.mapping_level == 3

    async def test_user_can_register_with_correct_mapping_level(self):
        # Act
        test_user = await UserService.register_user(
            12,
            "Thinkwhere",
            300,
            "some_picture_url",
            None,
            db=self.db,
        )

        # Assert
        assert test_user.mapping_level == 1  # Beginner mapping level

    @patch.object(UserService, "notify_level_upgrade", new_callable=AsyncMock)
    @patch.object(MappingLevel, "all_badges_satisfied", new_callable=AsyncMock)
    @patch.object(MappingLevel, "get_next", new_callable=AsyncMock)
    @patch.object(MappingBadge, "available_badges_for_user", new_callable=AsyncMock)
    @patch.object(UserService, "get_and_save_stats", new_callable=AsyncMock)
    @patch.object(MappingLevel, "get_by_id", new_callable=AsyncMock)
    @patch.object(UserService, "get_user_by_id", new_callable=AsyncMock)
    async def test_mapper_level_updates_correctly(
        self,
        mock_user_get,
        mock_get_by_id,
        mock_get_stats,
        mock_available_badges,
        mock_get_next,
        mock_all_badges_satisfied,
        mock_notify,
    ):
        # ---------- Arrange ----------
        user = User()
        user.id = 12
        user.username = "Test User"
        user.mapping_level = 1  # BEGINNER

        user.assign_badges = AsyncMock()
        user.set_mapping_level = AsyncMock()

        mock_user_get.return_value = user

        beginner = AsyncMock()
        beginner.id = 1
        beginner.ordering = 1

        intermediate = AsyncMock()
        intermediate.id = 2
        intermediate.name = "INTERMEDIATE"
        intermediate.ordering = 2
        intermediate.approvals_required = 0

        mock_get_by_id.return_value = beginner
        mock_get_next.return_value = intermediate
        mock_all_badges_satisfied.return_value = True

        mock_get_stats.return_value = {"changeset_count": 350}
        mock_available_badges.return_value = []  # no blocking badges

        await UserService.check_and_update_mapper_level(12, db=self.db)

        user.set_mapping_level.assert_awaited_once_with(intermediate, self.db)
        mock_notify.assert_awaited_once_with(12, "Test User", "INTERMEDIATE", self.db)

    async def test_update_user_updates_user_details(self):
        # Act
        await UserService.update_user(
            self.test_user.id,
            "Thinkwhere",
            None,
            db=self.db,
        )

        # Assert
        user = await UserService.get_user_by_id(
            self.test_user.id,
            db=self.db,
        )
        assert user.username == "Thinkwhere"

    async def test_register_user_creates_new_user(self):
        # Arrange
        canned = await return_canned_user(db=self.db)

        # Act
        await UserService.register_user(
            canned.id,
            canned.username,
            251,
            None,
            None,
            db=self.db,
        )

        # Assert
        user = await UserService.get_user_by_id(canned.id, db=self.db)
        assert user.username == canned.username
        assert user.mapping_level == 1
