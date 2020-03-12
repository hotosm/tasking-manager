import unittest

from backend.services.messaging.message_service import MessageService


class TestMessagingService(unittest.TestCase):
    def test_message_service_identifies_all_users(self):
        # Act
        usernames = MessageService._parse_message_for_username(
            'Hello @Iain Hunter and "@LindaA1 @@@Cersie @ @Peter_123'
        )

        # Assert
        self.assertEqual(usernames[0], "Iain")
        self.assertEqual(usernames[1], "LindaA1")
        self.assertEqual(usernames[2], "Cersie")
        self.assertEqual(usernames[3], "Peter_123")

    def test_message_service_generates_correct_task_link(self):
        # Act
        link = MessageService.get_task_link(1, 1, "http://test.com")

        # Assert
        self.assertEqual(
            link, '<a href="http://test.com/projects/1/tasks/?search=1">Task 1</a>'
        )

    def test_message_service_generates_correct_chat_link(self):
        # Act
        link = MessageService.get_project_link(1, "http://test.com")

        self.assertEqual(
            link,
            '<a href="http://test.com/projects/1#questionsAndComments">Project 1</a>',
        )
