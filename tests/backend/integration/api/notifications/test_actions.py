from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    create_canned_message,
)

TEST_SUBJECT = "Test subject"
TEST_MESSAGE = "This is a test message"


class TestNotificationsActionsDeleteMultipleAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_message_one = create_canned_message(
            subject=TEST_SUBJECT, message=TEST_MESSAGE
        )
        self.test_message_two = create_canned_message(
            subject=TEST_SUBJECT, message=TEST_MESSAGE
        )
        self.test_message_one.from_user_id = self.test_user.id
        self.test_message_two.from_user_id = self.test_user.id
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.url = "/api/v2/notifications/delete-multiple/"

    # delete
    def test_delete_multiple_messages_returns_401(self):
        """
        Test that endpoint returns 401 for unauthenticated user deleting multiple messages
        """
        response = self.client.delete(
            self.url,
            json={"messageIds": [self.test_message_one.id, self.test_message_two.id]},
        )
        response_body = response.get_json()

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_delete_multiple_messages_returns_200(self):
        """
        Test that endpoint returns 200 for authenticated user deleting multiple messages
        """
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_user_token},
            json={"messageIds": [self.test_message_one.id, self.test_message_two.id]},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Messages deleted")
