import base64

from tests.backend.base import BaseTestCase, db
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    add_manager_to_organisation,
)
from backend.services.users.authentication_service import AuthenticationService


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
        """ Test endpoint returns all required fields"""

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
        """ Test managers are not returned is omitManagers is set to True """

        response = self.client.get(f"{self.endpoint_url}?omitManagers=True")
        response_body = response.json["organisations"]
        with self.assertRaises(KeyError):
            response_body[0]["managers"]

    def test_get_all_org_includes_managers_if_user_is_authenticated(self):
        """ Test managers are included if user is authenticated """

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
        """ Test stats are not returned is omitOrgStats is set to False """

        response = self.client.get(
            f"{self.endpoint_url}?omitOrgStats=False",
        )
        response_body = response.json["organisations"]

        self.assertEqual(response_body[0]["stats"]["projects"]["draft"], 1)
