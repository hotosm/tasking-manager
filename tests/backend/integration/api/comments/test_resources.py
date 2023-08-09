from unittest.mock import patch

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    generate_encoded_token,
    return_canned_user,
)
from backend.exceptions import NotFound, get_message_from_sub_code
from backend.models.postgis.statuses import UserRole
from backend.services.messaging.chat_service import ChatService, ChatMessageDTO
from backend.services.messaging.message_service import MessageService


TEST_MESSAGE = "Test comment"
PROJECT_NOT_FOUND_SUB_CODE = "PROJECT_NOT_FOUND"
TASK_NOT_FOUND_SUB_CODE = "TASK_NOT_FOUND"
MESSAGE_NOT_FOUND_SUB_CODE = "MESSAGE_NOT_FOUND"
PROJECT_NOT_FOUND_MESSAGE = get_message_from_sub_code(PROJECT_NOT_FOUND_SUB_CODE)
TASK_NOT_FOUND_MESSAGE = get_message_from_sub_code(TASK_NOT_FOUND_SUB_CODE)
MESSAGE_NOT_FOUND_MESSAGE = get_message_from_sub_code(MESSAGE_NOT_FOUND_SUB_CODE)


class TestCommentsProjectsAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_token = generate_encoded_token(self.test_author.id)
        self.endpoint_url = f"/api/v2/projects/{self.test_project.id}/comments/"
        self.non_existent_url = "/api/v2/projects/99/comments/"

    # post
    def test_post_comment_to_project_chat_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when an unauthenticated user posts a comment to project chat
        """
        response = self.client.post(self.endpoint_url, json={"message": TEST_MESSAGE})
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_post_comment_to_project_chat_by_blocked_user_fails(self):
        """
        Test that endpoint returns 403 when a blocked user posts a comment to project chat
        """
        # setup
        self.test_user = return_canned_user(username="test_user", id=33333)
        self.test_user.create()
        self.test_user.role = UserRole.READ_ONLY.value
        # action
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": generate_encoded_token(self.test_user.id)},
            json={"message": TEST_MESSAGE},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], "User is on read only mode")
        self.assertEqual(response_body["SubCode"], "ReadOnly")

    def test_invalid_request_to_post_comment_to_project_chat_fails(self):
        """
        Test that endpoint returns 400 when an invalid request to post a comment to the project chat is made
        """
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"comment": TEST_MESSAGE},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["Error"], "Unable to add chat message")
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_post_comment_to_chat_of_non_existent_project_fails(self):
        """
        Test that endpoint returns 404 when user fails to post a comment to a non-existent project chat
        """
        response = self.client.post(
            self.non_existent_url,
            headers={"Authorization": self.test_author_token},
            json={"comment": TEST_MESSAGE},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["Error"], "Unable to add chat message")
        self.assertEqual(response_body["SubCode"], "InvalidData")

    @patch.object(MessageService, "send_message_after_chat")
    def test_post_comment_to_project_chat_passes(self, mock_send_message):
        """
        Test that endpoint returns 201 when user successfully posts a comment to the project chat
        """
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"message": TEST_MESSAGE},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response_body["chat"]), 1)
        chat_details = response_body["chat"][0]
        self.assertEqual(chat_details["message"], "<p>Test comment</p>")
        mock_send_message.assert_called_once()

    # get
    def test_get_chat_messages_of_non_existent_project_fails(self):
        """
        Test that endpoint returns 404 when retrieving the chat of a non-existent project
        """
        response = self.client.get(self.non_existent_url)
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], PROJECT_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], PROJECT_NOT_FOUND_SUB_CODE)

    def test_get_project_chat_messages_passes(self):
        """
        Test that endpoint returns 200 when retrieving the task chat of an existing project
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, {"chat": [], "pagination": None})
        # to do: add comments and test again


class TestCommentsProjectsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_token = generate_encoded_token(self.test_author.id)
        self.test_user = return_canned_user(username="test_user", id=10000)
        self.test_user.create()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.test_comment = self.create_project_chat(self.test_author)
        self.endpoint_url = (
            f"/api/v2/projects/{self.test_project.id}/comments/{self.test_comment.id}/"
        )
        self.non_existent_url = f"/api/v2/projects/{self.test_project.id}/comments/100/"

    def create_project_chat(self, user):
        """
        Helper method to create a project chat for a user for testing
        ----------------
        :param user: User object
        :return: Comment object
        """
        chat_dto = ChatMessageDTO()
        chat_dto.message = "Test Message"
        chat_dto.user_id = user.id
        chat_dto.project_id = self.test_project.id
        chat_dto.timestamp = "2022-06-30T05:45:06.198755Z"
        chat_dto.username = user.username
        comments = ChatService.post_message(
            chat_dto, self.test_project.id, self.test_author.id
        )
        return comments.chat[0]

    # delete
    def test_delete_comment_returns_401_if_user_not_logged_in(self):
        """
        Test that endpoint returns 401 when deleting a comment of a project by an unauthenticated user
        """
        # Act
        response = self.client.delete(self.endpoint_url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_delete_non_existent_comment_fails(self):
        """Test that endpoint returns 404 when deleting a non-existent comment"""
        # Act
        response = self.client.delete(
            self.non_existent_url, headers={"Authorization": self.test_author_token}
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], MESSAGE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], MESSAGE_NOT_FOUND_SUB_CODE)

    def test_returns_403_if_user_not_allowed_to_delete_comment(self):
        """
        Test that endpoint returns 403 when deleting a comment
        by a user who is not allowed i.e. not the comment author or PM.
        """
        # Act
        response = self.client.delete(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        # Assert
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], " User not allowed to delete message")
        self.assertEqual(response_body["SubCode"], "DeletePermissionError")

    def test_comment_can_be_deleted_by_author(self):
        """Test that endpoint returns 200 when deleting a comment of a project by the comment author"""
        # Arrange
        # Let's create a comment by the test user and delete it using the test user
        test_comment = self.create_project_chat(self.test_user)
        endpoint_url = (
            f"/api/v2/projects/{self.test_project.id}/comments/{test_comment.id}/"
        )
        # Act
        response = self.client.delete(
            endpoint_url, headers={"Authorization": self.test_user_token}
        )
        response_body = response.get_json()
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Comment deleted")
        with self.assertRaises(NotFound):
            ChatService.get_project_chat_by_id(self.test_project.id, test_comment.id)

    def test_pm_can_delete_any_comment(self):
        """Test that endpoint returns 200 when deleting a comment of a project by the PM"""
        # Arrange
        # Let's create a comment by the test user and delete it using the test author
        test_comment = self.create_project_chat(self.test_user)
        endpoint_url = (
            f"/api/v2/projects/{self.test_project.id}/comments/{test_comment.id}/"
        )
        # Act
        response = self.client.delete(
            endpoint_url, headers={"Authorization": self.test_author_token}
        )
        response_body = response.get_json()
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Comment deleted")
        with self.assertRaises(NotFound):
            ChatService.get_project_chat_by_id(self.test_project.id, test_comment.id)


class TestCommentsTasksRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_token = generate_encoded_token(self.test_author.id)
        self.endpoint_url = f"/api/v2/projects/{self.test_project.id}/comments/tasks/1/"
        self.non_existent_url = "/api/v2/projects/99/comments/tasks/1/"

    # post
    def test_post_comment_to_task_chat_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when an unauthenticated user posts a comment to the task chat
        """
        response = self.client.post(self.endpoint_url, json={"comment": TEST_MESSAGE})
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_post_comment_to_task_chat_by_blocked_user_fails(self):
        """
        Test that endpoint returns 403 when a blocked user posts a comment to the task chat
        """
        # setup
        self.test_user = return_canned_user("test_user", 33333)
        self.test_user.create()
        self.test_user.role = UserRole.READ_ONLY.value
        # action
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": generate_encoded_token(self.test_user.id)},
            json={"comment": TEST_MESSAGE},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], "User is on read only mode")
        self.assertEqual(response_body["SubCode"], "ReadOnly")

    def test_post_comment_to_task_chat_using_an_invalid_request_fails(self):
        """
        Test that endpoint returns 400 when an invalid request to post a comment to the task chat is made
        """
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"message": TEST_MESSAGE},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["Error"], "Unable to add comment")
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_post_comment_to_task_chat_of_non_existent_project_fails(self):
        """
        Test that endpoint returns 404 when user fails to post a comment to a non-existent project task chat
        """
        response = self.client.post(
            self.non_existent_url,
            headers={"Authorization": self.test_author_token},
            json={"comment": TEST_MESSAGE},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], PROJECT_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], PROJECT_NOT_FOUND_SUB_CODE)

    def test_post_comment_to_task_chat_passes(self):
        """
        Test that endpoint returns 201 when user successfully posts a comment to the task chat
        """
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"comment": TEST_MESSAGE},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response_body["taskId"], 1)

    # GET method: no tests
    # Reason: not fully implemented
    # backend/api/comments/resources.py L228
