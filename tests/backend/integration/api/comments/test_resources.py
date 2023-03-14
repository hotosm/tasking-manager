from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    generate_encoded_token,
    return_canned_user,
)
from backend.models.postgis.statuses import UserRole

TEST_MESSAGE = "Test comment"


class TestCommentsProjectsRestAPI(BaseTestCase):
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

    def test_post_comment_to_project_chat_passes(self):
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

    # get
    def test_get_chat_messages_of_non_existent_project_fails(self):
        """
        Test that endpoint returns 404 when retrieving the chat of a non-existent project
        """
        response = self.client.get(self.non_existent_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["Error"], "Project not found")
        self.assertEqual(response_body["SubCode"], "NotFound")

    def test_get_project_chat_messages_passes(self):
        """
        Test that endpoint returns 200 when retrieving the task chat of an existing project
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, {"chat": [], "pagination": None})
        # to do: add comments and test again


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
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response_body["Error"], "Task Not Found")
        self.assertEqual(response_body["SubCode"], "NotFound")

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
