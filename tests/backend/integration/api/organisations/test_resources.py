import base64

from tests.backend.base import BaseTestCase, db
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    create_canned_user,
    add_manager_to_organisation,
    generate_encoded_token,
    return_canned_user,
)

from backend.exceptions import get_message_from_sub_code
from backend.services.users.authentication_service import AuthenticationService


TEST_USER_ID = 777777
TEST_USERNAME = "Thinkwhere Test"
ORG_NOT_FOUND_SUB_CODE = "ORGANISATION_NOT_FOUND"
ORG_NOT_FOUND_MESSAGE = get_message_from_sub_code(ORG_NOT_FOUND_SUB_CODE)


class TestOrganisationAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.endpoint_url = "/api/v2/organisations/"
        self.test_project, self.test_author = create_canned_project()
        self.test_org = create_canned_organisation()
        add_manager_to_organisation(self.test_org, self.test_author)
        self.test_project.organisation = self.test_org
        db.session.commit()

    def test_get_all_organisations_returns_required_fields(self):
        """Test endpoint returns all required fields"""

        response = self.client.get(self.endpoint_url)
        response_body = response.json["organisations"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body), 1)
        self.assertEqual(response_body[0]["organisationId"], self.test_org.id)
        # omitManager is enabled by default but user must be authenticated to get org managers in response
        with self.assertRaises(KeyError):
            response_body[0]["managers"]
        self.assertEqual(response_body[0]["name"], self.test_org.name)
        self.assertEqual(response_body[0]["campaigns"], None)
        # As omitOrgStats is set to true by default, stats field should not be included in response
        with self.assertRaises(KeyError):
            response_body[0]["stats"]

    def test_get_all_organisations_doesnt_returns_manager_if_omit_manager_set_true(
        self,
    ):
        """Test managers are not returned is omitManagers is set to True"""

        response = self.client.get(f"{self.endpoint_url}?omitManagers=True")
        response_body = response.json["organisations"]
        with self.assertRaises(KeyError):
            response_body[0]["managers"]

    def test_get_all_org_includes_managers_if_user_is_authenticated(self):
        """Test managers are included if user is authenticated"""

        session_token = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        session_token = base64.b64encode(session_token.encode("utf-8"))
        session_token = "Token " + session_token.decode("utf-8")
        response = self.client.get(
            self.endpoint_url, headers={"Authorization": session_token}
        )

        response_body = response.json["organisations"]
        self.assertEqual(
            response_body[0]["managers"][0]["username"], self.test_author.username
        )

    def test_get_all_org_raises_error_if_filter_by_manager_id__on_unauthenticated_request(
        self,
    ):
        "Test 403 is returned if filter by manager id on unauthenticated request"

        response = self.client.get(f"{self.endpoint_url}?manager_user_id=2")
        self.assertEqual(response.status_code, 403)

    def test_get_all_org_includes_stats_if_omit_stats_set_false(self):
        """Test stats are not returned is omitOrgStats is set to False"""

        response = self.client.get(
            f"{self.endpoint_url}?omitOrgStats=False",
        )
        response_body = response.json["organisations"]

        self.assertEqual(response_body[0]["stats"]["projects"]["draft"], 1)


class TestOrganisationsBySlugRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_org = create_canned_organisation()
        self.session_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = f"/api/v2/organisations/{self.test_org.slug}/"

    def test_get_org_by_slug_by_without_token_passes(self):
        """
        Test that endpoint returns 200 and and organisation details
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body), 12)
        self.assertEqual(response_body["organisationId"], self.test_org.id)
        self.assertEqual(response_body["name"], self.test_org.name)
        self.assertEqual(response_body["slug"], self.test_org.slug)
        self.assertEqual(response_body["name"], self.test_org.name)
        self.assertEqual(response_body["logo"], None)
        self.assertEqual(response_body["description"], None)
        self.assertEqual(response_body["url"], None)
        self.assertEqual(response_body["teams"], [])
        self.assertEqual(response_body["campaigns"], None)
        self.assertEqual(response_body["type"], "FREE")
        self.assertEqual(response_body["subscriptionTier"], None)

    def test_get_org_by_slug_by_authorised_user_and_omitManagerList_is_false_passes(
        self,
    ):
        """
        Test that endpoint returns 200 and organisation details including manager details
        """
        add_manager_to_organisation(self.test_org, self.test_user)
        response = self.client.get(
            self.endpoint_url, headers={"Authorization": self.session_token}
        )  # by default, omitManagerList=False"
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body), 12)
        self.assertEqual(response_body["organisationId"], self.test_org.id)
        # Manager list included
        self.assertEqual(len(response_body["managers"]), 1)
        self.assertEqual(
            response_body["managers"],
            [{"username": TEST_USERNAME, "pictureUrl": None}],
        )

    def test_get_org_by_slug_by_authorised_user_and_omitManagerList_is_true_passes(
        self,
    ):
        """
        Test that endpoint returns 200 and organisation details excluding manager details
        """
        add_manager_to_organisation(self.test_org, self.test_user)
        response = self.client.get(
            f"{self.endpoint_url}?omitManagerList=True",
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body), 12)
        self.assertEqual(response_body["organisationId"], self.test_org.id)
        # Manager list omitted
        self.assertEqual(len(response_body["managers"]), 0)
        self.assertEqual(response_body["managers"], [])

    def test_get_non_existent_org_by_slug_fails(self):
        """
        Test that endpoint returns 404 when queried for non existent organisation
        """
        response = self.client.get("/api/v2/organisations/random-organisation/")
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], ORG_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], ORG_NOT_FOUND_SUB_CODE)


class TestOrganisationsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_org = create_canned_organisation()
        self.test_org.managers = [self.test_author]
        self.test_org.save()
        self.endpoint_url = "/api/v2/organisations/"
        self.session_token = generate_encoded_token(self.test_author.id)

    # post method tests
    def test_create_org_by_unauthenticated_user_fails(self):
        """
        Tests that endpoint returns 401 when unauthenticated user tries to create a new org
        """
        response = self.client.post(
            self.endpoint_url,
            json={"name": "New Org", "slug": "new-org", "managers": ["Test User"]},
        )
        self.assertEqual(response.status_code, 401)

    def test_create_org_with_non_admin_fails(self):
        """
        Tests that endpoint returns 403 when non admin tries to create a new org
        """
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={
                "name": "New Org",
                "slug": "new-org",
                "logo": None,
                "managers": [TEST_USERNAME],
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "Only admin users can create organisations."
        )
        self.assertEqual(response_body["SubCode"], "OnlyAdminAccess")

    # get organisation
    def test_get_org_when_omitManagerList_is_false_passes(self):
        """
        Test that endpoint returns 200 while retrieving an organisation by id when omitManagersList is false
        """
        response = self.client.get(
            f"{self.endpoint_url}{self.test_org.id}/",
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["organisationId"], 23)
        self.assertEqual(len(response_body["managers"]), 1)
        self.assertEqual(
            response_body["managers"],
            [{"username": TEST_USERNAME, "pictureUrl": None}],
        )

    def test_get_non_existent_org_fails(self):
        """
        Test that endpoint returns 404 when queried for non-existent org by id
        """
        response = self.client.get(
            f"{self.endpoint_url}99/",
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], ORG_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], ORG_NOT_FOUND_SUB_CODE)

    # delete method tests
    def test_delete_org_by_admin_user_passes(self):
        """
        Test that endpoint returns 200 after deleting existing organisation by org admin
        """
        response = self.client.delete(
            f"{self.endpoint_url}{self.test_org.id}/",
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Organisation deleted")

    def test_delete_item_by_non_admin_user_fails(self):
        """
        Test that endpoint returns 403 when deleting existing organisation by non org admin
        """
        non_admin = return_canned_user(username="Random User", id=2222)
        non_admin.create()
        non_admin_token = generate_encoded_token(non_admin.id)
        response = self.client.delete(
            f"/api/v2/organisations/{self.test_org.id}/",
            headers={"Authorization": non_admin_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], "User is not an admin for the org")
        self.assertEqual(response_body["SubCode"], "UserNotOrgAdmin")

    def test_delete_org_with_projects_fails(self):
        """
        Test that endpoint returns 403 when trying to delete organisation with projects
        """
        self.test_project.organisation = self.test_org
        self.test_project.save()
        response = self.client.delete(
            f"{self.endpoint_url}{self.test_org.id}/",
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], "Organisation has some projects")
        self.assertEqual(response_body["SubCode"], "OrgHasProjects")

    # patch
    def test_update_org_details_by_admin_passes(self):
        """
        Tests that endpoint returns 200 when admin successfully updates an organisation's details
        """
        response = self.client.patch(
            f"{self.endpoint_url}{self.test_org.id}/",
            headers={"Authorization": self.session_token},
            json={
                "name": "HOT",
                "slug": "hot",
                "logo": None,
                "managers": [TEST_USERNAME],
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body, {"Status": "Updated"})

    def test_update_org_details_by_non_admin_fails(self):
        """
        Tests that endpoint returns 403 when non admin tries to update an organisation's details
        """
        non_admin = return_canned_user(username="New User", id=444)
        non_admin.create()
        non_admin_token = generate_encoded_token(non_admin.id)
        response = self.client.patch(
            f"{self.endpoint_url}{self.test_org.id}/",
            headers={"Authorization": non_admin_token},
            json={
                "name": "HOT",
                "slug": "hot",
                "logo": None,
                "managers": [TEST_USERNAME],
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response_body["Error"], "User is not an admin for the org")
        self.assertEqual(response_body["SubCode"], "UserNotOrgAdmin")

    def test_update_org_details_with_invalid_data_fails(self):
        """
        Tests that endpoint returns 400 when admin tries to  update an organisation's details using invalid keys
        """
        response = self.client.patch(
            f"{self.endpoint_url}{self.test_org.id}/",
            headers={"Authorization": self.session_token},
            json={
                "org_name": "HOT",
                "org_slug": "hot",
                "org_logo": None,
            },
        )
        self.assertEqual(response.status_code, 400)


class TestOrganisationsStatsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_org = create_canned_organisation()
        self.test_project, self.test_author = create_canned_project()
        self.test_org.save()
        self.test_project.organisation = self.test_org
        self.test_project.save()
        self.endpoint_url = f"/api/v2/organisations/{self.test_org.id}/statistics/"

    def test_get_org_statistics_passes(self):
        """
        Tests that endpoint returns 200 when retrieving an organisation's statistics
        """
        response = self.client.get(self.endpoint_url)
        self.assertEqual(response.status_code, 200)
        response_body = response.get_json()
        self.assertEqual(
            response_body["projects"],
            {"draft": 1, "published": 0, "archived": 0, "recent": 0, "stale": 0},
        )
        self.assertEqual(
            response_body["activeTasks"],
            {
                "badImagery": 0,
                "invalidated": 0,
                "lockedForMapping": 0,
                "lockedForValidation": 0,
                "mapped": 0,
                "ready": 0,
                "validated": 0,
            },
        )

    def test_get_non_existent_org_statistics_fails(self):
        """
        Tests that endpoint returns 404 when retrieving a non existent organisation's statistics
        """
        response = self.client.get("/api/v2/organisations/99/statistics/")
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], ORG_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], ORG_NOT_FOUND_SUB_CODE)
