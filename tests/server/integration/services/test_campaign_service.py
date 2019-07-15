import os
import unittest

from server import create_app

from server.services.campaign_service import CampaignService
from tests.server.helpers.test_helpers import create_canned_project
from server.models.dtos.campaign_dto import CampaignDTO, CampaignProjectDTO

class TestCampaignService(unittest.TestCase):
    skip_tests = False
    test_user = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('CI', 'false')

        # Firewall rules mean we can't hit Postgres from CI so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.test_project, self.test_user = create_canned_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.test_user.delete()
        self.ctx.pop()

    def test_assign_campaign_to_project(self):
        if self.skip_tests:
            return

        #  Create Campaign
        campaign_dto = CampaignDTO()
        campaign_dto.name = 'test_campaign'
        campaign_dto.logo = 'test_logo'
        campaign_dto.url = 'test_url'
        campaign_dto.description = 'test_description'

        self.test_campaign = CampaignService.create_campaign(campaign_dto)

        # Assert
        self.assertIsNotNone(self.test_campaign, 'Campaign is created')            

        # Assign campaign to project
        campaign_project_dto = CampaignProjectDTO()
        campaign_project_dto.campaign_id = self.test_campaign.id
        campaign_project_dto.project_id = self.test_project.id

        self.campaign_projects = CampaignService.create_campaign_project(campaign_project_dto)
        
        # Assert
        self.assertIsNotNone(self.campaign_projects, 'Test campaign is assigned\
        to the test project')
        
        CampaignService.delete_project_campaign(self.test_project.id, self.test_campaign.id)
        self.test_campaign.delete()

    def test_get_all_campaigns(self):
        if self.skip_tests:
            return

        # Get all campaigns
        self.campaign_list_dto = CampaignService.get_all_campaigns()

        # Assert
        self.assertNotEqual(self.campaign_list_dto.campaigns, [])
        
