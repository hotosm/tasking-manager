from server.models.dtos.message_dto import ChatMessageDTO
from server.models.postgis.project_chat import ProjectChat


class ChatService:

    @staticmethod
    def post_message(chat_dto: ChatMessageDTO):
        """ Save message to DB"""
        new_message = ProjectChat.create_from_dto(chat_dto)
