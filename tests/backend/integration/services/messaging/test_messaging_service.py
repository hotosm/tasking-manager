from unittest.mock import patch

from backend.models.dtos.message_dto import MessageDTO
from backend.services.messaging.message_service import MessageService
from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.message import MessageType, Message, NotFound
from backend.models.postgis.task import Task
from backend.services.messaging.smtp_service import SMTPService
from tests.backend.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_organisation,
    return_canned_user,
    create_canned_project,
    update_project_with_info,
)
from tests.backend.base import BaseTestCase


class TestMessageService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = return_canned_user("TEST_USER", 111111111)
        self.test_user.create()

    def test_welcome_message_sent(self):
        # Act
        message_id = MessageService.send_welcome_message(self.test_user)
        self.assertIsNotNone(message_id)
        message = MessageService.get_message(message_id, self.test_user.id)

        # Assert
        self.assertTrue(message, "Message should be saved to DB")

        # Tidyup
        MessageService.delete_message(message_id, self.test_user.id)

    def test_validation_message_is_not_sent_for_validating_self_mapped_task(self):
        # Arrange
        status = TaskStatus.VALIDATED.value
        validated_by = 777  # random user id
        mapped_by = 777  # random user id
        project_id = 1  # random project id
        task_id = 1  # random task id
        # Act/Assert
        self.assertFalse(
            MessageService.send_message_after_validation(
                status, validated_by, mapped_by, project_id, task_id
            )
        )

    @patch.object(MessageService, "_push_messages")
    def test_validation_message_is_sent_after_task_validation(self, mock_push_message):
        # Arrange
        status = TaskStatus.VALIDATED.value
        canned_project, canned_author = create_canned_project()
        update_project_with_info(canned_project)
        # Act
        MessageService.send_message_after_validation(
            status, canned_author.id, self.test_user.id, 1, canned_project.id
        )

        # Assert
        mock_push_message.assert_called()

    @patch.object(MessageService, "_push_messages")
    def test_send_message_to_all_contributors(self, mock_push_message):
        # Arrange
        canned_project, canned_author = create_canned_project()
        canned_project = update_project_with_info(canned_project)
        task = Task.get(1, canned_project.id)
        task.mapped_by = self.test_user.id
        message_dto = MessageDTO()
        message_dto.message_id = 12
        message_dto.subject = "Test subject"
        message_dto.message = "Test message"
        message_dto.from_user_id = canned_author.id
        message_dto.from_username = canned_author.username
        message_dto.project_id = canned_project.id
        message_dto.project_title = "Test project"
        message_dto.message_type = MessageType.BROADCAST.value
        message_dto.sent_date = "2020-01-01"
        # Act
        MessageService.send_message_to_all_contributors(canned_project.id, message_dto)
        # Assert
        mock_push_message.assert_called()

    @patch.object(MessageService, "_push_messages")
    def test_send_message_after_comment(self, mock_push_message):
        # Arrange
        canned_project, canned_author = create_canned_project()
        canned_project = update_project_with_info(canned_project)
        # Act
        MessageService.send_message_after_comment(
            canned_author.id, "@test_user Test message", 1, canned_project.id
        )
        # Assert
        mock_push_message.assert_called()

    @patch.object(SMTPService, "_send_message")
    def test_send_project_transfer_messgae(self, mock_send_message):
        test_project, test_author = create_canned_project()
        self.test_user.email_address = "test@hotmalinator.com"
        self.test_user.is_email_verified = True
        self.test_user.save()
        test_organisation = create_canned_organisation()
        test_project.organisation = test_organisation
        add_manager_to_organisation(test_organisation, self.test_user)
        MessageService.send_project_transfer_message(
            test_project.id, self.test_user.username, test_author.username
        )
        mock_send_message.assert_called()

    def send_multiple_welcome_messages(self, number_of_messages: int):
        """Sends multiple welcome messages"""
        message_ids = []
        for _ in range(number_of_messages):
            message_id = MessageService.send_welcome_message(self.test_user)
            message_ids.append(message_id)
        return message_ids

    def test_delete_multiple_messages(self):
        """Test that multiple messages can be deleted at once"""
        # Arrange
        message_ids = self.send_multiple_welcome_messages(3)
        # Act
        MessageService.delete_multiple_messages(message_ids[:2], self.test_user.id)
        # Assert
        messages = Message.get_all_messages(user_id=self.test_user.id)
        self.assertEqual(len(messages.user_messages), 1)
        self.assertEqual(messages.user_messages[0].message_id, message_ids[2])

    def test_delete_all_messages(self):
        """Test that all messages can be deleted at once"""
        # Arrange
        self.send_multiple_welcome_messages(3)
        # Act
        MessageService.delete_all_messages(self.test_user.id)
        # Assert
        with self.assertRaises(NotFound):
            Message.get_all_messages(user_id=self.test_user.id)

    def test_delete_all_message_by_type(self):
        """Test that all messages can be deleted at once"""
        # Arrange
        self.send_multiple_welcome_messages(2)
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
        # Send welcome message to test_user_2 to ensure that it is not deleted
        MessageService.send_welcome_message(test_user_2)
        # Act
        MessageService.delete_all_messages(self.test_user.id, "1,2,3")
        # Assert
        user_1_messages = Message.get_all_messages(user_id=self.test_user.id)
        # Since we deleted all messages of type 1,2,3, welcome messages should be deleted as it is of type 1
        # Team join notification is of type 7, so it should still be there
        self.assertEqual(len(user_1_messages.user_messages), 1)
        self.assertEqual(
            user_1_messages.user_messages[0].message_type,
            MessageType.INVITATION_NOTIFICATION.name,
        )
        # Also assert that messages of other users are not deleted
        user_2_messages = Message.get_all_messages(user_id=test_user_2.id)
        self.assertEqual(len(user_2_messages.user_messages), 1)

    def test_mark_multiple_messages_as_read(self):
        # Arrange
        message_ids = self.send_multiple_welcome_messages(3)
        # Act
        MessageService.mark_multiple_messages_read(message_ids[:2], self.test_user.id)
        # Assert
        messages = MessageService.get_all_messages(
            user_id=self.test_user.id,
            locale="en",
            page=1,
            sort_by="date",  # Required for function to work
            sort_direction="desc",  # Required for function to work
            status="unread",
        )
        self.assertEqual(len(messages.user_messages), 1)
        self.assertEqual(messages.user_messages[0].message_id, message_ids[2])

    def test_mark_all_messages_as_read(self):
        # Arrange
        self.send_multiple_welcome_messages(3)
        # Act
        MessageService.mark_all_messages_read(self.test_user.id)
        # Assert
        unread_count = Message.get_unread_message_count(self.test_user.id)
        self.assertEqual(unread_count, 0)

    def test_mark_all_messages_as_read_by_type(self):
        # Arrange
        self.send_multiple_welcome_messages(2)
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
        # Send welcome message to test_user_2 to ensure that it is not marked as read
        MessageService.send_welcome_message(test_user_2)
        # Act
        MessageService.mark_all_messages_read(self.test_user.id, "1,2,3")
        # Assert
        user_1_messages = MessageService.get_all_messages(
            user_id=self.test_user.id,
            locale="en",
            page=1,
            sort_by="date",  # Required for function to work
            sort_direction="desc",  # Required for function to work
            status="unread",
        )
        # Since we marked all messages of type 1,2,3 as read, welcome messages should be read as it is of type 1
        # Team join notification is of type 7, so it should still be there unread
        self.assertEqual(len(user_1_messages.user_messages), 1)
        self.assertEqual(
            user_1_messages.user_messages[0].message_type,
            MessageType.INVITATION_NOTIFICATION.name,
        )
        # Also assert that messages of other users are not marked as read
        user_2_messages = MessageService.get_all_messages(
            user_id=test_user_2.id,
            locale="en",
            page=1,
            sort_by="date",  # Required for function to work
            sort_direction="desc",  # Required for function to work
            status="unread",
        )
        self.assertEqual(user_2_messages.pagination.total, 1)
