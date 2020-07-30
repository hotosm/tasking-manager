import unittest

from backend import create_app
from backend.models.postgis.utils import NotFound
from backend.services.team_service import TeamService, TeamServiceError


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

    def test_get_team_as_dto(self):
        team_id = 1
        user_id = 123
        abbreviated = False

        result = TeamService.get_team_as_dto(team_id, user_id, abbreviated)
        self.assertEqual(result.team_id, 1)

    def test_add_team_project(self):
        team_id = 1
        user_id = 123
        function = 1
        active = True

        with self.assertRaises(TeamServiceError):
            TeamService.add_team_member(team_id, user_id, function, active)

    def test_delete_team_project(self):
        team_id = 1
        with self.assertRaises(TeamServiceError):
            TeamService.delete_team(team_id)

    def test_leave_team(self):
        team_id = 1
        username = "Thinkwhere"
        with self.assertRaises(NotFound):
            TeamService.leave_team(team_id, username)
