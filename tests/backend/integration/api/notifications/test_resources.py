from datetime import datetime, timedelta

from tests.backend.base import BaseTestCase
from backend.models.postgis.message import MessageType
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    return_canned_user,
    create_canned_message,
    create_canned_notification,
    create_canned_project,
)

from backend.exceptions import get_message_from_sub_code

TEST_SUBJECT = "Test subject"
TEST_MESSAGE = "This is a test message"
NOT_FOUND_SUB_CODE = "MESSAGE_NOT_FOUND"
NOT_FOUND_MESSAGE = get_message_from_sub_code(NOT_FOUND_SUB_CODE)
OLDER_TEST_SUBJECT = "Older Test Subject"
OLDER_TEST_MESSAGE = "This is an older test message"


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
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], NOT_FOUND_SUB_CODE)

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
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], NOT_FOUND_SUB_CODE)

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

    def test_get_messages_no_query_params_returns_200(self):
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

        # setup - add a broadcast message
        self.test_message = create_canned_message(
            subject=TEST_SUBJECT,
            message=TEST_MESSAGE,
            message_type=MessageType.BROADCAST.value,
        )
        self.test_message.to_user_id = self.test_user.id
        response = self.client.get(
            self.url,
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["pagination"]["page"], 1)
        self.assertEqual(response_body["pagination"]["pages"], 1)
        self.assertEqual(response_body["pagination"]["perPage"], 10)
        self.assertEqual(len(response_body["userMessages"]), 1)
        user_messages = response_body["userMessages"][0]
        self.assertEqual(user_messages["subject"], TEST_SUBJECT)
        self.assertEqual(user_messages["message"], TEST_MESSAGE)
        self.assertEqual(user_messages["messageType"], MessageType.BROADCAST.name)

    def test_get_messages_with_query_params_returns_200(self):
        """
        Test that endpoint returns 200 when authenticated user accesses their messsage notifications
        depending on the query parameter filters
        """
        # SETUP:- add a broadcast message
        self.test_message = create_canned_message(
            subject=TEST_SUBJECT,
            message=TEST_MESSAGE,
            message_type=MessageType.BROADCAST.value,
        )
        self.test_message.to_user_id = self.test_user.id
        self.test_message.date = datetime.utcnow()

        # ?from=
        # no messages expected since user is not the sender
        # ACT
        response = self.client.get(
            f"{self.url}?from={self.test_user.username}",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 0)
        # SETUP: set user as sender of the message
        self.test_message.from_user_id = self.test_user.id
        # ACT
        response = self.client.get(
            f"{self.url}?from={self.test_user.username}",
            headers={"Authorization": self.test_user_token},
        )
        # 1 message expected since user is the sender
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 1)

        # ?project=
        # setup: project
        self.test_project, _ = create_canned_project()
        # no messages expected since message is not affiliated to any project
        # ACT
        response = self.client.get(
            f"{self.url}?project={self.test_project.id}",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 0)
        # SETUP: project affiliation
        self.test_message.project_id = self.test_project.id
        # 1 message expected since message is affiliated to a project
        # ACT
        response = self.client.get(
            f"{self.url}?project={self.test_project.id}",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 1)

        # ?taskId=
        # no messages expected since message is not affiliated to any task
        # ACT
        response = self.client.get(
            f"{self.url}?taskId=1",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 0)
        # SETUP: task affiliation
        self.test_message.task_id = 1
        # 1 message expected since message is affiliated to a project
        # ACT
        response = self.client.get(
            f"{self.url}?taskId=1",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 1)

        # ?project=&taskId=
        # no messages expected since message is not affiliated to unknown task in the project
        # ACT
        response = self.client.get(
            f"{self.url}?project={self.test_project.id}&taskId=1111",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 0)
        # 1 message expected since message is affiliated to task 1 in the project
        # ACT
        response = self.client.get(
            f"{self.url}?project={self.test_project.id}&taskId=1",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 1)

        # ?messageType=
        # ?messageType=1 - no message expected
        # ACT
        response = self.client.get(
            f"{self.url}?messageType=1",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 0)
        # ?messageType=2 - 1 message expected
        # ACT
        response = self.client.get(
            f"{self.url}?messageType=2",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 1)
        # ?messageType=1,2,3,4,5 - 1 message expected
        # ACT
        response = self.client.get(
            f"{self.url}?messageType=1,2,3,4,5",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["userMessages"]), 1)

        # ?status
        self.test_message.read = False  # SETUP: unread message
        # ?status=unread
        # ACT
        response = self.client.get(
            f"{self.url}?status=unread",
            headers={"Authorization": self.test_user_token},
        )
        unread_response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(unread_response_body["userMessages"]), 1)
        # ?status=read
        # ACT
        response = self.client.get(
            f"{self.url}?status=read",
            headers={"Authorization": self.test_user_token},
        )
        read_response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(read_response_body["userMessages"]), 0)

        # SETUP: add older message
        self.test_older_message = create_canned_message(
            subject=OLDER_TEST_SUBJECT,
            message=OLDER_TEST_MESSAGE,
            message_type=MessageType.MENTION_NOTIFICATION.value,
        )
        self.test_older_message.date = datetime.utcnow() - timedelta(days=6)
        self.test_older_message.to_user_id = self.test_user.id

        # ?sortBy=date
        # ACT
        response = self.client.get(
            f"{self.url}?sortBy=date",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        user_messages = response_body["userMessages"]
        self.assertEqual(len(user_messages), 2)
        # 1st message
        self.assertEqual(user_messages[0]["subject"], TEST_SUBJECT)
        self.assertEqual(user_messages[0]["message"], TEST_MESSAGE)
        self.assertEqual(user_messages[0]["messageType"], MessageType.BROADCAST.name)
        # 2nd message
        self.assertEqual(user_messages[1]["subject"], OLDER_TEST_SUBJECT)
        self.assertEqual(user_messages[1]["message"], OLDER_TEST_MESSAGE)
        self.assertEqual(
            user_messages[1]["messageType"], MessageType.MENTION_NOTIFICATION.name
        )

        # ?sortDirection
        # ?sortDirection=desc - Descending order
        # ACT
        response = self.client.get(
            f"{self.url}?sortDirection=desc",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        user_messages = response_body["userMessages"]
        self.assertEqual(len(user_messages), 2)
        self.assertGreater(user_messages[0]["sentDate"], user_messages[1]["sentDate"])
        # 1st message
        self.assertEqual(user_messages[0]["subject"], TEST_SUBJECT)
        self.assertEqual(user_messages[0]["message"], TEST_MESSAGE)
        self.assertEqual(user_messages[0]["messageType"], MessageType.BROADCAST.name)
        # 2nd message
        self.assertEqual(user_messages[1]["subject"], OLDER_TEST_SUBJECT)
        self.assertEqual(user_messages[1]["message"], OLDER_TEST_MESSAGE)
        self.assertEqual(
            user_messages[1]["messageType"], MessageType.MENTION_NOTIFICATION.name
        )

        # ?sortDirection=asc - Ascending order
        # ACT
        response = self.client.get(
            f"{self.url}?sortDirection=asc",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        user_messages = response_body["userMessages"]
        self.assertEqual(len(user_messages), 2)
        self.assertLess(user_messages[0]["sentDate"], user_messages[1]["sentDate"])
        # 1st message
        self.assertEqual(user_messages[0]["subject"], OLDER_TEST_SUBJECT)
        self.assertEqual(user_messages[0]["message"], OLDER_TEST_MESSAGE)
        self.assertEqual(
            user_messages[0]["messageType"], MessageType.MENTION_NOTIFICATION.name
        )
        # 2nd message
        self.assertEqual(user_messages[1]["subject"], TEST_SUBJECT)
        self.assertEqual(user_messages[1]["message"], TEST_MESSAGE)
        self.assertEqual(user_messages[1]["messageType"], MessageType.BROADCAST.name)


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
