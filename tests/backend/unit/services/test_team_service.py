import unittest

from backend import create_app
from backend.services.team_service import TeamService


class TestTeamService(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_search_team(self):
        filters = {
            "user_id": 123,
            "team_name_filter": "TM3-validators",
            "team_role_filter": "MAPPER",
            "member_filter": 123,
            "member_request_filter": 123,
            "manager_filter": 123,
            "organisation_filter": 1,
            "omit_members": False,
        }
        result = TeamService.get_all_teams(**filters)
        self.assertEqual(result.to_primitive(), {"teams": []})
