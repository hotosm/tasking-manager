import pytest

from backend.models.postgis.user import UserRole
from backend.services.users.user_service import UserService

from tests.api.helpers.test_helpers import get_or_create_levels


@pytest.mark.anyio
class TestUser:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup test user asynchronously before each test."""
        assert db_connection_fixture is not None, "Database connection is not available"
        await get_or_create_levels(db_connection_fixture)

        test_user_data = {
            "id": 12,
            "role": UserRole.MAPPER.value,
            "mapping_level": 1,
            "username": "Thinkwhere Test",
            "email_address": "thinkwheretest@test.com",
            "tasks_mapped": 0,
            "tasks_validated": 0,
            "tasks_invalidated": 0,
            "is_email_verified": False,
            "is_expert": False,
            "default_editor": "ID",
            "mentions_notifications": True,
            "projects_comments_notifications": False,
            "projects_notifications": True,
            "tasks_notifications": True,
            "tasks_comments_notifications": False,
            "teams_announcement_notifications": True,
        }

        query = """
        INSERT INTO users (
            id, role, mapping_level, username, email_address,
            tasks_mapped, tasks_validated, tasks_invalidated,
            is_email_verified, is_expert, default_editor,
            mentions_notifications, projects_comments_notifications,
            projects_notifications, tasks_notifications,
            tasks_comments_notifications, teams_announcement_notifications
        )
        VALUES (
            :id, :role, :mapping_level, :username, :email_address,
            :tasks_mapped, :tasks_validated, :tasks_invalidated,
            :is_email_verified, :is_expert, :default_editor,
            :mentions_notifications, :projects_comments_notifications,
            :projects_notifications, :tasks_notifications,
            :tasks_comments_notifications, :teams_announcement_notifications
        )
        ON CONFLICT (id) DO NOTHING
        """
        await db_connection_fixture.execute(query, test_user_data)

        request.cls.db = db_connection_fixture
        request.cls.test_user_id = test_user_data["id"]

    async def test_create_user(self):
        """Test user creation with raw SQL."""
        query = "SELECT * FROM users WHERE id = :id"
        result = await self.db.fetch_one(query, {"id": self.test_user_id})

        assert result is not None, "User should exist in the database"
        assert result["username"] == "Thinkwhere Test"
        assert result["email_address"] == "thinkwheretest@test.com"
        assert result["role"] == UserRole.MAPPER.value
        assert result["mapping_level"] == 1
        assert result["default_editor"] == "ID"

    async def test_update_username(self):
        """Test updating username using raw SQL."""
        new_username = "mrtest"

        user = await UserService.get_user_by_id(self.test_user_id, self.db)
        await user.update_username(new_username, self.db)

        select_query = "SELECT username FROM users WHERE id = :id"
        result = await self.db.fetch_one(select_query, {"id": self.test_user_id})

        assert result["username"] == new_username

    async def test_update_picture_url(self):
        """Test updating the user's profile picture URL."""
        test_picture_url = (
            "https://cdn.pixabay.com/photo/2022/04/29/08/50/desert-7162926_1280.jpg"
        )

        user = await UserService.get_user_by_id(self.test_user_id, self.db)
        await user.update_picture_url(test_picture_url, self.db)

        select_query = "SELECT picture_url FROM users WHERE id = :id"
        result = await self.db.fetch_one(select_query, {"id": self.test_user_id})

        assert result["picture_url"] == test_picture_url
