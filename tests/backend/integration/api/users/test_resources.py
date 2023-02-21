from backend.models.postgis.task import Task
from backend.models.postgis.statuses import UserGender

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    return_canned_user,
    generate_encoded_token,
    create_canned_project,
)


TEST_USERNAME = "test_user"
TEST_USER_ID = 1111111
TEST_EMAIL = "test@hotmail.com"


class TestUsersQueriesOwnLockedDetailsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = "/api/v2/users/queries/tasks/locked/details/"

    def test_returns_401_without_session_token(self):
        """ Test that the API returns 401 if no session token is provided """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_no_tasks_locked(self):
        """ Test that the API returns 404 if no task is locked by user"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["SubCode"], "NotFound")

    def test_returns_200_if_tasks_locked(self):
        """ Test that the API returns 200 if a task is locked by user """
        # Arrange
        # Lock a task
        test_project, _ = create_canned_project()
        task = Task.get(1, test_project.id)
        task.lock_task_for_mapping(self.user.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["tasks"]), 1)
        self.assertEqual(response.json["tasks"][0]["taskId"], 1)
        self.assertEqual(response.json["tasks"][0]["projectId"], test_project.id)


class TestUsersQueriesUsernameAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = f"/api/v2/users/queries/{self.user.username}/"

    def test_returns_401_without_session_token(self):
        """ Test that the API returns 401 if no session token is provided """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_user_not_found(self):
        """ Test that the API returns 404 if user is not found """
        # Act
        response = self.client.get(
            "/api/v2/users/queries/unknown_user/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["SubCode"], "NotFound")

    def test_returns_email_and_gender_if_own_info_requested(self):
        """ Test response contains email and gender info if user is requesting own info """
        # Arrange
        self.user.email_address = TEST_EMAIL
        self.user.gender = UserGender.MALE.value
        self.user.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["id"], TEST_USER_ID)
        self.assertEqual(response.json["username"], TEST_USERNAME)
        self.assertEqual(response.json["emailAddress"], TEST_EMAIL)
        self.assertEqual(response.json["gender"], UserGender.MALE.name)
        self.assertEqual(response.json["isEmailVerified"], False)
        self.assertEqual(response.json["selfDescriptionGender"], None)

    def test_email_and_gender_not_returned_if_requested_by_other(self):
        """Test response does not contain email and gender info if user is requesting info for another user"""
        # Arrange
        self.user.email_address = TEST_EMAIL
        self.user.gender = UserGender.FEMALE.value
        self.user.save()
        user_2 = return_canned_user("user_2", 2222222)
        user_2.create()
        user_2_session_token = generate_encoded_token(user_2.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": user_2_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["id"], TEST_USER_ID)
        self.assertEqual(response.json["username"], TEST_USERNAME)
        self.assertIsNone(response.json["emailAddress"])
        self.assertIsNone(response.json["gender"])
        self.assertIsNone(response.json["selfDescriptionGender"])
