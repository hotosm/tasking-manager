import pytest
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
from tests.api.helpers.test_helpers import (
    add_user_to_team,
    assign_team_to_project,
    create_canned_project,
    create_canned_team,
    create_canned_user,
    return_canned_user,
)


@pytest.mark.anyio
class TestTeamService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        # persisted canned team for each test
        self.test_team = await create_canned_team(self.db)

    async def test_check_team_membership_returns_true_if_user_member_of_team_with_allowed_role(
        self,
    ):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(self.db)
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]

        # assign team to project with allowed role and add user as active member
        await assign_team_to_project(
            test_project_id, self.test_team.id, allowed_roles[0], self.db
        )
        await add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, True, self.db
        )

        # Act
        is_team_member = await TeamService.check_team_membership(
            test_project_id, allowed_roles, test_user.id, db=self.db
        )

        # Assert
        assert is_team_member

    async def test_check_team_membership_returns_false_if_user_member_of_team_with_unallowed_role(
        self,
    ):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(self.db)
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]

        # team assigned to project with a different role
        await assign_team_to_project(
            test_project_id, self.test_team.id, TeamRoles.MAPPER.value, self.db
        )

        # Act
        is_team_member = await TeamService.check_team_membership(
            test_project_id, allowed_roles, test_user.id, db=self.db
        )

        # Assert
        assert not is_team_member

    async def test_check_team_membership_returns_false_if_user_member_of_team_not_assigned_to_project(
        self,
    ):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(self.db)
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]

        # user is a member of the team, but team not assigned to the project
        await add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, True, self.db
        )

        # Act
        is_team_member = await TeamService.check_team_membership(
            test_project.id, allowed_roles, test_user.id, db=self.db
        )

        # Assert
        assert not is_team_member

    async def test_check_team_membership_returns_false_if_user_not_active_team_member(
        self,
    ):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(self.db)
        allowed_roles = [TeamRoles.PROJECT_MANAGER.value]

        # user is a member but not active
        await add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, False, self.db
        )
        await assign_team_to_project(
            test_project_id, self.test_team.id, TeamRoles.MAPPER.value, self.db
        )

        # Act
        is_team_member = await TeamService.check_team_membership(
            test_project.id, allowed_roles, test_user.id, db=self.db
        )

        # Assert
        assert not is_team_member

    async def test_get_project_teams_as_dto(self):
        # Arrange
        test_project, _test_user, test_project_id = await create_canned_project(self.db)
        await assign_team_to_project(
            test_project_id, self.test_team.id, TeamRoles.MAPPER.value, self.db
        )

        # Act
        teams_dto = await TeamService.get_project_teams_as_dto(
            test_project_id, db=self.db
        )
        # Assert
        assert teams_dto.teams is not None
        assert len(teams_dto.teams) > 0

    @patch.object(TeamService, "is_user_team_member")
    async def test_request_to_join_team_raises_error_if_user_already_team_member(
        self, mock_is_team_member
    ):
        # Arrange
        test_user = await create_canned_user(self.db)
        await add_user_to_team(
            self.test_team, test_user, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        mock_is_team_member.return_value = True

        # Act / Assert
        with pytest.raises(TeamServiceError):
            await TeamService.request_to_join_team(
                self.test_team.id, test_user.id, db=self.db
            )

    @patch.object(TeamService, "is_user_team_member")
    @patch.object(MessageService, "_push_messages")
    async def test_request_to_join_team_sends_notification_if_team_is_by_request_and_manager_has_allowed_notification(
        self, mock_send_notification, mock_is_team_member
    ):

        # Arrange
        await self.db.execute(
            """
            UPDATE teams
            SET join_method = :join_method
            WHERE id = :team_id
            """,
            {
                "join_method": TeamJoinMethod.BY_REQUEST.value,
                "team_id": self.test_team.id,
            },
        )
        test_user = await create_canned_user(self.db)
        mock_is_team_member.return_value = False

        test_manager = await return_canned_user(
            username="test manager", id=1234, db=self.db
        )
        test_manager = await create_canned_user(self.db, test_manager)
        await add_user_to_team(self.test_team, test_manager, 1, True, self.db)

        await self.db.execute(
            """
            UPDATE team_members
            SET join_request_notifications = :enabled
            WHERE user_id = :user_id AND team_id = :team_id
            """,
            {
                "enabled": True,
                "user_id": test_manager.id,
                "team_id": self.test_team.id,
            },
        )

        # Act
        await TeamService.request_to_join_team(
            self.test_team.id, test_user.id, db=self.db
        )

        # Assert
        mock_send_notification.assert_called()

    @patch.object(TeamService, "is_user_team_member")
    @patch.object(MessageService, "_push_messages")
    async def test_request_to_join_team_doesnt_send_notification_if_manager_has_disallowed_notification(
        self, mock_send_notification, mock_is_team_member
    ):
        # Arrange
        await self.db.execute(
            """
            UPDATE teams
            SET join_method = :join_method
            WHERE id = :team_id
            """,
            {
                "join_method": TeamJoinMethod.BY_REQUEST.value,
                "team_id": self.test_team.id,
            },
        )
        test_user = await create_canned_user(self.db)
        mock_is_team_member.return_value = False

        test_manager = await return_canned_user(
            username="test manager", id=1234, db=self.db
        )
        test_manager = await create_canned_user(self.db, test_manager)
        await add_user_to_team(self.test_team, test_manager, 1, True, self.db)

        await self.db.execute(
            """
            UPDATE team_members
            SET join_request_notifications = :enabled
            WHERE user_id = :user_id AND team_id = :team_id
            """,
            {
                "enabled": False,
                "user_id": test_manager.id,
                "team_id": self.test_team.id,
            },
        )
        # Act
        await TeamService.request_to_join_team(
            self.test_team.id, test_user.id, db=self.db
        )

        # Assert
        mock_send_notification.assert_not_called()
