import pytest
from unittest.mock import patch, AsyncMock

from backend.models.postgis.message import Message
from backend.services.messaging.message_service import MessageService

MESSAGE_TYPES = "3,2,1"
TEST_USER_ID = 111111111


@pytest.mark.anyio
class TestMessagingService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup required test data"""
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

    async def test_message_service_generates_correct_task_link(self):
        # Act
        link = MessageService.get_task_link(1, 1, "http://test.com")

        # Assert
        assert (
            link
            == '<a style="" href="http://test.com/projects/1/tasks/?search=1">Task 1</a>'
        )

    async def test_message_service_generates_highlighted_task_link(self):
        # Act
        link = MessageService.get_task_link(1, 1, "example.com", highlight=True)

        # Assert
        assert (
            link
            == '<a style="color: #d73f3f" href="example.com/projects/1/tasks/?search=1">Task 1</a>'
        )

    async def test_message_service_generates_correct_chat_link(self):
        # Act
        link = MessageService.get_project_link(
            1, "TEST_PROJECT", "http://test.com", include_chat_section=True
        )

        assert (
            link
            == '<a style="" href="http://test.com/projects/1#questionsAndComments">TEST_PROJECT #1</a>'
        )

        link = MessageService.get_project_link(
            1, "TEST_PROJECT", "http://test.com", highlight=True
        )

        assert (
            link
            == '<a style="color: #d73f3f" href="http://test.com/projects/1">TEST_PROJECT #1</a>'
        )

    @patch.object(Message, "delete_multiple_messages")
    async def test_delete_multiple_messages(self, mock_delete_multiple_messages):
        """Test that the delete_multiple_messages method calls the model method"""
        # Configure the mock to be awaitable
        mock_delete_multiple_messages.return_value = AsyncMock()

        # Act
        await MessageService.delete_multiple_messages([1, 2, 3], 1, self.db)

        # Assert
        mock_delete_multiple_messages.assert_called_once()

    @patch.object(Message, "delete_all_messages")
    async def test_delete_all_messages(self, mock_delete_all_messages):
        """Test that the delete_all_messages method calls the model method"""
        # Configure the mock to be awaitable
        mock_delete_all_messages.return_value = AsyncMock()

        # Act
        await MessageService.delete_all_messages(1, self.db, MESSAGE_TYPES)

        # Assert
        message_type = list(map(int, list(MESSAGE_TYPES.split(","))))
        mock_delete_all_messages.assert_called_with(1, self.db, message_type)

    @patch.object(Message, "mark_multiple_messages_read")
    async def test_mark_multiple_messages_read(self, mock_mark_multiple_messages_read):
        """Test that the mark_multiple_messages_read method calls the model method"""
        # Configure the mock to be awaitable
        mock_mark_multiple_messages_read.return_value = AsyncMock()

        # Act
        await MessageService.mark_multiple_messages_read([1, 2, 3], 1, self.db)

        # Assert
        mock_mark_multiple_messages_read.assert_called_once()

    @patch.object(Message, "mark_all_messages_read")
    async def test_mark_all_messages_read(self, mock_mark_all_messages_read):
        """Test that the mark_all_messages_read method calls the model method"""
        # Configure the mock to be awaitable
        mock_mark_all_messages_read.return_value = AsyncMock()

        # Act
        await MessageService.mark_all_messages_read(1, self.db, MESSAGE_TYPES)

        # Assert
        message_type = list(map(int, list(MESSAGE_TYPES.split(","))))
        mock_mark_all_messages_read.assert_called_with(1, self.db, message_type)
