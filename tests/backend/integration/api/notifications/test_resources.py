from datetime import datetime

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    return_canned_user,
    create_canned_message,
    create_canned_notification,
)

TEST_SUBJECT = "Test subject"
TEST_MESSAGE = "This is a test message"
MESSAGES_NOT_FOUND = "No messages found"
NOT_FOUND = "NotFound"


class TestNotificationsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_message = create_canned_message(
            subject=TEST_SUBJECT, message=TEST_MESSAGE
        )
        self.test_sender = create_canned_user()
        self.test_receiver = return_canned_user("Test user", 11111)
        self.test_receiver.create()
        self.test_message.from_user_id = self.test_sender.id
        self.test_message.to_user_id = self.test_receiver.id

        self.test_sender_token = generate_encoded_token(self.test_sender.id)
        self.test_receiver_token = generate_encoded_token(self.test_receiver.id)
        self.url = f"/api/v2/notifications/{self.test_message.id}/"
        self.non_existent_url = "/api/v2/notifications/9999999/"

    def test_get_message_returns_401(self):
        """
        Test that endpoint returns 401 when an unauthenticated user accesses a particular message
        """
        response = self.client.get(self.url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_get_message_returns_403(self):
        """
        Test that endpoint returns 403 when one user accesses another user's messages
        """
        response = self.client.get(
            self.url,
            headers={"Authorization": self.test_sender_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["SubCode"], "AccessOtherUserMessage")

    def test_get_message_returns_404(self):
        """
        Test that endpoint returns 404 when a user accesses a non-existent message
        """
        response = self.client.get(
            self.non_existent_url,
            headers={"Authorization": self.test_sender_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["Error"], MESSAGES_NOT_FOUND)
        self.assertEqual(response_body["SubCode"], NOT_FOUND)

    def test_get_message_returns_200(self):
        """
        Test that endpoint returns 200 when a user successfully accesses their existent message
        """
        response = self.client.get(
            self.url,
            headers={"Authorization": self.test_receiver_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["subject"], TEST_SUBJECT)
        self.assertEqual(response_body["message"], TEST_MESSAGE)
        self.assertEqual(response_body["fromUsername"], self.test_sender.username)

    def test_delete_message_returns_401(self):
        """
        Test that endpoint returns 401 when an unauthenticated user deletes a message
        """
        response = self.client.delete(self.url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_delete_message_returns_403(self):
        """
        Test that endpoint returns 403 when a user deletes another user's message
        """
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_sender_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["SubCode"], "AccessOtherUserMessage")

    def test_delete_message_returns_404(self):
        """
        Test that endpoint returns 404 when a user deletes a non-existent message
        """
        response = self.client.delete(
            self.non_existent_url,
            headers={"Authorization": self.test_sender_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["Error"], MESSAGES_NOT_FOUND)
        self.assertEqual(response_body["SubCode"], NOT_FOUND)

    def test_delete_message_returns_200(self):
        """
        Test that endpoint returns 200 when a user successfully deletes their existent message
        """
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_receiver_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Message deleted")


class TestNotificationsAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.url = "/api/v2/notifications/"

    def test_get_message_notifications_returns_401(self):
        """
        Test that endpoint returns 401 when an unauthenticated user accesses messsage notifications
        """
        response = self.client.get(self.url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_get_messages_returns_200(self):
        """
        Test that endpoint returns 200 when authenticated user accesses their messsage notifications
        """
        response = self.client.get(
            self.url,
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 0)
        self.assertEqual(response_body["userMessages"], [])

        # setup - add a message
        self.test_message = create_canned_message(
            subject=TEST_SUBJECT, message=TEST_MESSAGE
        )
        self.test_message.to_user_id = self.test_user.id
        response = self.client.get(
            self.url,
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 1)
        user_messages = response_body["userMessages"][0]
        self.assertEqual(user_messages["subject"], TEST_SUBJECT)
        self.assertEqual(user_messages["message"], TEST_MESSAGE)


class TestNotificationsQueriesCountUnreadAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.url = "/api/v2/notifications/queries/own/count-unread/"
        self.test_message = create_canned_message(
            subject=TEST_SUBJECT, message=TEST_MESSAGE
        )
        self.test_message.to_user_id = self.test_user.id

    def test_get_unread_count_returns_401(self):
        """
        Test that endpoint returns 401 when an unauthenticated user wants to get the unread count
        """
        response = self.client.get(self.url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_get_unread_count_returns_200(self):
        """
        Test that endpoint returns 200 when an authenticated user successfully gets their unread count
        """
        response = self.client.get(
            self.url,
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, {"newMessages": True, "unread": 1})


class TestNotificationsQueriesPostUnreadAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.test_notification = create_canned_notification(
            user_id=self.test_user.id, unread_count=1, date=datetime.today()
        )
        self.url = "/api/v2/notifications/queries/own/post-unread/"

    def test_post_unread_count_returns_401(self):
        """
        Test that endpoint returns 401 when there is no user whose unread count should be updated
        """
        response = self.client.post(self.url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_post_unread_count_returns_200(self):
        """
        Test that endpoint returns 200 after updating an authenticated user's unread count
        """
        response = self.client.post(
            self.url, headers={"Authorization": self.test_user_token}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, 1)
