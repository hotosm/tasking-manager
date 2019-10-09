from flask import current_app
from cachetools import TTLCache, cached
from server.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO
from server.models.postgis.project_chat import ProjectChat
from server.services.messaging.message_service import MessageService
from server.services.project_service import ProjectService
from server.services.organisation_service import OrganisationService
from server.services.team_service import TeamService
from server.services.users.user_service import UserService
from server.models.postgis.statuses import TeamRoles
from server import db


chat_cache = TTLCache(maxsize=64, ttl=10)


class ChatService:
    @staticmethod
    def post_message(
        chat_dto: ChatMessageDTO, project_id: int, authenticated_user_id: int
    ) -> ProjectChatDTO:
        """ Save message to DB and return latest chat"""
        current_app.logger.debug("Posting Chat Message")

        if UserService.is_user_blocked(authenticated_user_id):
            return ValueError("User is on read only mode")

        project = ProjectService.get_project_by_id(project_id)
        if project.private:
            author_id = project.author_id
            allowed_roles = [
                TeamRoles.PROJECT_MANAGER.value,
                TeamRoles.VALIDATOR.value,
                TeamRoles.MAPPER.value,
            ]

            is_admin = UserService.is_user_an_admin(authenticated_user_id)
            is_author = UserService.is_user_the_project_author(
                authenticated_user_id, author_id
            )
            is_org_manager = False
            if hasattr(project, "organisation_id") and project.organisation_id:
                org_id = project.organisation_id
                org = OrganisationService.get_organisation_by_id_as_dto(org_id)
                if org.is_manager:
                    is_org_manager = True

            is_team_member = None
            if hasattr(project, "project_teams") and project.project_teams:
                teams_dto = TeamService.get_project_teams_as_dto(project_id)
                if teams_dto.teams:
                    teams_allowed = [
                        team_dto
                        for team_dto in teams_dto.teams
                        if team_dto.role in allowed_roles
                    ]
                    user_membership = [
                        team_dto.team_id
                        for team_dto in teams_allowed
                        if TeamService.is_user_member_of_team(
                            team_dto.team_id, authenticated_user_id
                        )
                    ]
                    if user_membership:
                        is_team_member = True

            for user in project.allowed_users:
                if user.id == authenticated_user_id:
                    is_allowed_user = True
                    break

            if (
                is_admin
                or is_author
                or is_org_manager
                or is_team_member
                or is_allowed_user
            ):
                chat_message = ProjectChat.create_from_dto(chat_dto)
                MessageService.send_message_after_chat(
                    chat_dto.user_id, chat_message.message, chat_dto.project_id
                )
                db.session.commit()
                # Ensure we return latest messages after post
                return ProjectChat.get_messages(chat_dto.project_id, 1)
            else:
                raise ValueError("User not permitted to post Comment")
        else:
            chat_message = ProjectChat.create_from_dto(chat_dto)
            MessageService.send_message_after_chat(
                chat_dto.user_id, chat_message.message, chat_dto.project_id
            )
            db.session.commit()
            # Ensure we return latest messages after post
            return ProjectChat.get_messages(chat_dto.project_id, 1)

    @staticmethod
    @cached(chat_cache)
    def get_messages(project_id: int, page: int, per_page: int) -> ProjectChatDTO:
        """ Get all messages attached to a project """
        return ProjectChat.get_messages(project_id, page, per_page)
