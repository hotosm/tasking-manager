import threading
from unittest.mock import patch

from backend.exceptions import NotFound
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
        self.test_user = return_canned_user(username="test_user", id=100000)
        self.test_user.create()

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
        self.chat_dto.user_id = self.test_user.id
        self.chat_dto.username = self.test_user.username
        # Act/Assert
        with self.assertRaises(ValueError):
            ChatService.post_message(
                self.chat_dto, self.canned_project.id, self.test_user.id
            )

    @patch.object(threading, "Thread")
    def test_post_message_sets_thread_if_user_member_of_allowed_team_in_private_project(
        self, mock_thread
    ):
        # Arrange
        canned_team = create_canned_team()
        assign_team_to_project(self.canned_project, canned_team, TeamRoles.MAPPER.value)
        add_user_to_team(
            canned_team, self.test_user, TeamMemberFunctions.MEMBER.value, True
        )
        self.chat_dto.user_id = self.test_user.id
        self.chat_dto.username = self.test_user.username
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
        canned_team = create_canned_team()
        assign_team_to_project(self.canned_project, canned_team, TeamRoles.MAPPER.value)
        self.chat_dto.user_id = self.test_user.id
        self.chat_dto.username = self.test_user.username
        self.canned_project.status = ProjectStatus.PUBLISHED.value
        self.canned_project.private = True
        # Act/Assert
        with self.assertRaises(ValueError):
            ChatService.post_message(
                self.chat_dto, self.canned_project.id, self.test_user.id
            )

    def test_delete_project_chat_by_id_raises_not_found_if_comment_is_not_found(self):
        """Test raises not found if comment is not found"""
        # Arrange
        project_id = 999999
        # Act/Assert
        with self.assertRaises(NotFound):
            ChatService.delete_project_chat_by_id(project_id, 11, 11)

    def test_delete_project_chat_by_id_deletes_comment_if_user_is_comment_author(self):
        """Test successfully deletes comment if user is comment author"""
        # Arrange
        self.chat_dto.user_id = self.test_user.id
        self.canned_project.status = ProjectStatus.PUBLISHED.value
        self.canned_project.save()
        comments = ChatService.post_message(
            self.chat_dto, self.canned_project.id, self.test_user.id
        )
        comment = comments.chat[0]
        # Act
        ChatService.delete_project_chat_by_id(
            self.canned_project.id, comment.id, self.test_user.id
        )
        # Assert
        with self.assertRaises(NotFound):
            ChatService.get_project_chat_by_id(self.canned_project.id, comment.id)

    def test_project_managers_can_delete_any_comment(self):
        """Project managers can delete any comment"""
        # Arrange
        # Add a comment by a user who is not the project manager
        self.canned_project.status = ProjectStatus.PUBLISHED.value
        self.canned_project.save()
        self.chat_dto.user_id = self.test_user.id
        comments = ChatService.post_message(
            self.chat_dto, self.canned_project.id, self.test_user.id
        )
        comment = comments.chat[0]
        # Act
        ChatService.delete_project_chat_by_id(
            self.canned_project.id, comment.id, self.canned_author.id
        )
        # Assert
        with self.assertRaises(NotFound):
            ChatService.get_project_chat_by_id(self.canned_project.id, comment.id)

    def test_delete_project_chat_by_id_raises_error_if_user_is_not_comment_author_and_project_manager(
        self,
    ):
        """Test raises error if user is not comment author and project manager"""
        # Arrange
        self.canned_project.status = ProjectStatus.PUBLISHED.value
        self.canned_project.save()
        comments = ChatService.post_message(
            self.chat_dto, self.canned_project.id, self.canned_author.id
        )
        comment = comments.chat[0]
        # Act/Assert
        with self.assertRaises(ValueError):
            ChatService.delete_project_chat_by_id(
                self.canned_project.id, comment.id, self.test_user.id
            )
