from server.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO
from server.models.postgis.project_chat import ProjectChat


class ChatService:

    @staticmethod
    def post_message(chat_dto: ChatMessageDTO):
        """ Save message to DB"""
        ProjectChat.create_from_dto(chat_dto)

    @staticmethod
    def get_messages(project_id: int, page: int) -> ProjectChatDTO:
        """ Get all messages attached to a project """
        return ProjectChat.get_messages(project_id, page)
