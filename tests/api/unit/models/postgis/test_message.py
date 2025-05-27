import pytest

from backend.models.postgis.message import Message, MessageType
from backend.services.messaging.message_service import MessageService
from tests.api.helpers.test_helpers import create_canned_user, return_canned_user

TEST_USERNAME = "test_user"
TEST_USER_ID = 1


@pytest.mark.anyio
class TestMessage:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup test user before each test."""
        assert db_connection_fixture is not None, "Database connection is not available"
        test_user = await return_canned_user(
            db_connection_fixture, TEST_USERNAME, TEST_USER_ID
        )
        await create_canned_user(db_connection_fixture, test_user)

        request.cls.db = db_connection_fixture
        request.cls.test_user_id = TEST_USER_ID
        request.cls.test_user = test_user

    async def send_multiple_welcome_messages(self, number_of_messages: int):
        """Sends multiple welcome messages using raw SQL."""
        for _ in range(number_of_messages):
            await MessageService.send_welcome_message(self.test_user, self.db)

        query = "SELECT id FROM messages WHERE to_user_id = :user_id"
        messages = await self.db.fetch_all(query, {"user_id": self.test_user_id})
        message_ids = [message.id for message in messages]
        return message_ids

    async def test_delete_multiple_messages(self):
        """Tests that multiple messages can be deleted."""
        message_ids = await self.send_multiple_welcome_messages(3)
        await Message.delete_multiple_messages(
            message_ids[:2], self.test_user.id, self.db
        )

        # Verify remaining messages

        query = "SELECT id FROM messages WHERE to_user_id = :user_id"
        messages = await self.db.fetch_all(query, {"user_id": self.test_user_id})

        assert len(messages) == 1
        assert messages[0]["id"] == message_ids[2]

    async def test_delete_all_messages(self):
        """Tests that all messages can be deleted."""
        await self.send_multiple_welcome_messages(3)
        await Message.delete_all_messages(self.test_user.id, self.db)
        # Verify deletion
        query = "SELECT COUNT(*) FROM messages WHERE to_user_id = :user_id"
        result = await self.db.fetch_one(query, {"user_id": self.test_user_id})
        assert result[0] == 0

    async def test_delete_all_message_filters_by_type(self):
        """Tests that all messages can be deleted by type."""
        await self.send_multiple_welcome_messages(3)

        test_user_2 = await return_canned_user(self.db, "test_user_2", 222222222)
        await create_canned_user(self.db, test_user_2)
        await MessageService.send_team_join_notification(
            test_user_2.id,
            test_user_2.username,
            self.test_user.id,
            "test_team",
            10,
            "MANAGER",
            self.db,
        )
        # Act
        await Message.delete_all_messages(
            self.test_user.id, self.db, [MessageType.SYSTEM.value]
        )
        # Assert
        query = "SELECT * FROM messages WHERE to_user_id = :user_id"
        messages = await self.db.fetch_all(query, {"user_id": self.test_user_id})

        assert len(messages) == 1
        assert messages[0].message_type == MessageType.INVITATION_NOTIFICATION.value

    async def test_mark_multiple_messages_read(self):
        """Tests that multiple messages can be marked as read."""
        message_ids = await self.send_multiple_welcome_messages(3)

        await Message.mark_multiple_messages_read(
            message_ids[:2], self.test_user.id, self.db
        )
        # Verify updates
        query = "SELECT id, read FROM messages WHERE to_user_id = :user_id ORDER BY id"
        messages = await self.db.fetch_all(query, {"user_id": self.test_user_id})

        assert messages[0]["read"] is True
        assert messages[1]["read"] is True
        assert messages[2]["read"] is False

    async def test_mark_all_messages_read(self):
        """Tests that all messages can be marked as read."""
        await self.send_multiple_welcome_messages(3)

        await Message.mark_all_messages_read(self.test_user.id, self.db)

        # Verify updates
        query = (
            "SELECT COUNT(*) FROM messages WHERE to_user_id = :user_id AND read = FALSE"
        )
        result = await self.db.fetch_one(query, {"user_id": self.test_user_id})
        assert result[0] == 0

    async def test_mark_all_message_filters_by_type(self):
        """Test that all messages of a certain type can be marked as read."""
        await self.send_multiple_welcome_messages(3)

        test_user_2 = await return_canned_user(self.db, "test_user_2", 222222222)
        await create_canned_user(self.db, test_user_2)

        await MessageService.send_team_join_notification(
            test_user_2.id,
            test_user_2.username,
            self.test_user.id,
            "test_team",
            10,
            "MANAGER",
            self.db,
        )
        # Act
        await Message.mark_all_messages_read(
            self.test_user.id, self.db, [MessageType.SYSTEM.value]
        )
        # Assert
        messages = await MessageService.get_all_messages(
            db=self.db,
            user_id=self.test_user.id,
            locale="en",
            page=1,
            sort_by="date",
            sort_direction="desc",
            status="unread",
        )
        assert len(messages.user_messages) == 1
        assert (
            messages.user_messages[0].message_type
            == MessageType.INVITATION_NOTIFICATION.name
        )
