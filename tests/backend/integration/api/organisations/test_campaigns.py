from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    generate_encoded_token,
    return_canned_user,
    return_canned_campaign,
)
from tests.backend.integration.api.campaigns.test_resources import (
    CAMPAIGN_NOT_FOUND_MESSAGE,
    CAMPAIGN_NOT_FOUND_SUB_CODE,
)

CAMPAIGN_NAME = "New Campaign"
CAMPAIGN_ID = 2


class TestOrganisationsCampaignsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_org = create_canned_organisation()
        self.endpoint_url = f"/api/v2/organisations/{self.test_org.id}/campaigns/"
        self.test_campaign = return_canned_campaign()
        self.test_campaign.create()
        self.test_project, self.test_author = create_canned_project()
        self.test_user = return_canned_user("test_user", 11111111)
        self.test_user.create()
        self.test_org.managers = [self.test_author]
        self.test_org.campaign = [self.test_campaign]
        self.test_org.save()
        self.test_author_session_token = generate_encoded_token(self.test_author.id)
        self.test_user_session_token = generate_encoded_token(self.test_user.id)

    # post
    def test_add_already_assigned_campaign_to_same_org_fails(self):
        """
        Test that the endpoint returns 400 if the campaign had already been assigned to the organisation
        """
        response = self.client.post(
            f"/api/v2/organisations/{self.test_org.id}/campaigns/{self.test_campaign.id}/",
            json={
                "logo": None,
                "name": "Test Campaign",
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response_body["Error"], "Campaign 1 is already assigned to organisation 23."
        )
        self.assertEqual(response_body["SubCode"], "CampaignAlreadyAssigned")

    def test_assign_org_new_campaign_passes(self):
        """
        Test that the endpoint returns 200 when a new campaign is assigned to the organisation
        """
        new_campaign = return_canned_campaign(
            id=2, name=CAMPAIGN_NAME, description=None, logo=None
        )
        new_campaign.create()
        response = self.client.post(
            f"/api/v2/organisations/{self.test_org.id}/campaigns/{new_campaign.id}/",
            json={
                "logo": None,
                "name": CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_body["Success"],
            "campaign with id 2 assigned for organisation with id 23",
        )

    def test_non_org_admin_assigns_new_campaign_to_org_fails(self):
        """
        Test that the endpoint returns 403 when a non admin tries to add a new campaign to an organisation
        """
        new_campaign = return_canned_campaign(
            id=2, name=CAMPAIGN_NAME, description=None, logo=None
        )
        new_campaign.create()
        response = self.client.post(
            f"/api/v2/organisations/{self.test_org.id}/campaigns/{new_campaign.id}/",
            json={
                "logo": None,
                "name": CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "User is not a manager of the organisation"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    # get
    def test_get_organisation_campaigns_passes(self):
        """
        Test that the endpoint returns 200 when retrieving organisation campaigns
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_body, {"campaigns": [{"id": 1, "name": "Test Campaign"}]}
        )

    # def test_get_non_existent_organisation_campaigns_fails(self):
    #     """
    #     Test that the endpoint returns 404 when retrieving campaigns for non existent organisation
    #     """
    #     response = self.client.get(f"/api/v2/organisations/111111/campaigns/")
    #     self.assertEqual(response.status_code, 404)

    # delete
    def test_delete_organisation_campaign_by_admin_passes(self):
        """Test that the endpoint returns 200 and unassigns a campaign from an organisation"""
        response = self.client.delete(
            f"/api/v2/organisations/{self.test_org.id}/campaigns/{self.test_campaign.id}/",
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_body,
            {"Success": "Organisation and campaign unassociated successfully"},
        )

    def test_delete_organisation_campaign_non_admin_fails(self):
        """Test that the endpoint returns 403 when a non admin attempts to delete an organisation campaign"""
        response = self.client.delete(
            f"/api/v2/organisations/{self.test_org.id}/campaigns/{self.test_campaign.id}/",
            headers={"Authorization": self.test_user_session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "User is not a manager of the organisation"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_delete_non_existent_organisation_campaign_fails(self):
        """Tests that the endpoint returns 404 when the org admin deletes a non existent campaign"""
        response = self.client.delete(
            f"/api/v2/organisations/{self.test_org.id}/campaigns/5/",
            headers={"Authorization": self.test_author_session_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], CAMPAIGN_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], CAMPAIGN_NOT_FOUND_SUB_CODE)
