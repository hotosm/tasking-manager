from datetime import datetime, timedelta

from backend.models.postgis.task import Task, TaskStatus
from backend.services.campaign_service import CampaignService, CampaignProjectDTO


from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    return_canned_user,
    generate_encoded_token,
    create_canned_campaign,
    create_canned_project,
    create_canned_organisation,
)


class TestTasksStatisticsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.url = "/api/v2/tasks/statistics/"
        self.test_user = return_canned_user("test_user", 1111111)
        self.test_user.create()
        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.test_project_1, _ = create_canned_project()
        self.test_project_2, _ = create_canned_project()
        TestTasksStatisticsAPI.create_task_history(
            1, self.test_project_1.id, self.test_user.id, TaskStatus.MAPPED
        )
        TestTasksStatisticsAPI.create_task_history(
            2, self.test_project_1.id, self.test_user.id, TaskStatus.VALIDATED
        )
        TestTasksStatisticsAPI.create_task_history(
            3, self.test_project_2.id, self.test_user.id, TaskStatus.MAPPED
        )

    def test_returns_401_if_not_authenticated(self):
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_400_if_start_date_is_not_provided(self):
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "MissingDate")

    def test_returns_400_if_start_date_is_not_valid(self):
        """Test returns 400 if start date is not valid"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"startDate": "not a date"},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidDateValue")

    def test_returns_400_if_end_date_is_not_valid(self):
        """Test returns 400 if end date is not valid"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"startDate": "2020-01-01", "endDate": "not a date"},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidDateValue")

    def test_returns_400_if_start_date_is_after_end_date(self):
        """Test returns 400 if start date is after end date"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"startDate": "2020-01-02", "endDate": "2020-01-01"},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidDateRange")

    def test_returns_400_if_date_range_is_greater_than_1_year(self):
        """Test returns 400 if date range is greater than 1 year"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": "2019-01-01",
                "endDate": datetime.now().strftime("%Y-%m-%d"),
            },
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidDateRange")

    def test_returns_200_if_valid_date_range(self):
        """Test returns 200 if date range is valid"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.now() - timedelta(days=6 * 30)).strftime(
                    "%Y-%m-%d"
                )
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["taskStats"][0]["mapped"], 2)
        self.assertEqual(response.json["taskStats"][0]["validated"], 1)
        self.assertEqual(response.json["taskStats"][0]["badImagery"], 0)

    @staticmethod
    def create_task_history(task_id, project_id, user_id, action):
        """Create task history"""
        task = Task.get(task_id, project_id)
        if action in [TaskStatus.MAPPED, TaskStatus.BADIMAGERY]:
            task.lock_task_for_mapping(user_id)
        elif action == TaskStatus.VALIDATED:
            task.lock_task_for_validating(user_id)
        task.unlock_task(user_id, action)

    def test_filters_task_by_project(self):
        """Test filters task by project"""
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.now() - timedelta(days=6 * 30)).strftime(
                    "%Y-%m-%d"
                ),
                "projectId": self.test_project_1.id,
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["taskStats"][0]["mapped"], 1)
        self.assertEqual(response.json["taskStats"][0]["validated"], 1)
        self.assertEqual(response.json["taskStats"][0]["badImagery"], 0)

    def test_filters_by_multiple_projects(self):
        """Test filters by multiple projects"""
        # Arrange
        test_project_3, _ = create_canned_project()
        TestTasksStatisticsAPI.create_task_history(
            4, test_project_3.id, self.test_user.id, TaskStatus.MAPPED
        )
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.now() - timedelta(days=6 * 30)).strftime(
                    "%Y-%m-%d"
                ),
                "projectId": f"{self.test_project_1.id}, {self.test_project_2.id}",
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["taskStats"][0]["mapped"], 2)
        self.assertEqual(response.json["taskStats"][0]["validated"], 1)
        self.assertEqual(response.json["taskStats"][0]["badImagery"], 0)

    def test_filters_by_organisation_id(self):
        """Test filters by organisation id"""
        # Arrange
        test_organisation = create_canned_organisation()
        self.test_project_1.organisation_id = test_organisation.id
        self.test_project_1.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.now() - timedelta(days=6 * 30)).strftime(
                    "%Y-%m-%d"
                ),
                "organisationId": test_organisation.id,
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["taskStats"][0]["mapped"], 1)
        self.assertEqual(response.json["taskStats"][0]["validated"], 1)
        self.assertEqual(response.json["taskStats"][0]["badImagery"], 0)

    def test_filters_by_organisation_name(self):
        """Test filters by organisation name"""
        # Arrange
        test_organisation = create_canned_organisation()
        self.test_project_1.organisation_id = test_organisation.id
        self.test_project_1.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.now() - timedelta(days=6 * 30)).strftime(
                    "%Y-%m-%d"
                ),
                "organisationName": test_organisation.name,
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["taskStats"][0]["mapped"], 1)
        self.assertEqual(response.json["taskStats"][0]["validated"], 1)
        self.assertEqual(response.json["taskStats"][0]["badImagery"], 0)

    def test_filters_by_campaign(self):
        """Test filters by campaign"""
        # Arrange
        test_campaign = create_canned_campaign()
        campaign_dto = CampaignProjectDTO()
        campaign_dto.campaign_id = test_campaign.id
        campaign_dto.project_id = self.test_project_2.id
        CampaignService.create_campaign_project(campaign_dto)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.now() - timedelta(days=6 * 30)).strftime(
                    "%Y-%m-%d"
                ),
                "campaign": test_campaign.name,
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["taskStats"][0]["mapped"], 1)
        self.assertEqual(response.json["taskStats"][0]["validated"], 0)
        self.assertEqual(response.json["taskStats"][0]["badImagery"], 0)

    def test_filters_by_country(self):
        """Test filters by country"""
        # Arrange
        self.test_project_1.country = ["Nepal"]
        self.test_project_1.save()
        self.test_project_2.country = ["England"]
        self.test_project_2.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "startDate": (datetime.now() - timedelta(days=6 * 30)).strftime(
                    "%Y-%m-%d"
                ),
                "country": "Nepal",
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["taskStats"][0]["mapped"], 1)
        self.assertEqual(response.json["taskStats"][0]["validated"], 1)
        self.assertEqual(response.json["taskStats"][0]["badImagery"], 0)
