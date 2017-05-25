import unittest

from server.services.messaging.message_service import MessageService


class TestMessagingService(unittest.TestCase):

    def test_message_service_identifies_all_users(self):
        # Act
        usernames = MessageService._parse_comment_for_username('Hello @[Iain Hunter] and "[LindaA1]')

        # Assert
        self.assertEqual(usernames[0], 'Iain Hunter')
        self.assertEqual(usernames[1], 'LindaA1')

    def test_message_service_generates_hyperlink(self):
        # Act
        link = MessageService.get_task_link(1, 1, 'http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com')

        # Assert
        self.assertEqual(link, '<a href="http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/project/1/?task=1">Task 1</a>')