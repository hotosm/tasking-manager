import pytest
from backend.services.users.user_service import (
    NotFound,
    UserRole,
    UserService,
    UserServiceError,
)
from tests.api.helpers.test_helpers import create_canned_user


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

    async def test_unknown_level_raise_error_when_setting_level(self):
        with pytest.raises(UserServiceError):
            await UserService.set_user_mapping_level("test", "TEST", self.db)
