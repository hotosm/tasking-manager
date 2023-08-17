from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_organisation,
    create_canned_interest,
    generate_encoded_token,
    create_canned_user,
)
from backend.exceptions import get_message_from_sub_code

TEST_INTEREST_NAME = "test_interest"
NEW_INTEREST_NAME = "New Interest"
INTEREST_NOT_FOUND_SUB_CODE = "INTEREST_NOT_FOUND"
INTEREST_NOT_FOUND_MESSAGE = get_message_from_sub_code(INTEREST_NOT_FOUND_SUB_CODE)


class TestInterestsAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_organisation = create_canned_organisation()
        self.test_user = create_canned_user()
        self.test_interest = create_canned_interest()
        self.session_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = "/api/v2/interests/"

    # post
    def test_create_a_new_interest_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 during creation of new interest by an unauthenticated user
        """
        response = self.client.post(self.endpoint_url, json={"name": NEW_INTEREST_NAME})
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_create_a_new_interest_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 during creation of new interest by non admin
        """
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "InterestsAllAPI POST: User not a Org Manager"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_create_a_new_interest_using_invalid_data_fails(self):
        """
        Test that endpoint returns 400 during creation of new interest with bad/wrong request data
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"interest_name": NEW_INTEREST_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_create_an_already_existing_interest_by_organisation_admin_fails(self):
        """
        Test that endpoint returns 400 when admin creates a new interest that already exists
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": TEST_INTEREST_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response_body["Error"], f"Value '{TEST_INTEREST_NAME}' already exists"
        )
        self.assertEqual(response_body["SubCode"], "NameExists")

    def test_create_a_new_interest_by_organisation_admin_passes(self):
        """
        Test that endpoint returns 200 after successful creation of new interest by admin
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["name"], NEW_INTEREST_NAME)

    def test_create_a_new_interest_with_empty_name_fails(self):
        """
        Test that endpoint returns 400 when admin creates a new interest with empty name
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.post(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": ""},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["SubCode"], "InvalidData")

    # get
    def test_get_all_interest_passes(self):
        """
        Test that endpoint returns 200 when retrieving list of interests
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["interests"]), 1)
        self.assertEqual(response_body["interests"][0]["name"], TEST_INTEREST_NAME)


class TestInterestsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_organisation = create_canned_organisation()
        self.test_user = create_canned_user()
        self.test_interest = create_canned_interest()
        self.session_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = f"/api/v2/interests/{self.test_interest.id}/"
        self.non_existent_interest_url = "/api/v2/interests/99/"

    # get
    def test_get_an_interest_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when fetching an interest by an unauthenticated user
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_get_an_interest_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when fetching an interest by non admin
        """
        response = self.client.get(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "InterestsRestAPI GET: User not a Org Manager"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_get_a_non_existent_interest_fails(self):
        """
        Test that endpoint returns 404 when fetching a non-existent interest by admin
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.get(
            self.non_existent_interest_url,
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], INTEREST_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], INTEREST_NOT_FOUND_SUB_CODE)

    def test_get_an_existing_interest_by_organisation_admin_passes(self):
        """
        Test that endpoint returns 200 when fetching an existing interest by admin
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.get(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["name"], TEST_INTEREST_NAME)

    # patch
    def test_update_an_interest_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when updating an interest by an unauthenticated user
        """
        response = self.client.patch(
            self.endpoint_url, json={"name": NEW_INTEREST_NAME}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_update_an_interest_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when updating an interest by non admin
        """
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "InterestsRestAPI PATCH: User not a Org Manager"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_update_a_non_existent_interest_fails(self):
        """
        Test that endpoint returns 404 when updating a non-existent interest by admin
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.patch(
            self.non_existent_interest_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], INTEREST_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], INTEREST_NOT_FOUND_SUB_CODE)

    def test_update_an_existent_interest_with_invalid_data_fails(self):
        """
        Test that endpoint returns 400 when updating an interest using invalid request data
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"interest_name": NEW_INTEREST_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_update_an_interest_with_empty_name_fails(self):
        """
        Test that endpoint returns 400 when updating an interest with empty name
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": ""},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_update_an_existing_interest_by_organisation_admin_passes(self):
        """
        Test that endpoint returns 200 when updating an existing interest by admin
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.patch(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
            json={"name": NEW_INTEREST_NAME},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["name"], NEW_INTEREST_NAME)

    # delete
    def test_delete_an_interest_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when deleting an interest by an unauthenticated user
        """
        response = self.client.delete(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_delete_an_interest_by_non_admin_fails(self):
        """
        Test that endpoint returns 403 when deleting an interest by non admin
        """
        response = self.client.delete(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response_body["Error"], "InterestsRestAPI DELETE: User not a Org Manager"
        )
        self.assertEqual(response_body["SubCode"], "UserNotPermitted")

    def test_delete_a_non_existent_interest_fails(self):
        """
        Test that endpoint returns 404 when deleting a non-existent interest by admin
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.delete(
            self.non_existent_interest_url,
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], INTEREST_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], INTEREST_NOT_FOUND_SUB_CODE)

    def test_delete_an_existing_interest_by_organisation_admin_passes(self):
        """
        Test that endpoint returns 200 when deleting an existing interest by admin
        """
        # setup: make test user organisation admin
        add_manager_to_organisation(self.test_organisation, self.test_user)
        response = self.client.delete(
            self.endpoint_url,
            headers={"Authorization": self.session_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Interest deleted")
