import unittest
from server.services.message_service import MessageService


class TestMessagingService(unittest.TestCase):

    def test_message_service_identifies_all_users(self):
        # Act
        usernames = MessageService._parse_comment_for_username('Hello @[Iain Hunter] and "[LindaA1]')

        # Assert
        self.assertEqual(usernames[0], 'Iain Hunter')
        self.assertEqual(usernames[1], 'LindaA1')
