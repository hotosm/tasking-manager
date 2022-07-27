from unittest.mock import patch

from backend.models.dtos.message_dto import MessageDTO
from backend.services.messaging.message_service import MessageService
from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.message import MessageType
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
    def test_welcome_message_sent(self):
        self.test_user = return_canned_user()
        self.test_user.create()
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
        canned_user = return_canned_user()
        canned_user.id, canned_user.username = 100000, "test_user"
        canned_user.create()
        # Act
        MessageService.send_message_after_validation(
            status, canned_author.id, canned_user.id, 1, canned_project.id
        )

        # Assert
        mock_push_message.assert_called()

    @patch.object(MessageService, "_push_messages")
    def test_send_message_to_all_contributors(self, mock_push_message):
        # Arrange
        canned_project, canned_author = create_canned_project()
        canned_project = update_project_with_info(canned_project)
        canned_user = return_canned_user()
        canned_user.id, canned_user.username = 100000, "test_user"
        canned_user.create()
        task = Task.get(1, canned_project.id)
        task.mapped_by = canned_user.id
        message_dto = MessageDTO()
        message_dto.message_id = 12
        message_dto.subject = "Test subject"
        message_dto.message = "Test message"
        message_dto.from_user_id = canned_author.id
        message_dto.from_username = canned_author.username
        message_dto.project_id = canned_project.id
        message_dto.project_title = "Test project"
        message_dto.message_type = MessageType.PROJECT_ACTIVITY_NOTIFICATION.value
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
        canned_user = return_canned_user()
        canned_user.id, canned_user.username = 100000, "test_user"
        canned_user.create()
        # Act
        MessageService.send_message_after_comment(
            canned_author.id, "@test_user Test message", 1, canned_project.id
        )
        # Assert
        mock_push_message.assert_called()

    @patch.object(SMTPService, "_send_message")
    def test_send_project_transfer_messgae(self, mock_send_message):
        test_project, test_author = create_canned_project()
        test_user = return_canned_user("test_user", 11111)
        test_user.email_address = "test@hotmalinator.com"
        test_user.is_email_verified = True
        test_user.create()
        test_organisation = create_canned_organisation()
        test_project.organisation = test_organisation
        add_manager_to_organisation(test_organisation, test_user)
        MessageService.send_project_transfer_message(
            test_project.id, test_user.username, test_author.username
        )
        mock_send_message.assert_called()
