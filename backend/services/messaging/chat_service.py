from databases import Database
from fastapi import BackgroundTasks

from backend.exceptions import NotFound
from backend.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO
from backend.models.postgis.project import ProjectStatus
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.project_info import ProjectInfo
from backend.models.postgis.statuses import TeamRoles
from backend.services.messaging.message_service import MessageService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
from backend.services.team_service import TeamService


class ChatService:
    @staticmethod
    async def post_message(
        chat_dto: ChatMessageDTO,
        project_id: int,
        authenticated_user_id: int,
        db: Database,
        background_tasks: BackgroundTasks,
    ) -> ProjectChatDTO:
        project = await ProjectService.get_project_by_id(project_id, db)
        project_info_dto = await ProjectInfo.get_dto_for_locale(
            db, project_id, project.default_locale
        )
        project_name = project_info_dto.name
        is_allowed_user = True
        is_manager_permission = (
            await ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id, db
            )
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
                is_team_member = await TeamService.check_team_membership(
                    project_id, allowed_roles, authenticated_user_id, db
                )
                if not is_team_member:
                    rows = await db.fetch_all(
                        "SELECT user_id FROM project_allowed_users WHERE project_id = :id",
                        {"id": project_id},
                    )
                    allowed_user_ids = [r["user_id"] for r in rows]
                    is_allowed_user = authenticated_user_id in allowed_user_ids

        if is_manager_permission or is_team_member or is_allowed_user:
            chat_message = await ProjectChat.create_from_dto(chat_dto, db)
            background_tasks.add_task(
                MessageService.send_message_after_chat,
                chat_dto.user_id,
                chat_message.message,
                chat_dto.project_id,
                project_name,
            )
            return await ProjectChat.get_messages(chat_dto.project_id, db, 1, 5)
        else:
            raise ValueError("UserNotPermitted- User not permitted to post Comment")

    @staticmethod
    async def get_messages(
        project_id: int, db: Database, page: int, per_page: int
    ) -> ProjectChatDTO:
        """Get all messages attached to a project"""
        return await ProjectChat.get_messages(project_id, db, page, per_page)

    @staticmethod
    async def get_project_chat_by_id(project_id: int, comment_id: int, db: Database):
        await ProjectService.exists(project_id, db)
        query = """
            SELECT *
            FROM project_chat
            WHERE project_id = :project_id AND id = :comment_id
            LIMIT 1
        """
        row = await db.fetch_one(
            query=query, values={"project_id": project_id, "comment_id": comment_id}
        )

        if row is None:
            raise NotFound(
                sub_code="MESSAGE_NOT_FOUND",
                message_id=comment_id,
                project_id=project_id,
            )
        return dict(row)

    @staticmethod
    async def delete_project_chat_by_id(
        project_id: int, comment_id: int, user_id: int, db: Database
    ):
        """
        Deletes a message from a project chat
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
        await ProjectService.exists(project_id, db)

        # Fetch the chat message
        query = """
            SELECT user_id
            FROM project_chat
            WHERE project_id = :project_id AND id = :comment_id
        """
        chat_message = await db.fetch_one(
            query, values={"project_id": project_id, "comment_id": comment_id}
        )

        if chat_message is None:
            raise NotFound(
                sub_code="MESSAGE_NOT_FOUND",
                message_id=comment_id,
                project_id=project_id,
            )

        is_user_allowed = chat_message[
            "user_id"
        ] == user_id or await ProjectAdminService.is_user_action_permitted_on_project(
            user_id, project_id, db
        )

        if is_user_allowed:
            # Delete the chat message
            delete_query = """
                DELETE FROM project_chat
                WHERE project_id = :project_id AND id = :comment_id
            """
            await db.execute(
                delete_query,
                values={"project_id": project_id, "comment_id": comment_id},
            )
        else:
            raise ValueError(
                "DeletePermissionError- User not allowed to delete message"
            )
