from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    return_canned_campaign,
    create_canned_project,
    return_canned_user,
    generate_encoded_token,
)
from backend.models.dtos.campaign_dto import CampaignProjectDTO
from backend.services.campaign_service import CampaignService


class TestGetProjectsCampaignsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_campaign = return_canned_campaign()
        self.test_campaign.create()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/campaigns/"

    def test_404_if_project_not_found(self):
        # Act
        response = self.client.get("/api/v2/projects/999999/campaigns/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_200_if_project_found(self):
        # Arrange
        campaign_dto = CampaignProjectDTO()
        campaign_dto.campaign_id = self.test_campaign.id
        campaign_dto.project_id = self.test_project.id
        CampaignService.create_campaign_project(campaign_dto)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["campaigns"]), 1)
        self.assertEqual(response.json["campaigns"][0]["id"], campaign_dto.campaign_id)
        self.assertEqual(response.json["campaigns"][0]["name"], self.test_campaign.name)


class TestCAddCampaignProjectAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_campaign = return_canned_campaign()
        self.test_campaign.create()
        self.test_project, self.test_author = create_canned_project()
        self.test_user = return_canned_user("test_user", 11111111)
        self.test_user.create()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/campaigns/{self.test_campaign.id}/"

    def test_401_if_not_logged_in(self):
        """Test that a user who is not logged in cannot assign a campaign to a project"""
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_403_if_not_project_manager(self):
        """Test that a user who is not a project manager cannot assign a campaign to a project"""
        # Act
        response = self.client.post(
            self.url, headers={"Authorization": self.test_user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_404_if_project_not_found(self):
        """Test that a user who is a project manager cannot assign a campaign to a non-existent project"""
        # Act
        response = self.client.post(
            f"/api/v2/projects/999999/campaigns/{self.test_campaign.id}/",
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_404_if_campaign_not_found(self):
        """Test that a user who is a project manager cannot assign a non-existent campaign to a project"""
        # Act
        response = self.client.post(
            f"/api/v2/projects/{self.test_project.id}/campaigns/999999/",
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_200_if_campaign_added(self):
        """Test that a user who is a project manager can assign a campaign to a project"""
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        project_campaigns = CampaignService.get_project_campaigns_as_dto(
            self.test_project.id
        )["campaigns"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(project_campaigns[0]["id"], self.test_campaign.id)
        self.assertEqual(project_campaigns[0]["name"], self.test_campaign.name)

    def test_200_if_campaign_already_added(self):
        """Test that a user who is a project manager can assign a campaign to a project"""
        # Arrange
        campaign_dto = CampaignProjectDTO()
        campaign_dto.campaign_id = self.test_campaign.id
        campaign_dto.project_id = self.test_project.id
        CampaignService.create_campaign_project(campaign_dto)
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)

    def test_200_if_campaign_already_added_to_another_project(self):
        """Test that a user who is a project manager can assign a campaign to a project"""
        # Arrange
        test_project_2, _ = create_canned_project()
        campaign_dto = CampaignProjectDTO()
        campaign_dto.campaign_id = self.test_campaign.id
        campaign_dto.project_id = test_project_2.id
        CampaignService.create_campaign_project(campaign_dto)
        # Act
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)


class TestDeleteCampaignProjectAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_campaign = return_canned_campaign()
        self.test_campaign.create()
        self.test_project, self.test_author = create_canned_project()
        self.test_user = return_canned_user("test_user", 11111111)
        self.test_user.create()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/campaigns/{self.test_campaign.id}/"

    def test_401_if_not_logged_in(self):
        """Test that a user who is not logged in cannot remove a campaign from a project"""
        # Act
        response = self.client.delete(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_403_if_not_project_manager(self):
        """Test that a user who is not a project manager cannot remove a campaign from a project"""
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_404_if_project_not_found(self):
        """Test that a user who is a project manager cannot remove a campaign from a non-existent project"""
        # Act
        response = self.client.delete(
            f"/api/v2/projects/999999/campaigns/{self.test_campaign.id}/",
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_404_if_campaign_not_found(self):
        """Test that a user who is a project manager cannot remove a non-existent campaign from a project"""
        # Act
        response = self.client.delete(
            f"/api/v2/projects/{self.test_project.id}/campaigns/999999/",
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_404_if_campaign_not_assigned_to_project(self):
        """Test cannot remove a campaign from a project that it is not assigned to"""
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_200_if_campaign_removed(self):
        """Test that a user who is a project manager can remove a campaign from a project"""
        # Arrange
        campaign_dto = CampaignProjectDTO()
        campaign_dto.campaign_id = self.test_campaign.id
        campaign_dto.project_id = self.test_project.id
        CampaignService.create_campaign_project(campaign_dto)
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_author_session_token},
        )
        # Assert
        project_campaigns = CampaignService.get_project_campaigns_as_dto(
            self.test_project.id
        )["campaigns"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(project_campaigns), 0)
