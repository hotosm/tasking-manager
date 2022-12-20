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
