from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project

TEST_COUNTRY = "Test Country"


class TestCountriesRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, _ = create_canned_project()
        self.endpoint_url = "/api/v2/countries/"

    def test_get_all_country_tags_passes(self):
        """
        Test that endpoint returns 200 when getting all country tags successfully
        """
        response1 = self.client.get(self.endpoint_url)
        response_body1 = response1.get_json()
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(len(response_body1["tags"]), 0)
        self.assertEqual(response_body1["tags"], [])
        # set up: add at least one country tag and test that
        self.test_project.country = [TEST_COUNTRY]
        response2 = self.client.get(self.endpoint_url)
        response_body2 = response2.get_json()
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(len(response_body2["tags"]), 1)
        self.assertEqual(response_body2["tags"], [TEST_COUNTRY])
