from unittest.mock import patch

from backend.models.postgis.message import Message
from backend.services.messaging.message_service import MessageService
from tests.backend.base import BaseTestCase

MESSAGE_TYPES = "3,2,1"
TEST_USER_ID = 111111111


class TestMessagingService(BaseTestCase):
    # outdated test
    # def test_message_service_identifies_all_users(self):
    #     # Act
    #     usernames = MessageService._parse_message_for_username(
    #         'Hello @[Iain Hunter] and "[LindaA1]'
    #     )
    #
    #     # Assert
    #     self.assertEqual(usernames[0], "Iain Hunter")
    #     self.assertEqual(usernames[1], "LindaA1")

    def test_message_service_generates_correct_task_link(self):
        # Act
        link = MessageService.get_task_link(1, 1, "http://test.com")

        # Assert
        self.assertEqual(
            link,
            '<a style="" href="http://test.com/projects/1/tasks/?search=1">Task 1</a>',
        )

    def test_message_service_generates_highlighted_task_link(self):
        # Act
        link = MessageService.get_task_link(1, 1, "example.com", highlight=True)

        # Assert
        self.assertEqual(
            link,
            '<a style="color: #d73f3f" href="example.com/projects/1/tasks/?search=1">Task 1</a>',
        )

    def test_message_service_generates_correct_chat_link(self):
        # Act
        link = MessageService.get_project_link(
            1, "TEST_PROJECT", "http://test.com", include_chat_section=True
        )

        self.assertEqual(
            link,
            '<a style="" href="http://test.com/projects/1#questionsAndComments">TEST_PROJECT #1</a>',
        )
        link = MessageService.get_project_link(
            1,
            "TEST_PROJECT",
            "http://test.com",
            highlight=True,
        )

        self.assertEqual(
            link,
            '<a style="color: #d73f3f" href="http://test.com/projects/1">TEST_PROJECT #1</a>',
        )

    @patch.object(Message, "delete_multiple_messages")
    def test_delete_multiple_messages(self, mock_delete_multiple_messages):
        """Test that the delete_multiple_messages method calls the model method"""
        # Act
        MessageService.delete_multiple_messages([1, 2, 3], 1)
        # Assert
        mock_delete_multiple_messages.assert_called()

    @patch.object(Message, "delete_all_messages")
    def test_delete_all_messages(self, mock_delete_all_messages):
        """Test that the delete_all_messages method calls the model method"""
        # Act
        MessageService.delete_all_messages(1, MESSAGE_TYPES)
        message_type = list(map(int, list(MESSAGE_TYPES.split(","))))
        # Assert
        mock_delete_all_messages.assert_called_with(1, message_type)

    @patch.object(Message, "mark_multiple_messages_read")
    def test_mark_multiple_messaes_read(self, mock_mark_multiple_messages_read):
        """Test that the mark_multiple_messages_read method calls the model method"""
        # Act
        MessageService.mark_multiple_messages_read([1, 2, 3], 1)
        # Assert
        mock_mark_multiple_messages_read.assert_called()

    @patch.object(Message, "mark_all_messages_read")
    def test_mark_all_messages_read(self, mock_mark_all_messages_read):
        """Test that the mark_all_messages_read method calls the model method"""
        # Act
        MessageService.mark_all_messages_read(1, MESSAGE_TYPES)
        message_type = list(map(int, list(MESSAGE_TYPES.split(","))))
        # Assert
        mock_mark_all_messages_read.assert_called_with(1, message_type)
