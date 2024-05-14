from backend.models.postgis.task import Task, TaskStatus
from backend.models.postgis.statuses import UserGender, UserRole, MappingLevel
from backend.exceptions import get_message_from_sub_code


from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    return_canned_user,
    generate_encoded_token,
    create_canned_project,
    create_canned_interest,
)


TEST_USERNAME = "test_user"
TEST_USER_ID = 1111111
TEST_EMAIL = "test@hotmail.com"
USER_NOT_FOUND_SUB_CODE = "USER_NOT_FOUND"
USER_NOT_FOUND_MESSAGE = get_message_from_sub_code(USER_NOT_FOUND_SUB_CODE)


class TestUsersQueriesOwnLockedDetailsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = "/api/v2/users/queries/tasks/locked/details/"

    def test_returns_401_without_session_token(self):
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_no_tasks_locked(self):
        """Test that the API returns 404 if no task is locked by user"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["error"]["sub_code"], "TASK_NOT_FOUND")

    def test_returns_200_if_tasks_locked(self):
        """Test that the API returns 200 if a task is locked by user"""
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
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_user_not_found(self):
        """Test that the API returns 404 if user is not found"""
        # Act
        response = self.client.get(
            "/api/v2/users/queries/unknown_user/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["error"]["sub_code"], USER_NOT_FOUND_SUB_CODE)

    @staticmethod
    def assert_user_detail_response(
        response,
        user_id=TEST_USER_ID,
        username=TEST_USERNAME,
        email=TEST_EMAIL,
        gender=None,
        own_info=True,
    ):
        assert response.status_code == 200
        assert response.json["id"] == user_id
        assert response.json["username"] == username
        if not own_info:
            assert response.json["emailAddress"] is None
            assert response.json["gender"] is None
            assert response.json["selfDescriptionGender"] is None
        else:
            assert response.json["emailAddress"] == email
            assert response.json["gender"] == gender
            assert response.json["isEmailVerified"] is False

    def test_returns_email_and_gender_if_own_info_requested(self):
        """Test response contains email and gender info if user is requesting own info"""
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
        TestUsersQueriesUsernameAPI.assert_user_detail_response(
            response,
            TEST_USER_ID,
            TEST_USERNAME,
            TEST_EMAIL,
            UserGender.MALE.name,
            True,
        )

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
        TestUsersQueriesUsernameAPI.assert_user_detail_response(
            response, TEST_USER_ID, TEST_USERNAME, None, None, False
        )


class TestUsersQueriesOwnLockedAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = "/api/v2/users/queries/tasks/locked/"

    def test_returns_401_without_session_token(self):
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_empty_list_if_no_tasks_locked(self):
        """Test that the API returns empty list if no task is locked by user"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["lockedTasks"], [])
        self.assertEqual(response.json["projectId"], None)
        self.assertEqual(response.json["taskStatus"], None)

    def test_returns_locked_task_if_tasks_locked(self):
        """Test that the API returns locked task if a task is locked by user"""
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
        self.assertEqual(len(response.json["lockedTasks"]), 1)
        self.assertEqual(response.json["lockedTasks"][0], 1)
        self.assertEqual(response.json["projectId"], test_project.id)
        self.assertEqual(
            response.json["taskStatus"], TaskStatus.LOCKED_FOR_MAPPING.name
        )


class UsersQueriesInterestsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = f"/api/v2/users/{self.user.username}/queries/interests/"

    def test_returns_401_without_session_token(self):
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_empty_list_if_no_interests(self):
        """Test that the API returns empty list if user has no interests"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["interests"], [])

    def test_returns_404_if_user_not_found(self):
        """Test that the API returns 404 if user is not found"""
        # Act
        response = self.client.get(
            "/api/v2/users/invalid_username/queries/interests/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["error"]["sub_code"], USER_NOT_FOUND_SUB_CODE)

    def test_returns_user_interests_if_interest_found(self):
        """Test that the API returns user interests if user has interests"""
        # Arrange
        interest_1 = create_canned_interest("interest_1")
        interest_2 = create_canned_interest("interest_2")
        self.user.create_or_update_interests([interest_1.id, interest_2.id])
        self.user.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["interests"]), 2)
        self.assertEqual(response.json["interests"][0]["id"], interest_1.id)
        self.assertEqual(response.json["interests"][0]["name"], interest_1.name)
        self.assertEqual(response.json["interests"][1]["id"], interest_2.id)
        self.assertEqual(response.json["interests"][1]["name"], interest_2.name)


class TestUsersQueriesUsernameFilterAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_2 = return_canned_user("user_2", 2222222)
        self.user_2.create()
        self.user_3 = return_canned_user("user_3", 3333333)
        self.user_3.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = "/api/v2/users/queries/filter/tes/"

    def test_returns_401_without_session_token(self):
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_no_users_found(self):
        """Test that the API returns 404 if no users found"""
        # Act
        response = self.client.get(
            "/api/v2/users/queries/filter/invalid_username/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["error"]["sub_code"], USER_NOT_FOUND_SUB_CODE)

    def test_returns_users_if_users_found(self):
        """Test that the API returns users if users found"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertListEqual(
            list(response.json.keys()), ["pagination", "usernames", "users"]
        )
        self.assertEqual(len(response.json["usernames"]), 1)
        self.assertEqual(response.json["usernames"][0], self.user.username)
        self.assertEqual(response.json["pagination"]["page"], 1)
        self.assertEqual(response.json["pagination"]["perPage"], 20)
        self.assertEqual(response.json["pagination"]["total"], 1)

    def test_returnns_matching_project_contributors(self):
        """Test that the API returns matching project contributors"""
        # Arrange
        test_project, _ = create_canned_project()
        task = Task.get(1, test_project.id)
        task.lock_task_for_mapping(self.user_2.id)
        task.unlock_task(self.user_2.id, TaskStatus.MAPPED)
        # Act
        response = self.client.get(
            f"/api/v2/users/queries/filter/user_/?projectId={test_project.id}",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["usernames"]), 2)
        self.assertEqual(response.json["usernames"][0], self.user_2.username)
        self.assertEqual(response.json["usernames"][1], self.user_3.username)
        self.assertEqual(response.json["users"][0]["username"], self.user_2.username)
        self.assertEqual(response.json["users"][0]["projectId"], test_project.id)


class TestUsersAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        for i in range(30):
            user = return_canned_user(f"user_{i}", i)
            user.create()
        self.url = "/api/v2/users/"

    def test_returns_401_without_session_token(self):
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_400_if_invalid_data(self):
        """Test that the API returns 400 if invalid data is provided"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"role": "GOD"},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidData")

    def test_returns_per_page_20_users_by_default(self):
        """Test that the API paginates and returns 20 users by default"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["users"]), 20)
        self.assertEqual(response.json["pagination"]["page"], 1)
        self.assertEqual(response.json["pagination"]["perPage"], 20)
        self.assertEqual(response.json["pagination"]["total"], 31)

    def test_pagination_can_be_disabled(self):
        """Test that the API can return all users if pagination is disabled"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"pagination": "false"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["users"]), 31)

    def test_returns_specified_per_page_users(self):
        """Test that the API returns specified per page users"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"perPage": 10},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["users"]), 10)
        self.assertEqual(response.json["pagination"]["page"], 1)
        self.assertEqual(response.json["pagination"]["perPage"], 10)
        self.assertEqual(response.json["pagination"]["total"], 31)
        self.assertEqual(response.json["pagination"]["hasNext"], True)
        self.assertEqual(response.json["pagination"]["pages"], 4)

    def test_returns_specified_page_users(self):
        """Test that the API returns specified page users"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"page": 2},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["users"]), 11)
        self.assertEqual(response.json["pagination"]["page"], 2)
        self.assertEqual(response.json["pagination"]["hasNext"], False)
        self.assertEqual(response.json["pagination"]["hasPrev"], True)
        self.assertEqual(response.json["pagination"]["pages"], 2)

    def test_returns_users_with_specified_role_(self):
        """Test that the API returns users with specified role"""
        # Arrange
        self.user.role = UserRole.ADMIN.value
        self.user.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"role": "ADMIN"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["users"]), 1)
        self.assertEqual(response.json["pagination"]["page"], 1)
        self.assertEqual(response.json["pagination"]["total"], 1)

    def test_returns_users_with_specified_level(self):
        """Test that the API returns users with specified level"""
        # Arrange
        self.user.mapping_level = MappingLevel.ADVANCED.value
        self.user.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"level": "ADVANCED"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["users"]), 1)
        self.assertEqual(response.json["pagination"]["page"], 1)
        self.assertEqual(response.json["pagination"]["total"], 1)


class TestUsersRecommendedProjectsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = f"/api/v2/users/{self.user.username}/recommended-projects/"

    def test_returns_401_without_session_token(self):
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_user_does_not_exist(self):
        """Test that the API returns 404 if user does not exist"""
        # Act
        response = self.client.get(
            "api/v2/users/non_existent/recommended-projects/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_recommended_projects(self):
        """Test that the API returns recommended projects"""
        # Arrange
        project, _ = create_canned_project()
        project.create()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)


class TestUsersRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = return_canned_user(TEST_USERNAME, TEST_USER_ID)
        self.user.create()
        self.user_session_token = generate_encoded_token(TEST_USER_ID)
        self.url = f"/api/v2/users/{self.user.id}/"

    def test_returns_401_without_session_token(self):
        """Test that the API returns 401 if no session token is provided"""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_user_does_not_exist(self):
        """Test that the API returns 404 if user does not exist"""
        # Act
        response = self.client.get(
            "/api/v2/users/999/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_email_and_gender_if_own_info_requested(self):
        """Test response contains all user info if user is requesting own info"""
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
        TestUsersQueriesUsernameAPI.assert_user_detail_response(
            response,
            TEST_USER_ID,
            TEST_USERNAME,
            TEST_EMAIL,
            UserGender.MALE.name,
            True,
        )

    def test_email_and_gender_not_returned_if_requested_by_other(self):
        """Test response does not sensetive info if user is requesting info for another user"""
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
        TestUsersQueriesUsernameAPI.assert_user_detail_response(
            response, TEST_USER_ID, TEST_USERNAME, None, None, False
        )
