from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    create_canned_license,
)

from backend.exceptions import get_message_from_sub_code

TEST_LICENSE_NAME = "test_license"
TEST_LICENSE_DESCRIPTION = "test license"
TEST_LICENSE_PLAINTEXT = "test license"
NEW_LICENSE_DESCRIPTION = "A new test license"
NEW_LICENSE_NAME = "New License"
LICENSE_NOT_FOUND_SUB_CODE = "LICENSE_NOT_FOUND"
LICENSE_NOT_FOUND_MESSAGE = get_message_from_sub_code(LICENSE_NOT_FOUND_SUB_CODE)


class TestLicensesRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.test_license_id = create_canned_license()
        self.single_licence_url = f"/api/v2/licenses/{self.test_license_id}/"
        self.all_licences_url = "/api/v2/licenses/"
        self.non_existent_url = "/api/v2/licenses/99/"

    # post
    def test_create_new_license_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when unauthenticated user creates a new license
        """
        response = self.client.post(
            self.all_licences_url,
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_create_new_license_with_invalid_request_fails(self):
        """
        Test that endpoint returns 400 when creating a new license with invalid data
        """
        response = self.client.post(
            self.all_licences_url,
            headers={"Authorization": self.test_user_token},
            json={
                "license_description": [NEW_LICENSE_DESCRIPTION],
                "license_name": NEW_LICENSE_NAME,
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["Error"], "Unable to create new mapping license")
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_create_new_license_by_authenticated_user_passes(self):
        """
        Test that endoint returns 201 when authenticated user creates new license
        """
        response = self.client.post(
            self.all_licences_url,
            headers={"Authorization": self.test_user_token},
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response_body, {"licenseId": 2})

    # get
    def test_get_non_existent_license_fails(self):
        """
        Test that endpoint returns 404 when retrieving a non existent license
        """
        response = self.client.get(self.non_existent_url)
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], LICENSE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], LICENSE_NOT_FOUND_SUB_CODE)

    def test_get_license_passes(self):
        """
        Test that endpoint returns 200 when retrieving an existing license
        """
        response = self.client.get(self.single_licence_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["name"], TEST_LICENSE_NAME)
        self.assertEqual(response_body["description"], TEST_LICENSE_DESCRIPTION)
        self.assertEqual(response_body["plainText"], TEST_LICENSE_PLAINTEXT)

    # patch
    def test_update_license_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when unauthenticated user updates a license
        """
        response = self.client.patch(
            self.single_licence_url,
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_update_license_with_invalid_request_fails(self):
        """
        Test that endpoint returns 400 when user updates a license with invalid request data
        """
        response = self.client.patch(
            self.single_licence_url,
            headers={"Authorization": self.test_user_token},
            json={
                "license_description": [NEW_LICENSE_DESCRIPTION],
                "license_name": NEW_LICENSE_NAME,
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_body["SubCode"], "InvalidData")

    def test_update_non_existent_license_by_authenticated_user_fails(self):
        """
        Test that endoint returns 404 when authenticated user updates non-existent license
        """
        response = self.client.patch(
            self.non_existent_url,
            headers={"Authorization": self.test_user_token},
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], LICENSE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], LICENSE_NOT_FOUND_SUB_CODE)

    def test_update_license_by_authenticated_user_passes(self):
        """
        Test that endoint returns 200 when authenticated user updates existing license
        """
        response = self.client.patch(
            self.single_licence_url,
            headers={"Authorization": self.test_user_token},
            json={
                "description": NEW_LICENSE_DESCRIPTION,
                "name": NEW_LICENSE_NAME,
                "plainText": "",
            },
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response_body["name"], TEST_LICENSE_NAME)
        self.assertNotEqual(response_body["description"], TEST_LICENSE_DESCRIPTION)
        self.assertNotEqual(response_body["plainText"], TEST_LICENSE_PLAINTEXT)
        # updated info
        self.assertEqual(response_body["name"], NEW_LICENSE_NAME)
        self.assertEqual(response_body["description"], NEW_LICENSE_DESCRIPTION)
        self.assertEqual(response_body["plainText"], "")

    # delete
    def test_delete_license_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when unauthenticated user deletes a license
        """
        response = self.client.delete(self.single_licence_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_delete_non_existent_license_by_authenticated_user_fails(self):
        """
        Test that endoint returns 404 when authenticated user deletes non-existent license
        """
        response = self.client.delete(
            self.non_existent_url,
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], LICENSE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], LICENSE_NOT_FOUND_SUB_CODE)

    def test_delete_license_by_authenticated_user_passes(self):
        """
        Test that endoint returns 200 when authenticated user deletes existing license
        """
        response = self.client.delete(
            self.single_licence_url,
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "License deleted")


class TestLicensesAllAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.endpoint_url = "/api/v2/licenses/"

    def test_get_all_licenses_(self):
        """
        Test that endoint returns 200 when retrieving existing licenses
        """
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["licenses"]), 0)
        self.assertEqual(response_body["licenses"], [])
        # setup: add license
        self.test_license_id = create_canned_license()
        response = self.client.get(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body["licenses"]), 1)
        licenses = response_body["licenses"][0]
        self.assertEqual(licenses["licenseId"], 1)
        self.assertEqual(licenses["name"], TEST_LICENSE_NAME)
        self.assertEqual(licenses["description"], TEST_LICENSE_DESCRIPTION)
        self.assertEqual(licenses["plainText"], TEST_LICENSE_PLAINTEXT)
