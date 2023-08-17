from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    create_canned_mapping_issue,
)

from backend.exceptions import get_message_from_sub_code

TEST_ISSUE_NAME = "Test Issue"
TEST_ISSUE_DESCRIPTION = "Test issue description"
ISSUE_NOT_FOUND_SUB_CODE = "ISSUE_CATEGORY_NOT_FOUND"
ISSUE_NOT_FOUND_MESSAGE = get_message_from_sub_code(ISSUE_NOT_FOUND_SUB_CODE)


class TestIssuesRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.test_issue_id = create_canned_mapping_issue()
        self.url = f"/api/v2/tasks/issues/categories/{self.test_issue_id}/"
        self.non_existent_url = "/api/v2/tasks/issues/categories/99/"

    # get
    def test_get_existing_issue_passes(self):
        """
        Test that endpoint returns 200 to successfully get an existing issue
        """
        response = self.client.get(self.url)
        response_json = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_json["name"], TEST_ISSUE_NAME)

    def test_get_non_existent_issue_fails(self):
        """
        Test that endpoint returns 404 to get a non existent issue
        """
        response = self.client.get(self.non_existent_url)
        response_json = response.get_json()
        error_details = response_json["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], ISSUE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], ISSUE_NOT_FOUND_SUB_CODE)

    # patch
    def test_update_issue_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 to update an issue by an unauthenticated user
        """
        response = self.client.patch(
            self.url,
            json={"description": TEST_ISSUE_DESCRIPTION, "name": TEST_ISSUE_NAME},
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_json["SubCode"], "InvalidToken")

    def test_update_issue_with_invalid_request_data_fails(self):
        """
        Test that endpoint returns 400 to update an issue with an invalid request
        """
        response = self.client.patch(
            self.url,
            headers={"Authorization": self.test_user_token},
            json={"issue_description": TEST_ISSUE_DESCRIPTION, "issue_name": ""},
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response_json["Error"], "Unable to update mapping issue category"
        )
        self.assertEqual(response_json["SubCode"], "InvalidData")

    def test_update_non_existent_issue_fails(self):
        """
        Test that endpoint returns 404 to update a non existent issue
        """
        response = self.client.patch(
            self.non_existent_url,
            headers={"Authorization": self.test_user_token},
            json={"description": TEST_ISSUE_DESCRIPTION, "name": TEST_ISSUE_NAME},
        )
        response_json = response.get_json()
        error_details = response_json["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], ISSUE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], ISSUE_NOT_FOUND_SUB_CODE)

    def test_update_mapping_issue_passes(self):
        """
        Test that endpoint returns 200 to successfully update an issue
        """
        response = self.client.patch(
            self.url,
            headers={"Authorization": self.test_user_token},
            json={
                "name": "New issue name",
                "description": TEST_ISSUE_DESCRIPTION,
            },
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response_json["name"], TEST_ISSUE_NAME)
        self.assertEqual(response_json["name"], "New issue name")
        self.assertEqual(response_json["description"], TEST_ISSUE_DESCRIPTION)

    # delete
    def test_delete_issue_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 to delete an issue by an unauthenticated user
        """
        response = self.client.delete(
            self.url,
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_json["SubCode"], "InvalidToken")

    def test_delete_non_existent_issue_fails(self):
        """
        Test that endpoint returns 404 to delete a non-existent issue
        """
        response = self.client.delete(
            self.non_existent_url, headers={"Authorization": self.test_user_token}
        )
        response_json = response.get_json()
        error_details = response_json["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], ISSUE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], ISSUE_NOT_FOUND_SUB_CODE)

    def test_delete_mapping_issue_passes(self):
        """
        Test that endpoint returns 200 to successfully delete an issue
        """
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_token}
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_json["Success"], "Mapping-issue category deleted")


class TestIssuesAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.url = "/api/v2/tasks/issues/categories/"

    # get
    def test_get_all_issues_passes(self):
        """
        Test that endpoint returns 200 to successfully retrieve all issues
        """
        # Act: no issues
        response = self.client.get(self.url)
        response_json = response.get_json()
        # test
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_json["categories"]), 0)
        self.assertEqual(response_json["categories"], [])

        # Act: add 1 issue
        self.test_issue = create_canned_mapping_issue()
        response = self.client.get(self.url)
        response_json = response.get_json()
        # test
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_json["categories"]), 1)
        self.assertEqual(response_json["categories"][0]["name"], TEST_ISSUE_NAME)

    # post
    def test_create_issue_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 to create a new issue by an unauthenticated user
        """
        response = self.client.post(
            self.url,
            json={"description": TEST_ISSUE_DESCRIPTION, "name": TEST_ISSUE_NAME},
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_json["SubCode"], "InvalidToken")

    def test_update_issue_with_invalid_request_data_fails(self):
        """
        Test that endpoint returns 400 to create a new issue with an invalid request
        """
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_token},
            json={"issue_description": TEST_ISSUE_DESCRIPTION, "issue_name": ""},
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response_json["Error"], "Unable to create a new mapping issue category"
        )
        self.assertEqual(response_json["SubCode"], "InvalidData")

    def test_create_mapping_issue_passes(self):
        """
        Test that endpoint returns 200 to successfully create a new issue
        """
        response = self.client.post(
            self.url,
            headers={"Authorization": self.test_user_token},
            json={
                "name": TEST_ISSUE_NAME,
                "description": TEST_ISSUE_DESCRIPTION,
            },
        )
        response_json = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_json["categoryId"], 1)
