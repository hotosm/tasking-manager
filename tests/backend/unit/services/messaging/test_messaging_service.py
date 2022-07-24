from backend.services.messaging.message_service import MessageService
from tests.backend.base import BaseTestCase


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
            link, '<a href="http://test.com/projects/1/tasks/?search=1">Task 1</a>'
        )

    def test_message_service_generates_correct_chat_link(self):
        # Act
        link = MessageService.get_project_link(
            1, "TEST_PROJECT", "http://test.com", include_chat_section=True
        )

        self.assertEqual(
            link,
            '<a href="http://test.com/projects/1#questionsAndComments">TEST_PROJECT</a>',
        )
        link = MessageService.get_project_link(
            1,
            "TEST_PROJECT",
            "http://test.com",
        )

        self.assertEqual(
            link,
            '<a href="http://test.com/projects/1">TEST_PROJECT</a>',
        )
