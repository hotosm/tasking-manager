from unittest.mock import AsyncMock, patch, MagicMock

import requests
import pytest
from backend.services.users.user_service import (
    NotFound,
    UserRole,
    UserService,
    UserServiceError,
)
from tests.api.helpers.test_helpers import create_canned_user
from backend.models.postgis.user import (
    User,
    UserNextLevel,
    UserStats,
    UserLevelVote,
)
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.dtos.mapping_level_dto import MappingLevelCreateDTO


@pytest.mark.anyio
class TestUserService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture
        request.cls.test_user = await create_canned_user(db_connection_fixture)

    async def test_get_user_by_id_returns_user(self):
        # Act
        user = await UserService.get_user_by_id(self.test_user.id, self.db)

        # Assert
        assert user.username == self.test_user.username

    async def test_get_user_by_id_raises_error_if_user_not_found(self):
        with pytest.raises(NotFound):
            await UserService.get_user_by_id(123456, self.db)

    async def test_get_user_by_username_returns_user(self):
        # Act
        user = await UserService.get_user_by_username(self.test_user.username, self.db)

        # Assert
        assert user.id == self.test_user.id

    async def test_get_user_by_username_raises_error_if_user_not_found(self):
        with pytest.raises(NotFound):
            await UserService.get_user_by_username("Thinkwhere", self.db)

    async def test_is_user_admin_returns_true_for_admin(self):
        query = """
            UPDATE users
            SET role = :role
            WHERE id = :user_id
        """
        await self.db.execute(
            query, values={"user_id": self.test_user.id, "role": UserRole.ADMIN.value}
        )

        # Act
        result = await UserService.is_user_an_admin(self.test_user.id, self.db)

        # Assert
        assert result is True

    async def test_is_user_admin_returns_false_for_non_admin(self):
        # Assert
        assert await UserService.is_user_an_admin(self.test_user.id, self.db) is False

    async def test_unknown_role_raise_error_when_setting_role(self):
        with pytest.raises(UserServiceError):
            await UserService.add_role_to_user(1, "test", "TEST", self.db)

    async def test_get_mapping_level(self):
        # Assert
        level = await UserService.get_mapping_level(self.test_user.id, self.db)

        assert level.name == "BEGINNER"

    async def test_set_user_mapping_level(self):
        # Act
        await UserService.set_user_mapping_level(
            self.test_user.username, "ADVANCED", self.db
        )

        # Assert
        level = await UserService.get_mapping_level(self.test_user.id, self.db)

        assert level.name == "ADVANCED"
        assert not level.is_beginner

    async def test_unknown_level_raise_error_when_setting_level(self):
        with pytest.raises(UserServiceError):
            await UserService.set_user_mapping_level("test", "TEST", self.db)

    async def test_register_user_beginner(self):
        # Act
        registered_user = await UserService.register_user(
            1, "foo", 0, None, "foo@example.com", self.db
        )

        # Assert
        assert (
            registered_user.mapping_level
            == (await MappingLevel.get_by_name("BEGINNER", self.db)).id
        )

    @patch.object(requests, "get")
    async def test_get_and_save_stats(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(
            return_value={
                "result": {
                    "topics": {"changeset": {"value": 251.0}},
                },
            },
        )
        mock_get.return_value = mock_response

        # Act
        await UserService.get_and_save_stats(self.test_user.id, self.db)

        # Assert
        stats = await UserStats.get_for_user(self.test_user.id, self.db)
        assert stats.stats == '{"changeset": 251.0}'

    @patch.object(requests, "get")
    async def test_get_and_save_stats_error(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.json = MagicMock(
            return_value={
                "status": 500,
                "error": "Internal Server Error",
                "path": "/api/stats/user",
            },
        )
        mock_get.return_value = mock_response

        # Assert
        with pytest.raises(UserServiceError):
            # Act
            await UserService.get_and_save_stats(self.test_user.id, self.db)

    @patch.object(requests, "get")
    async def test_check_and_update_mapper_level_happy_path(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(
            return_value={
                "result": {
                    "topics": {"changeset": {"value": 251.0}},
                },
            }
        )
        mock_get.return_value = mock_response

        # Act
        await UserService.check_and_update_mapper_level(self.test_user.id, self.db)

        # Assert
        # one badge is assigned
        badges = await MappingBadge.get_related_to_user(self.test_user.id, self.db)
        assert len(badges) == 1
        assert badges[0].name == "INTERMEDIATE_internal"
        # intermediate level is assigned
        user = await User.get_by_id(self.test_user.id, self.db)
        new_level = await MappingLevel.get_by_id(user.mapping_level, self.db)
        assert new_level.id == 2
        assert new_level.name == "INTERMEDIATE"

    @patch.object(requests, "get")
    async def test_check_and_update_mapper_level_no_level_upgrade(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(
            return_value={
                "result": {
                    "topics": {"changeset": {"value": 249.0}},
                },
            }
        )
        mock_get.return_value = mock_response

        # Act
        await UserService.check_and_update_mapper_level(self.test_user.id, self.db)

        # Assert
        # no badge is assigned
        badges = await MappingBadge.get_related_to_user(self.test_user.id, self.db)
        assert len(badges) == 0
        # no level is upgraded
        user = await User.get_by_id(self.test_user.id, self.db)
        new_level = await MappingLevel.get_by_id(user.mapping_level, self.db)
        assert new_level.id == 1
        assert new_level.name == "BEGINNER"

    @patch.object(requests, "get")
    async def test_check_and_update_mapper_level_pool_of_approval(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(
            return_value={
                "result": {
                    "topics": {"changeset": {"value": 251.0}},
                },
            }
        )
        mock_get.return_value = mock_response
        await self.db.execute(
            "UPDATE mapping_levels SET approvals_required = 1 WHERE id = 2"
        )

        # Act
        await UserService.check_and_update_mapper_level(self.test_user.id, self.db)

        # Assert
        # a badge is assigned
        badges = await MappingBadge.get_related_to_user(self.test_user.id, self.db)
        assert len(badges) == 1
        # no level is upgraded
        user = await User.get_by_id(self.test_user.id, self.db)
        new_level = await MappingLevel.get_by_id(user.mapping_level, self.db)
        assert new_level.id == 1
        assert new_level.name == "BEGINNER"
        # user is added to the waiting queue
        assert await UserNextLevel.is_nominated(user.id, 2, self.db)

    @patch.object(requests, "get")
    async def test_check_and_update_mapper_level_max_level(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(
            return_value={
                "result": {
                    "topics": {"changeset": {"value": 2000.0}},
                },
            }
        )
        mock_get.return_value = mock_response
        await self.test_user.set_mapping_level(
            await MappingLevel.get_by_id(3, self.db), self.db
        )

        # Act
        await UserService.check_and_update_mapper_level(self.test_user.id, self.db)

        # Assert
        # no level is upgraded
        user = await User.get_by_id(self.test_user.id, self.db)
        new_level = await MappingLevel.get_by_id(user.mapping_level, self.db)
        assert new_level.id == 3
        assert new_level.name == "ADVANCED"

    @patch.object(requests, "get")
    async def test_get_user_dto_by_username(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(
            return_value={
                "result": {
                    "topics": {"changeset": {"value": 2000.0}},
                },
            }
        )
        mock_get.return_value = mock_response
        # Act
        dto = await UserService.get_user_dto_by_username(
            self.test_user.username, self.test_user.id, self.db
        )

        # Assert
        assert dto.mapping_level == "BEGINNER"

    async def test_approve_level_needs_one_more(self):
        # Arrange
        level = await MappingLevel.create(
            MappingLevelCreateDTO(
                name="Super Mapper",
                approvalsRequired=2,
                color="#acabad",
                isBeginner=False,
                requiredBadges=[],
            ),
            self.db,
        )
        await UserNextLevel.nominate(self.test_user.id, level.id, self.db)

        # Act
        await UserService.approve_level(self.test_user.id, 234, self.db)

        # Assert
        user = await UserService.get_user_by_id(self.test_user.id, self.db)
        assert user.mapping_level != level.id
        assert await UserNextLevel.is_nominated(self.test_user.id, level.id, self.db)

    async def test_approve_level(self):
        # Arrange
        level = await MappingLevel.create(
            MappingLevelCreateDTO(
                name="Super Mapper",
                approvalsRequired=1,
                color="#acabad",
                isBeginner=False,
                requiredBadges=[],
            ),
            self.db,
        )
        await UserNextLevel.nominate(self.test_user.id, level.id, self.db)

        # Act
        await UserService.approve_level(self.test_user.id, 234, self.db)

        # Assert
        user = await UserService.get_user_by_id(self.test_user.id, self.db)
        # Level is upgraded
        assert user.mapping_level == level.id
        # user_next_level table is cleared
        assert not await UserNextLevel.is_nominated(
            self.test_user.id, level.id, self.db
        )
        # votes are cleared
        assert await UserLevelVote.count(self.test_user.id, level.id, self.db) == 0
