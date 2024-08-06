from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    generate_encoded_token,
    create_canned_user,
    return_canned_user,
    return_canned_campaign,
)
from backend.models.postgis.statuses import UserRole
from backend.exceptions import get_message_from_sub_code

CAMPAIGN_NAME = "Test Campaign"
CAMPAIGN_ID = 1
NEW_CAMPAIGN_NAME = "New Campaign"
CAMPAIGN_NOT_FOUND_SUB_CODE = "CAMPAIGN_NOT_FOUND"
CAMPAIGN_NOT_FOUND_MESSAGE = get_message_from_sub_code(CAMPAIGN_NOT_FOUND_SUB_CODE)


class TestCampaignsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_org = create_canned_organisation()
        self.test_admin = return_canned_user("test_user", 11111111)
        self.test_admin.create()
        self.test_admin.role = UserRole.ADMIN.value
        self.test_campaign = return_canned_campaign()
        self.test_campaign.create()
        self.test_non_admin = create_canned_user()
        self.admin_token = generate_encoded_token(self.test_admin.id)
        self.non_admin_token = generate_encoded_token(self.test_non_admin.id)
        self.endpoint_url = "/api/v2/campaigns/"

    # get
    def test_get_campaign_by_id_passes(self):
        """
        Test that endpoint returns 200 to retrieve an existent campaign by id
        """
        response = self.client.get(f"{self.endpoint_url}{self.test_campaign.id}/")
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, {"id": CAMPAIGN_ID, "name": CAMPAIGN_NAME})

    def test_get_non_existent_campaign_by_id_fails(self):
        """
        Test that endpoint returns 404 to retrieve a non-existent campaign by id
        """
        response = self.client.get(f"{self.endpoint_url}99/")
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], CAMPAIGN_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], CAMPAIGN_NOT_FOUND_SUB_CODE)
        self.assertEqual(error_details["details"], {"campaign_id": 99})

    # patch
    def test_update_existent_campaign_by_admin_passes(self):
        """
        Test that enpoint returns 200 to update an existent campaign by admin
        """
        response = self.client.patch(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            json={
                "logo": None,
                "name": NEW_CAMPAIGN_NAME,
                "organisations": [],
                "url": None,
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Campaign 1 updated")

    def test_update_existent_campaign_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 to update an existent campaign by a non_admin
        """
        response = self.client.patch(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            json={
                "logo": None,
                "name": NEW_CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": self.non_admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "CampaignsRestAPI PATCH: User not a Org Manager"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_update_existent_campaign_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 to update a campaign by an unauthenticated user
        """
        response = self.client.patch(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            json={
                "logo": None,
                "name": NEW_CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_update_campaign_using_invalid_request_keys_fails(self):
        """
        Test that endpoint returns 400 to update a campaign using invalid keys/data
        """
        response = self.client.patch(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            json={
                "logo": None,
                "campaign_name": NEW_CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": self.admin_token},
        )
        self.assertEqual(response.status_code, 400)

    def test_update_non_existent_campaign_by_id_fails(self):
        """
        Test that endpoint returns 404 to update a non-existent campaign
        """
        response = self.client.patch(
            f"{self.endpoint_url}99/",
            json={
                "logo": None,
                "name": NEW_CAMPAIGN_NAME,
                "organisations": [],
                "url": None,
            },
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], CAMPAIGN_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], CAMPAIGN_NOT_FOUND_SUB_CODE)
        self.assertEqual(error_details["details"], {"campaign_id": 99})

    # delete
    def test_delete_campaign_by_admin_passes(self):
        """
        Test that endpoint returns 200 for successful deletion of a campaign
        """
        response = self.client.delete(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            headers={"Authorization": self.admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Campaign deleted")

    def test_delete_campaign_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 for deletion of campaign by non-admin
        """
        response = self.client.delete(
            f"{self.endpoint_url}{self.test_campaign.id}/",
            headers={"Authorization": self.non_admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "CampaignsRestAPI DELETE: User not a Org Manager"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_delete_campaign_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 for deletion of campaign by unauthenticated user
        """
        response = self.client.delete(f"{self.endpoint_url}{self.test_campaign.id}/")
        self.assertEqual(response.status_code, 401)

    def test_delete_non_existent_campaign_fails(self):
        """
        Test that endpoint returns 404 for deletion of non-existent campaign
        """
        response = self.client.delete(
            f"{self.endpoint_url}99/", headers={"Authorization": self.admin_token}
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], CAMPAIGN_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], CAMPAIGN_NOT_FOUND_SUB_CODE)


class TestCampaignsAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.endpoint_url = "/api/v2/campaigns/"
        self.test_org = create_canned_organisation()
        self.test_user = return_canned_user("test_user", 11111111)
        self.test_user.create()
        self.test_user.role = UserRole.ADMIN.value
        self.session_token = generate_encoded_token(self.test_user.id)

    # get
    def test_get_existent_campaigns_returns_campaigns_list(self):
        """
        Test that endpoint returns 200 for retrieval of exisiting campaigns
        """
        test_campaign = return_canned_campaign()
        test_campaign.create()
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_body, {"campaigns": [{"id": 1, "name": "Test Campaign"}]}
        )

    def test_get_non_existent_campaigns_returns_empty_list(self):
        """
        Test that endpoint returns empty list if there are no campaigns
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, {"campaigns": []})

    # post
    def test_create_new_campaign_by_admin_passes(self):
        """
        Test that endpoint returns 201 for successful creation of a new campaign
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "logo": None,
                "name": NEW_CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response_body, {"campaignId": 2})

    def test_create_new_campaign_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 creation of a campaign by non-admin
        """
        non_admin = create_canned_user()
        non_admin_token = generate_encoded_token(non_admin.id)
        response = self.client.post(
            self.endpoint_url,
            json={
                "logo": None,
                "name": CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": non_admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "CampaignsAllAPI POST: User not a Org Manager"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_create_new_campaign_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 creation of a campaign by unauthenticated user
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "logo": None,
                "name": CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_create_new_campaign_with_invalid_request_key_fails(self):
        """
        Test that endpoint returns 400 for creation of a new campaign with invalid data/keys
        """
        response = self.client.post(
            self.endpoint_url,
            json={
                "logo": None,
                "campaign_name": CAMPAIGN_NAME,
                "organisations": [self.test_org.id],
                "url": None,
            },
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["Error"], '{"campaign_name": "Rogue field"}')
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_create_already_existing_campaign_fails(self):
        """
        Test that endpoint returns 409 for creation of already existing campaign
        """
        test_campaign = return_canned_campaign()
        self.test_org.campaign = [test_campaign]
        test_campaign.save()
        response = self.client.post(
            self.endpoint_url,
            json={
                "logo": test_campaign.logo,
                "name": test_campaign.name,
                "organisations": [self.test_org.id],
                "url": test_campaign.url,
            },
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response_body["Error"], " Campaign name already exists")
        self.assertEqual(response_body["SubCode"], "NameExists")
