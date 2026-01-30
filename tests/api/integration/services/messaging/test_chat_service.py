from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.project_info import ProjectInfo
from backend.services.messaging.message_service import MessageService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
from backend.services.team_service import TeamService
import pytest

from backend.exceptions import NotFound
from backend.models.postgis.statuses import ProjectStatus
from backend.models.postgis.team import TeamRoles, TeamMemberFunctions
from backend.models.dtos.message_dto import ChatMessageDTO
from backend.services.messaging.chat_service import ChatService
from tests.api.helpers.test_helpers import (  # use api helpers like in other refactors
    create_canned_project,
    create_canned_user,
    return_canned_user,
    create_canned_team,
    assign_team_to_project,
    add_user_to_team,
)


@pytest.mark.anyio
class TestChatService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # persisted project + author
        self.canned_project, self.canned_author, self.canned_project_id = (
            await create_canned_project(self.db)
        )

        # chat dto
        self.chat_dto = ChatMessageDTO(
            message="Test Message",
            user_id=self.canned_author.id,
            project_id=int(self.canned_project_id),
            timestamp=datetime(2022, 6, 30, 5, 45, 6, 198755),
            username=self.canned_author.username,
        )

        # test user
        canned = await return_canned_user(username="test_user", id=100000, db=self.db)
        self.test_user = await create_canned_user(self.db, canned)

        # BackgroundTasks replacement: MagicMock with add_task
        self.bg_tasks = MagicMock()
        self.bg_tasks.add_task = MagicMock()

    @patch.object(ProjectChat, "get_messages", new_callable=AsyncMock)
    @patch.object(ProjectChat, "create_from_dto", new_callable=AsyncMock)
    @patch.object(TeamService, "check_team_membership", new_callable=AsyncMock)
    @patch.object(
        ProjectAdminService,
        "is_user_action_permitted_on_project",
        new_callable=AsyncMock,
    )
    @patch.object(ProjectInfo, "get_dto_for_locale", new_callable=AsyncMock)
    @patch.object(ProjectService, "get_project_by_id", new_callable=AsyncMock)
    async def test_post_message_schedules_background_task(
        self,
        mock_get_project,
        mock_get_dto,
        mock_is_permitted,
        mock_check_team,
        mock_create_from_dto,
        mock_get_messages,
    ):
        # Arrange
        # project stub (not private so allowed_users/team check path is irrelevant)
        project = MagicMock()
        project.status = ProjectStatus.PUBLISHED.value
        project.default_locale = "en"
        project.private = False
        project.allowed_users = []
        mock_get_project.return_value = project

        # project info (provides project_name)
        project_info = MagicMock()
        project_info.name = "Test Project Name"
        mock_get_dto.return_value = project_info

        # allow the user (manager permission)
        mock_is_permitted.return_value = True
        mock_check_team.return_value = False

        # what create_from_dto returns
        chat_message = MagicMock()
        chat_message.message = "Test Message"
        mock_create_from_dto.return_value = chat_message

        # get_messages return value
        expected_messages = ["m1", "m2"]
        mock_get_messages.return_value = expected_messages

        # BackgroundTasks replacement: MagicMock with add_task
        bg_tasks = MagicMock()
        bg_tasks.add_task = MagicMock()

        # Act
        result = await ChatService.post_message(
            self.chat_dto,
            int(self.canned_project_id),
            self.canned_author.id,
            db=self.db,
            background_tasks=bg_tasks,
        )

        # Assert: collaborators were called
        mock_get_project.assert_awaited_once_with(int(self.canned_project_id), self.db)
        mock_get_dto.assert_awaited_once_with(
            self.db, int(self.canned_project_id), project.default_locale
        )
        mock_is_permitted.assert_awaited_once_with(
            self.canned_author.id, int(self.canned_project_id), self.db
        )
        mock_create_from_dto.assert_awaited_once_with(self.chat_dto, self.db)
        mock_get_messages.assert_awaited_once_with(
            self.chat_dto.project_id, self.db, 1, 5
        )

        # Assert: background task scheduled with correct callable and args
        bg_tasks.add_task.assert_called_once_with(
            MessageService.send_message_after_chat,
            self.chat_dto.user_id,
            chat_message.message,
            self.chat_dto.project_id,
            project_info.name,
        )

        # And the function returned the expected messages
        assert result == expected_messages

    async def test_post_message_raises_error_if_user_not_manager_in_draft_project(self):
        # Arrange: mark project draft
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.DRAFT.value, "id": int(self.canned_project_id)},
        )
        self.chat_dto.user_id = self.test_user.id
        self.chat_dto.username = self.test_user.username

        # Act/Assert
        with pytest.raises(ValueError):
            await ChatService.post_message(
                self.chat_dto,
                int(self.canned_project_id),
                self.test_user.id,
                self.db,
                self.bg_tasks,
            )

    async def test_delete_project_chat_by_id_raises_not_found_if_comment_is_not_found(
        self,
    ):
        # Arrange
        project_id = 999999
        # Act/Assert
        with pytest.raises(NotFound):
            await ChatService.delete_project_chat_by_id(project_id, 11, 11, self.db)

    async def test_post_message_sets_bg_task_if_user_member_of_allowed_team_in_private_project(
        self,
    ):
        # Arrange: create team, assign to project, add user to team, mark project published+private
        canned_team = await create_canned_team(self.db)

        # assign_team_to_project expects project_id and team_id (not objects)
        await assign_team_to_project(
            int(self.canned_project_id),
            canned_team.id,
            TeamRoles.MAPPER.value,
            db=self.db,
        )

        # add_user_to_team expects team object and user object — keep same helper
        await add_user_to_team(
            canned_team,
            self.test_user,
            TeamMemberFunctions.MEMBER.value,
            True,
            db=self.db,
        )

        # The message should be from test_user
        self.chat_dto.user_id = self.test_user.id
        self.chat_dto.username = self.test_user.username

        await self.db.execute(
            "UPDATE projects SET status = :status, private = true WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.canned_project_id),
            },
        )

        # Act
        await ChatService.post_message(
            self.chat_dto,
            int(self.canned_project_id),
            self.test_user.id,  # authenticated_user_id should be the posting user
            self.db,
            self.bg_tasks,
        )

        # Assert: background task scheduled
        self.bg_tasks.add_task.assert_called()

    async def test_post_message_raises_error_if_user_not_member_of_allowed_team_in_private_project(
        self,
    ):
        # Arrange: assign team but do NOT add user as member; mark project published+private
        canned_team = await create_canned_team(self.db)
        # pass ids (not objects)
        await assign_team_to_project(
            int(self.canned_project_id),
            canned_team.id,
            TeamRoles.MAPPER.value,
            db=self.db,
        )

        self.chat_dto.user_id = self.test_user.id
        self.chat_dto.username = self.test_user.username

        await self.db.execute(
            "UPDATE projects SET status = :status, private = true WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.canned_project_id),
            },
        )

        # Act/Assert: posting as test_user (not member) should raise
        with pytest.raises(ValueError):
            await ChatService.post_message(
                self.chat_dto,
                int(self.canned_project_id),
                self.test_user.id,
                self.db,
                self.bg_tasks,
            )

    async def test_delete_project_chat_by_id_deletes_comment_if_user_is_comment_author(
        self,
    ):
        # Arrange: mark published
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.canned_project_id),
            },
        )

        # Post message as test_user
        self.chat_dto.user_id = self.test_user.id
        comments = await ChatService.post_message(
            self.chat_dto,
            int(self.canned_project_id),
            self.test_user.id,
            self.db,
            self.bg_tasks,
        )

        # extract comment (structure is ProjectChatDTO with .chat list)
        comment = comments.chat[0]

        # Act
        await ChatService.delete_project_chat_by_id(
            int(self.canned_project_id), comment.id, self.test_user.id, self.db
        )

        # Assert deleted
        with pytest.raises(NotFound):
            await ChatService.get_project_chat_by_id(
                int(self.canned_project_id), comment.id, self.db
            )

    async def test_project_managers_can_delete_any_comment(self):
        # Arrange: mark published, add comment by non-manager
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.canned_project_id),
            },
        )

        # Post message by test_user
        self.chat_dto.user_id = self.test_user.id
        comments = await ChatService.post_message(
            self.chat_dto,
            int(self.canned_project_id),
            self.test_user.id,
            self.db,
            self.bg_tasks,
        )

        comment = comments.chat[0]
        # Act: project manager (author) deletes
        await ChatService.delete_project_chat_by_id(
            int(self.canned_project_id), comment.id, self.canned_author.id, self.db
        )

        # Assert
        with pytest.raises(NotFound):
            await ChatService.get_project_chat_by_id(
                int(self.canned_project_id), comment.id, self.db
            )

    async def test_delete_project_chat_by_id_raises_error_if_user_is_not_comment_author_and_project_manager(
        self,
    ):
        # Arrange: mark published, add comment by author
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.canned_project_id),
            },
        )

        comments = await ChatService.post_message(
            self.chat_dto,
            int(self.canned_project_id),
            self.canned_author.id,
            self.db,
            self.bg_tasks,
        )
        comment = comments.chat[0]

        # Act/Assert: test_user (neither author nor manager) cannot delete
        with pytest.raises(ValueError):
            await ChatService.delete_project_chat_by_id(
                int(self.canned_project_id), comment.id, self.test_user.id, self.db
            )
