import base64

from tests.backend.base import BaseTestCase
from backend.services.users.authentication_service import AuthenticationService
from tests.backend.helpers.test_helpers import return_canned_user


class TestBannerAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.url = "/api/v2/system/banner/"

    def test_get_banner(self):
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        # Default banner is created with message "Welcome to the Tasking Manager" and visible=True at first request
        self.assertEqual(response.json["message"], "Welcome to the API")
        self.assertTrue(response.json["visible"])

    def test_patch_banner(self):
        # Session token is required for this endpoint. So we need to create a user
        test_user = return_canned_user()
        test_user.create()
        session_token = AuthenticationService.generate_session_token_for_user(
            test_user.id
        )
        session_token = base64.b64encode(session_token.encode("utf-8"))
        session_token = "Token " + session_token.decode("utf-8")
        banner_message = "### Updated message"

        # Test returns 400 Bad Request for invalid JSON
        response = self.client.patch(
            self.url,
            json={"message": banner_message, "visible": "OK"},
            headers={"Authorization": session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidData")

        # Test returns 403 Forbidden for non-admin users
        response = self.client.patch(
            self.url,
            json={"message": banner_message, "visible": True},
            headers={"Authorization": session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "OnlyAdminAccess")

        # Test returns 200 OK for admin users
        test_user.role = 1
        test_user.save()
        response = self.client.patch(
            self.url,
            json={"message": banner_message, "visible": True},
            headers={"Authorization": session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["message"], "<h3>Updated message</h3>")
        self.assertTrue(response.json["visible"])
