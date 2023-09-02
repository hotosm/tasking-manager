import threading
from flask import current_app

from backend import db
from backend.exceptions import NotFound
from backend.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.project_info import ProjectInfo
from backend.services.messaging.message_service import MessageService
from backend.services.project_service import ProjectService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.team_service import TeamService
from backend.models.postgis.statuses import TeamRoles
from backend.models.postgis.project import ProjectStatus


class ChatService:
    @staticmethod
    def post_message(
        chat_dto: ChatMessageDTO, project_id: int, authenticated_user_id: int
    ) -> ProjectChatDTO:
        """Save message to DB and return latest chat"""
        current_app.logger.debug("Posting Chat Message")

        project = ProjectService.get_project_by_id(project_id)
        project_name = ProjectInfo.get_dto_for_locale(
            project_id, project.default_locale
        ).name
        is_allowed_user = True
        is_manager_permission = ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id
        )
        is_team_member = False

        # Draft (public/private) accessible only for is_manager_permission
        if (
            ProjectStatus(project.status) == ProjectStatus.DRAFT
            and not is_manager_permission
        ):
            raise ValueError("UserNotPermitted- User not permitted to post Comment")

        if project.private:
            is_allowed_user = False
            if not is_manager_permission:
                allowed_roles = [
                    TeamRoles.PROJECT_MANAGER.value,
                    TeamRoles.VALIDATOR.value,
                    TeamRoles.MAPPER.value,
                ]
                is_team_member = TeamService.check_team_membership(
                    project_id, allowed_roles, authenticated_user_id
                )
                if not is_team_member:
                    is_allowed_user = (
                        len(
                            [
                                user
                                for user in project.allowed_users
                                if user.id == authenticated_user_id
                            ]
                        )
                        > 0
                    )

        if is_manager_permission or is_team_member or is_allowed_user:
            chat_message = ProjectChat.create_from_dto(chat_dto)
            db.session.commit()
            threading.Thread(
                target=MessageService.send_message_after_chat,
                args=(
                    chat_dto.user_id,
                    chat_message.message,
                    chat_dto.project_id,
                    project_name,
                ),
            ).start()
            # Ensure we return latest messages after post
            return ProjectChat.get_messages(chat_dto.project_id, 1, 5)
        else:
            raise ValueError("UserNotPermitted- User not permitted to post Comment")

    @staticmethod
    def get_messages(project_id: int, page: int, per_page: int) -> ProjectChatDTO:
        """Get all messages attached to a project"""
        return ProjectChat.get_messages(project_id, page, per_page)

    @staticmethod
    def get_project_chat_by_id(project_id: int, comment_id: int) -> ProjectChat:
        """Get a message from a project chat
        ----------------------------------------
        :param project_id: The id of the project the message belongs to
        :param message_id: The message id to fetch
        ----------------------------------------
        :raises NotFound: When the message is not found
        ----------------------------------------
        returns: The message
        """
        chat_message = ProjectChat.query.filter(
            ProjectChat.project_id == project_id,
            ProjectChat.id == comment_id,
        ).one_or_none()
        if chat_message is None:
            raise NotFound(
                sub_code="MESSAGE_NOT_FOUND",
                message_id=comment_id,
                project_id=project_id,
            )

        return chat_message

    @staticmethod
    def delete_project_chat_by_id(project_id: int, comment_id: int, user_id: int):
        """Deletes a message from a project chat
        ----------------------------------------
        :param project_id: The id of the project the message belongs to
        :param message_id: The message id to delete
        :param user_id: The id of the requesting user
        ----------------------------------------
        :raises NotFound: When the message is not found
        :raises Unauthorized: When the user is not allowed to delete the message
        ----------------------------------------
        returns: None
        """
        # Check if project exists
        ProjectService.exists(project_id)

        chat_message = ProjectChat.query.filter(
            ProjectChat.project_id == project_id,
            ProjectChat.id == comment_id,
        ).one_or_none()
        if chat_message is None:
            raise NotFound(
                sub_code="MESSAGE_NOT_FOUND",
                message_id=comment_id,
                project_id=project_id,
            )

        is_user_allowed = (
            chat_message.user_id == user_id
            or ProjectAdminService.is_user_action_permitted_on_project(
                user_id, project_id
            )
        )
        if is_user_allowed:
            db.session.delete(chat_message)
            db.session.commit()
        else:
            raise ValueError(
                "DeletePermissionError- User not allowed to delete message"
            )
