from backend.exceptions import NotFound
from backend.services.team_service import TeamService
from backend.models.dtos.team_dto import TeamSearchDTO
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_team, create_canned_user


class TestTeamService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = create_canned_user()
        self.test_team = create_canned_team()

    def test_search_team(self):
        # Arrange
        team_search_dto = TeamSearchDTO()
        team_search_dto.user_id = self.test_user.id
        team_search_dto.team_name = self.test_team.name
        team_search_dto.member = self.test_user.id
        team_search_dto.organisation = self.test_team.organisation_id

        # Act
        result = TeamService.get_all_teams(team_search_dto)
        # Assert
        self.assertEqual(len(result.to_primitive()["teams"]), 1)
        self.assertEqual(result.to_primitive()["teams"][0]["teamId"], self.test_team.id)
        self.assertEqual(result.to_primitive()["teams"][0]["name"], self.test_team.name)
        self.assertEqual(
            result.to_primitive()["teams"][0]["organisationId"],
            self.test_team.organisation_id,
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
