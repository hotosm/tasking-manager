from backend.services.messaging.message_service import MessageService
from tests.backend.helpers.test_helpers import create_canned_user
from tests.backend.base import BaseTestCase


class TestMessageService(BaseTestCase):
    def test_welcome_message_sent(self):
        self.test_user = create_canned_user()
        # Act
        message_id = MessageService.send_welcome_message(self.test_user)
        self.assertIsNotNone(message_id)
        message = MessageService.get_message(message_id, self.test_user.id)

        # Assert
        self.assertTrue(message, "Message should be saved to DB")

        # Tidyup
        MessageService.delete_message(message_id, self.test_user.id)
