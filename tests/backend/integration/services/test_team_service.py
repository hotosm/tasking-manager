from backend.models.postgis.statuses import TeamMemberFunctions, TeamRoles
from backend.services.team_service import TeamService
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    add_user_to_team,
    assign_team_to_project,
    create_canned_project,
    create_canned_team,
)


class TestTeamService(BaseTestCase):
    def test_check_team_membership_returns_true_if_user_member_of_team_with_allowed_role(
        self,
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        test_team = create_canned_team()
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        assign_team_to_project(test_project, test_team, allowed_roles[0])
        add_user_to_team(
            test_team, test_user, TeamMemberFunctions.MEMBER.value, is_active=True
        )
        # Act
        is_team_member = TeamService.check_team_membership(
            test_project.id, allowed_roles, test_user.id
        )
        # Assert
        self.assertTrue(is_team_member)

    def test_check_team_membership_returns_false_if_user_member_of_team_with_unallowed_role(
        self,
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        test_team = create_canned_team()
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        assign_team_to_project(test_project, test_team, TeamRoles.MAPPER.value)
        # Act
        is_team_member = TeamService.check_team_membership(
            test_project.id, allowed_roles, test_user.id
        )
        # Assert
        self.assertFalse(is_team_member)

    def test_check_team_membership_returns_false_if_user_member_of_team_not_assigned_to_project(
        self,
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        test_team = create_canned_team()
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        add_user_to_team(
            test_team, test_user, TeamMemberFunctions.MEMBER.value, is_active=True
        )
        # Act
        is_team_member = TeamService.check_team_membership(
            test_project.id, allowed_roles, test_user.id
        )
        # Assert
        self.assertFalse(is_team_member)

    def test_check_team_membership_returns_false_if_user_not_active_team_member(self):
        # Arrange
        test_project, test_user = create_canned_project()
        test_team = create_canned_team()
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        add_user_to_team(
            test_team, test_user, TeamMemberFunctions.MEMBER.value, is_active=False
        )
        assign_team_to_project(test_project, test_team, TeamRoles.MAPPER.value)
        # Act
        is_team_member = TeamService.check_team_membership(
            test_project.id, allowed_roles, test_user.id
        )
        # Assert
        self.assertFalse(is_team_member)

    def test_get_project_teams_as_dto(self):
        # Arrange
        test_project, _test_user = create_canned_project()
        test_team = create_canned_team()
        assign_team_to_project(test_project, test_team, TeamRoles.MAPPER.value)
        # Act
        teams_dto = TeamService.get_project_teams_as_dto(test_project.id)
        # Assert
        self.assertIn("teams", teams_dto)
        self.assertNotEqual(len(teams_dto["teams"]), 0)
