from backend.models.postgis.message import Message, MessageType, NotFound
from backend.services.messaging.message_service import MessageService

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import return_canned_user

TEST_USERNAME = "test_user"
TEST_USER_ID = 1


class TestMessage(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.test_user.create()

    def send_multiple_welcome_messages(self, number_of_messages: int):
        """Sends multiple welcome messages"""
        message_ids = []
        for _ in range(number_of_messages):
            message_id = MessageService.send_welcome_message(self.test_user)
            message_ids.append(message_id)
        return message_ids

    def test_delete_multiple_messages(self):
        """Tests that multiple messages can be deleted"""
        # Arrange
        message_ids = self.send_multiple_welcome_messages(3)
        # Act
        Message.delete_multiple_messages(message_ids[:2], self.test_user.id)
        # Assert
        messages = Message.get_all_messages(self.test_user.id)
        self.assertEqual(len(messages.user_messages), 1)
        self.assertEqual(messages.user_messages[0].message_id, message_ids[2])

    def test_delete_all_messages(self):
        """Tests that all messages can be deleted"""
        # Arrange
        self.send_multiple_welcome_messages(3)
        # Act
        Message.delete_all_messages(self.test_user.id)
        # Assert
        with self.assertRaises(NotFound):
            Message.get_all_messages(self.test_user.id)

    def test_delete_all_message_filters_by_type(self):
        """Tests that all messages can be deleted by type"""
        # Arrange
        self.send_multiple_welcome_messages(3)
        test_user_2 = return_canned_user("test_user_2", 222222222)
        test_user_2.create()
        MessageService.send_team_join_notification(
            test_user_2.id,
            test_user_2.username,
            self.test_user.id,
            "test_team",
            10,
            "MANAGER",
        )
        # Act
        Message.delete_all_messages(self.test_user.id, [MessageType.SYSTEM.value])
        # Assert
        messages = Message.get_all_messages(self.test_user.id)
        # Since we deleted all system messages, there should be Invitation message left
        self.assertEqual(len(messages.user_messages), 1)
        self.assertEqual(
            messages.user_messages[0].message_type,
            MessageType.INVITATION_NOTIFICATION.name,
        )

    def test_mark_multiple_messages_read(self):
        """Tests that multiple messages can be marked as read"""
        # Arrange
        message_ids = self.send_multiple_welcome_messages(3)
        # Act
        Message.mark_multiple_messages_read(message_ids[:2], self.test_user.id)
        # Assert
        unread_count = Message.get_unread_message_count(self.test_user.id)
        self.assertEqual(unread_count, 1)
        messages = Message.get_all_messages(self.test_user.id)
        self.assertTrue(messages.user_messages[0].read)
        self.assertTrue(messages.user_messages[1].read)
        self.assertFalse(messages.user_messages[2].read)

    def test_mark_all_messages_read(self):
        """Tests that all messages can be marked as read"""
        # Arrange
        self.send_multiple_welcome_messages(3)
        # Act
        Message.mark_all_messages_read(self.test_user.id)
        # Assert
        unread_count = Message.get_unread_message_count(self.test_user.id)
        self.assertEqual(unread_count, 0)

    def test_mark_all_message_filters_by_type(self):
        """Test that all message of a certain type can be marked as read"""
        # Arrange
        self.send_multiple_welcome_messages(3)
        test_user_2 = return_canned_user("test_user_2", 222222222)
        test_user_2.create()
        MessageService.send_team_join_notification(
            test_user_2.id,
            test_user_2.username,
            self.test_user.id,
            "test_team",
            10,
            "MANAGER",
        )
        # Act
        Message.mark_all_messages_read(self.test_user.id, [MessageType.SYSTEM.value])
        # Assert
        messages = MessageService.get_all_messages(
            user_id=self.test_user.id,
            locale="en",
            page=1,
            sort_by="date",  # Required for function to work
            sort_direction="desc",  # Required for function to work
            status="unread",
        )
        # Since we marked all system messages as read, there should be Invitation message left
        self.assertEqual(len(messages.user_messages), 1)
        self.assertEqual(
            messages.user_messages[0].message_type,
            MessageType.INVITATION_NOTIFICATION.name,
        )
