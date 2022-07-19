import threading
from unittest.mock import patch

from backend.models.postgis.statuses import ProjectStatus
from backend.models.postgis.team import TeamRoles, TeamMemberFunctions
from tests.backend.base import BaseTestCase
from backend.models.dtos.message_dto import ChatMessageDTO
from backend.services.messaging.chat_service import ChatService
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    return_canned_user,
    create_canned_team,
    assign_team_to_project,
    add_user_to_team,
)


class TestChatService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.canned_project, self.canned_author = create_canned_project()
        self.chat_dto = ChatMessageDTO()
        self.chat_dto.message = "Test Message"
        self.chat_dto.user_id = self.canned_author.id
        self.chat_dto.project_id = self.canned_project.id
        self.chat_dto.timestamp = "2022-06-30T05:45:06.198755Z"
        self.chat_dto.username = self.canned_author.username

    @patch.object(threading, "Thread")
    def test_post_message_sets_thread_if_user_allowed(self, mock_thread):
        # Act
        ChatService.post_message(
            self.chat_dto, self.canned_project.id, self.canned_author.id
        )
        # Assert
        mock_thread.assert_called()

    def test_post_message_raises_error_if_user_not_manager_in_draft_project(self):
        # Arrange
        self.canned_project.status = ProjectStatus.DRAFT.value
        sender = return_canned_user()
        sender.id = 100000
        sender.username = "test_user"
        sender.create()
        self.chat_dto.user_id = sender.id
        self.chat_dto.username = sender.username
        # Act/Assert
        with self.assertRaises(ValueError):
            ChatService.post_message(self.chat_dto, self.canned_project.id, sender.id)

    @patch.object(threading, "Thread")
    def test_post_message_sets_thread_if_user_member_of_allowed_team_in_private_project(
        self, mock_thread
    ):
        # Arrange
        sender = return_canned_user()
        sender.id = 100000
        sender.username = "test_user"
        sender.create()
        canned_team = create_canned_team()
        assign_team_to_project(self.canned_project, canned_team, TeamRoles.MAPPER.value)
        add_user_to_team(canned_team, sender, TeamMemberFunctions.MEMBER.value, True)
        self.chat_dto.user_id = sender.id
        self.chat_dto.username = sender.username
        self.canned_project.status = ProjectStatus.PUBLISHED.value
        self.canned_project.private = True
        # Act
        ChatService.post_message(
            self.chat_dto, self.canned_project.id, self.canned_author.id
        )
        # Assert
        mock_thread.assert_called()

    def test_post_message_raises_error_if_user_not_member_of_allowed_team_in_private_project(
        self,
    ):
        # Arrange
        sender = return_canned_user()
        sender.id = 100000
        sender.username = "test_user"
        sender.create()
        canned_team = create_canned_team()
        assign_team_to_project(self.canned_project, canned_team, TeamRoles.MAPPER.value)
        self.chat_dto.user_id = sender.id
        self.chat_dto.username = sender.username
        self.canned_project.status = ProjectStatus.PUBLISHED.value
        self.canned_project.private = True
        # Act/Assert
        with self.assertRaises(ValueError):
            ChatService.post_message(self.chat_dto, self.canned_project.id, sender.id)
