from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    create_canned_license,
)

from backend.exceptions import get_message_from_sub_code


LICENSE_NOT_FOUND_SUB_CODE = "LICENSE_NOT_FOUND"
LICENSE_NOT_FOUND_MESSAGE = get_message_from_sub_code(LICENSE_NOT_FOUND_SUB_CODE)


class TestLicensesActionsAcceptAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_user_token = generate_encoded_token(self.test_user.id)
        self.test_license_id = create_canned_license()
        self.endpoint_url = (
            f"/api/v2/licenses/{self.test_license_id}/actions/accept-for-me/"
        )

    def test_accept_license_terms_by_unauthenticated_user_fails(self):
        """
        Test that endpoint returns 401 when an unauthenticated user accepts license terms
        """
        response = self.client.post(self.endpoint_url)
        response_body = response.get_json()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response_body["SubCode"], "InvalidToken")

    def test_accept_terms_of_non_existent_license_fails(self):
        """
        Test that endpoint returns 404 when user accepts terms of a non-existent license
        """
        response = self.client.post(
            "/api/v2/licenses/99/actions/accept-for-me/",
            headers={"Authorization": self.test_user_token},
        )
        response_body = response.get_json()
        error_details = response_body["error"]
        self.assertEqual(response.status_code, 404)
        self.assertEqual(error_details["message"], LICENSE_NOT_FOUND_MESSAGE)
        self.assertEqual(error_details["sub_code"], LICENSE_NOT_FOUND_SUB_CODE)

    def test_accept_license_terms_by_authenticated_user_passes(self):
        """
        Test that endpoint returns 200 when authenticated user accepts existing license terms
        """
        response = self.client.post(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        response_body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body["Success"], "Terms Accepted")
