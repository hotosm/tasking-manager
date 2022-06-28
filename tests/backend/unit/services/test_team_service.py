from backend.models.postgis.utils import NotFound
from backend.services.team_service import TeamService
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_team, create_canned_user


class TestTeamService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_team = create_canned_team()

    def test_search_team(self):
        # Arrange
        filters = {
            "user_id": self.test_user.id,
            "team_name_filter": self.test_team.name,
            "member_filter": self.test_user.id,
            "organisation_filter": self.test_team.organisation_id,
        }
        # Act
        result = TeamService.get_all_teams(**filters)
        # Assert
        self.assertEqual(
            result.to_primitive(), {"teams": [self.test_team.as_dto().to_primitive()]}
        )

    def test_get_team_as_dto(self):
        # Arrange
        team_id = self.test_team.id
        user_id = self.test_user.id
        abbreviated = False
        # Act
        result = TeamService.get_team_as_dto(team_id, user_id, abbreviated)
        # Assert
        self.assertEqual(result.team_id, self.test_team.id)

    def test_add_team_project(self):
        # Arrange
        team_id = self.test_team.id
        user_id = self.test_user.id
        function = 1
        active = True
        # Act
        TeamService.add_team_member(team_id, user_id, function, active)
        # Assert
        self.assertTrue(
            TeamService.is_user_an_active_team_member(
                self.test_team.id, self.test_user.id
            )
        )

    def test_delete_team_project(self):
        # Act
        TeamService.delete_team(self.test_team.id)
        # Assert
        with self.assertRaises(NotFound):
            TeamService.get_team_by_id(self.test_team.id)

    def test_leave_team(self):
        # Arrange
        team_id = self.test_team.id
        username = self.test_user.username
        function = 1
        active = True
        TeamService.add_team_member(team_id, self.test_user.id, function, active)
        # Act
        TeamService.leave_team(team_id, username)
        # Assert
        self.assertFalse(
            TeamService.is_user_an_active_team_member(
                self.test_team.id, self.test_user.id
            )
        )
