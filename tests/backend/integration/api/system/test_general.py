import requests

from tests.backend.base import BaseTestCase


class TestSystemHeartbeatAPI(BaseTestCase):
    def test_get_system_heartbeat(self):
        url = "/api/v2/system/heartbeat/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "healthy")
        response.json["release"]


class TestSystemReleaseAPI(BaseTestCase):
    def test_post_banner(self):
        url = "/api/v2/system/release/"
        response = self.client.post(url)
        release = requests.get(
            "https://api.github.com/repos/hotosm/tasking-manager/releases/latest"
        ).json()
        # Assert
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["release_version"], release["tag_name"])


class TestSystemLanguagesAPI(BaseTestCase):
    def test_get_system_languages(self):
        url = "/api/v2/system/languages/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertListEqual(
            list(response.json.keys()),
            [
                "mapperLevelIntermediate",
                "mapperLevelAdvanced",
                "supportedLanguages",
            ],
        )


class TestSystemContactAdminRestAPI(BaseTestCase):
    def test_post_contact_admin(self):
        url = "/api/v2/system/contact-admin/"
        data = {
            "name": "test",
            "email": "test",
            "content": "test",
        }
        self.app.config["EMAIL_CONTACT_ADDRESS"] = "test@hotosm.org"
        response = self.client.post(url, json=data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["Success"], "Email sent")

    def test_post_contact_admin_raises_error_if_email_contact_address_not_set(self):
        url = "/api/v2/system/contact-admin/"
        data = {
            "name": "test",
            "email": "test",
            "content": "test",
        }
        self.app.config["EMAIL_CONTACT_ADDRESS"] = None
        response = self.client.post(url, json=data)
        self.assertEqual(response.status_code, 501)
        self.assertEqual(
            response.json["Error"],
            "This feature is not implemented due to missing variable TM_EMAIL_CONTACT_ADDRESS.",
        )
