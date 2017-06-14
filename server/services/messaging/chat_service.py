from flask import current_app
from cachetools import TTLCache, cached
from server.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO
from server.models.postgis.project_chat import ProjectChat
from server.services.messaging.message_service import MessageService
from server import db


chat_cache = TTLCache(maxsize=64, ttl=10)


class ChatService:

    @staticmethod
    def post_message(chat_dto: ChatMessageDTO) -> ProjectChatDTO:
        """ Save message to DB and return latest chat"""
        current_app.logger.debug('Posting Chat Message')
        chat_message = ProjectChat.create_from_dto(chat_dto)
        MessageService.send_message_after_chat(chat_dto.user_id, chat_message.message, chat_dto.project_id)
        db.session.commit()
        # Ensure we return latest messages after post
        return ProjectChat.get_messages(chat_dto.project_id, 1)

    @staticmethod
    @cached(chat_cache)
    def get_messages(project_id: int, page: int) -> ProjectChatDTO:
        """ Get all messages attached to a project """
        return ProjectChat.get_messages(project_id, page)
