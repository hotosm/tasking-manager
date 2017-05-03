from flask import current_app
from server.models.dtos.message_dto import MessageDTO
from server.models.postgis.message import Message, NotFound


class MessageServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MessageService:

    @staticmethod
    def send_message_after_validation(validated_by: int, mapped_by: int, task_id: int):
        """ Sends mapper a thank you, after their task has been marked as valid """
        validation_message = Message()
        validation_message.from_user_id = validated_by
        validation_message.to_user_id = mapped_by
        # TODO add hyperlink to subject for task
        validation_message.subject = 'The task you mapped you has just been validated'
        validation_message.message = 'Hi \n I just validated your mapping.\n\n Awesome work! \n\n Keep mapping and hope to see you soon'
        validation_message.add_message()

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

    @staticmethod
    def get_message(message_id: int, user_id: int) -> Message:
        """ Gets the specified message """
        message = Message.query.get(message_id)

        if message is None:
            raise NotFound()

        if message.to_user_id != int(user_id):
            raise MessageServiceError(f'User {user_id} attempting to access another users message {message_id}')

        return message

    @staticmethod
    def get_message_as_dto(message_id: int, user_id: int):
        message = MessageService.get_message(message_id, user_id)
        return message.as_dto()

    @staticmethod
    def delete_message(message_id: int, user_id: int):
        """ Deletes the specified message """
        message = MessageService.get_message(message_id, user_id)
        message.delete()
