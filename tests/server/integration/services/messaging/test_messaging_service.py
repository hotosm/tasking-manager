import os
import unittest

from server import create_app

from server.services.messaging.message_service import MessageService, Message
from tests.server.helpers.test_helpers import create_canned_user


class TestMessageService(unittest.TestCase):
    skip_tests = False
    test_user = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.test_user = create_canned_user()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_user.delete()
        self.ctx.pop()

    def test_welcome_message_sent(self):
        if self.skip_tests:
            return

        # Act
        message_id = MessageService.send_welcome_message(self.test_user)
        message = MessageService.get_message(message_id, self.test_user.id)

        # Assert
        self.assertTrue(message, 'Message should be saved to DB')

        # Tidyup
        MessageService.delete_message(message_id, self.test_user.id)
