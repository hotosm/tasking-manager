import time
import random
from datetime import datetime, timedelta

from backend.models.postgis.task import Task, TaskStatus
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    generate_encoded_token,
    return_canned_user,
)
from tests.backend.integration.api.users.test_resources import USER_NOT_FOUND_SUB_CODE


class TestUsersStatisticsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_user = create_canned_project()
        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.url = f"/api/v2/users/{self.test_user.username}/statistics/"

    def test_returns_401_if_no_token(self):
        """Test that the user needs to be logged in."""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_return_404_if_user_not_found(self):
        """Test returns 404 if user not found."""
        # Act
        response = self.client.get(
            "/api/v2/users/doesntexist/statistics/",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["error"]["sub_code"], USER_NOT_FOUND_SUB_CODE)

    def test_return_200_if_user_found(self):
        """Test returns 200 if user found."""
        # Arrange
        task = Task.get(1, self.test_project.id)
        task.lock_task_for_mapping(self.test_user.id)
        time.sleep(5)
        task.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["totalTimeSpent"], 5)
        self.assertEqual(response.json["timeSpentMapping"], 5)
        self.assertEqual(response.json["timeSpentValidating"], 0)
        self.assertEqual(response.json["projectsMapped"], 0)
        self.assertEqual(response.json["countriesContributed"]["total"], 0)
        self.assertEqual(response.json["tasksMapped"], 1)
        self.assertEqual(response.json["tasksValidated"], 0)
        self.assertEqual(response.json["tasksInvalidated"], 0)
        self.assertEqual(response.json["tasksInvalidatedByOthers"], 0)
        self.assertEqual(response.json["tasksValidatedByOthers"], 0)
        self.assertEqual(response.json["ContributionsByInterest"], [])


class TestUsersStatisticsAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_user = create_canned_project()
        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.url = "/api/v2/users/statistics/"

    def generate_random_user_level(self):
        return random.randint(1, 3)

    def test_returns_401_if_no_token(self):
        """Test that the user needs to be logged in."""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def returns_400_if_start_date_not_provided(self):
        """Test that the start date needs to be provided."""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "MissingDate")

    def returns_400_if_invalid_date_value(self):
        """Test that the date should be in date format"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"startDate": "invalid"},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidDateValue")

    def returns_400_if_start_date_greater_than_end_date(self):
        """Test that the start date cannot be greater than the end date."""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"startDate": "2020-01-01", "endDate": "2019-01-01"},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidDateRange")

    def test_returns_400_if_date_range_greater_than_3_years(self):
        """Test that the date range cannot be greater than 3 years."""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"startDate": "2017-01-01", "endDate": "2021-01-01"},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidDateRange")

    def test_returns_all_users_statistics(self):
        """Test that the statistics for all users that registerd in the give priod are returned."""
        # Arrange
        mapping_level_dict = {1: 0, 2: 0, 3: 0}
        #  Create 10 users with random mapping levels
        for i in range(10):
            user = return_canned_user(f"user_{i}", i)
            user.mapping_level = self.generate_random_user_level()
            mapping_level_dict[user.mapping_level] += 1
            user.date_registered = datetime.today() - timedelta(days=100)
            user.create()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.today() - timedelta(days=100)).strftime(
                    "%Y-%m-%d"
                ),
                "endDate": datetime.now().strftime("%Y-%m-%d"),
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["total"], 10)
        self.assertEqual(response.json["beginner"], mapping_level_dict[1])
        self.assertEqual(response.json["intermediate"], mapping_level_dict[2])
        self.assertEqual(response.json["advanced"], mapping_level_dict[3])
