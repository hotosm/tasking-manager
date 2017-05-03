from server.models.dtos.message_dto import MessageDTO
from server.models.postgis.message import Message


class MessageService:

    @staticmethod
    def send_message_after_validation():
        pass

    @staticmethod
    def send_message_to_all_contributors(project_id: int, message_dto: MessageDTO):
        Message.send_message_to_all_contributors(project_id, message_dto)

    @staticmethod
    def send_message_after_comment():
        pass