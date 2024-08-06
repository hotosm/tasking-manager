from unittest.mock import patch

from backend.models.postgis.statuses import (
    TeamJoinMethod,
    TeamMemberFunctions,
    TeamRoles,
)
from backend.services.team_service import (
    TeamService,
    MessageService,
    TeamServiceError,
)
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    add_user_to_team,
    assign_team_to_project,
    create_canned_project,
    create_canned_team,
    create_canned_user,
    return_canned_user,
)


class TestTeamService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_team = create_canned_team()

    def test_check_team_membership_returns_true_if_user_member_of_team_with_allowed_role(
        self,
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        assign_team_to_project(test_project, self.test_team, allowed_roles[0])
        add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, is_active=True
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
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        assign_team_to_project(test_project, self.test_team, TeamRoles.MAPPER.value)
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
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, is_active=True
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
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]
        add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, is_active=False
        )
        assign_team_to_project(test_project, self.test_team, TeamRoles.MAPPER.value)
        # Act
        is_team_member = TeamService.check_team_membership(
            test_project.id, allowed_roles, test_user.id
        )
        # Assert
        self.assertFalse(is_team_member)

    def test_get_project_teams_as_dto(self):
        # Arrange
        test_project, _test_user = create_canned_project()
        assign_team_to_project(test_project, self.test_team, TeamRoles.MAPPER.value)
        # Act
        teams_dto = TeamService.get_project_teams_as_dto(test_project.id)
        # Assert
        self.assertIn("teams", teams_dto)
        self.assertNotEqual(len(teams_dto["teams"]), 0)

    @patch.object(TeamService, "is_user_team_member")
    def test_request_to_join_team_raises_error_if_user_already_team_member(
        self, mock_is_team_member
    ):
        # Arrange
        test_user = create_canned_user()
        add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, True
        )
        mock_is_team_member.return_value = True
        # Act/Assert
        with self.assertRaises(TeamServiceError):
            TeamService.request_to_join_team(self.test_team.id, test_user.id)

    @patch.object(TeamService, "is_user_team_member")
    @patch.object(MessageService, "_push_messages")
    def test_request_to_join_team_sends_notification_if_team_is_by_request_and_manager_has_allowed_notification(
        self, mock_send_notification, mock_is_team_member
    ):
        # Arrange
        self.test_team.join_method = TeamJoinMethod.BY_REQUEST.value
        test_user = create_canned_user()
        mock_is_team_member.return_value = False
        test_manager = return_canned_user("test manager", 1234)
        test_manager = add_user_to_team(self.test_team, test_manager, 1, True)
        test_manager.join_request_notifications = True

        # Act
        TeamService.request_to_join_team(self.test_team.id, test_user.id)
        # Assert
        mock_send_notification.assert_called()

    @patch.object(TeamService, "is_user_team_member")
    @patch.object(MessageService, "_push_messages")
    def test_request_to_join_team_doesnt_send_notification_if_manager_has_disallowed_notification(
        self, mock_send_notification, mock_is_team_member
    ):
        # Arrange
        self.test_team.join_method = TeamJoinMethod.BY_REQUEST.value
        test_user = create_canned_user()
        mock_is_team_member.return_value = False
        test_manager = return_canned_user("test manager", 1234)
        test_manager = add_user_to_team(self.test_team, test_manager, 1, True)
        test_manager.join_request_notifications = False
        # Act
        TeamService.request_to_join_team(self.test_team.id, test_user.id)
        # Assert
        mock_send_notification.assert_not_called()
