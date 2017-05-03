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

    @staticmethod
    def has_user_new_messages(user_id: int) -> dict:
        """ Determines if the user has any unread messages """
        count = Message.get_unread_message_count(user_id)

        new_messages = False
        if count > 0:
            new_messages = True

        return dict(newMessages=new_messages, unread=count)

    @staticmethod
    def get_all_messages(user_id: int):
        """ Get all messages for user """
        return Message.get_all_messages(user_id)



