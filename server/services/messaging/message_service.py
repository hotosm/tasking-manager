import re
from typing import List

from flask import current_app

from server.models.dtos.message_dto import MessageDTO
from server.models.postgis.message import Message, NotFound
from server.services.users.user_service import SMTPService
from server.services.users.user_service import UserService


class MessageServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MessageService:

    @staticmethod
    def send_message_after_validation(validated_by: int, mapped_by: int, task_id: int, project_id: int):
        """ Sends mapper a thank you, after their task has been marked as valid """
        if validated_by == mapped_by:
            return  # No need to send a thankyou to yourself

        task_link = MessageService.get_task_link(project_id, task_id)

        validation_message = Message()
        validation_message.from_user_id = validated_by
        validation_message.to_user_id = mapped_by
        validation_message.subject = f'Your mapping on {task_link} has just been validated'
        validation_message.message = f'Hi \n I just validated your mapping on {task_link}.\n\n Awesome work! \n\n Keep mapping :)'
        validation_message.add_message()

        user = UserService.get_user_by_id(mapped_by)
        SMTPService.send_verification_email(user.email_address, user.username)

    @staticmethod
    def send_message_to_all_contributors(project_id: int, message_dto: MessageDTO):
        """ Sends supplied message to all contributors on specified project """
        Message.send_message_to_all_contributors(project_id, message_dto)

    @staticmethod
    def send_message_after_comment(comment_from: int, comment: str, task_id: int, project_id :int):
        """ Will send a canned message to anyone @'d in a comment """
        usernames = MessageService._parse_comment_for_username(comment)

        if len(usernames) == 0:
            return  # Nobody @'d so return

        link = MessageService.get_task_link(project_id, task_id)
        for username in usernames:

            try:
                user = UserService.get_user_by_username(username)
            except NotFound:
                continue  # If we can't find the user, keep going no need to fail

            message = Message()
            message.from_user_id = comment_from
            message.to_user_id = user.id
            message.subject = f'You were mentioned in a comment on {link}'
            message.message = comment
            message.add_message()
            SMTPService.send_email_alert(user.email_address, user.username)

    @staticmethod
    def resend_email_validation(user_id: int):
        """ Resends the email validation email to the logged in user """
        user = UserService.get_user_by_id(user_id)
        SMTPService.send_verification_email(user.email_address, user.username)

    @staticmethod
    def _parse_comment_for_username(comment: str) -> List[str]:
        """ Extracts all usernames from a comment looks for format @[user name] """

        parser = re.compile('((?<=@)\w+|\[.+?\])')

        usernames = []
        for username in parser.findall(comment):
            username = username.replace("[", "", 1)
            index = username.rfind(']')
            username = username.replace("]", "", index)
            usernames.append(username)

        return usernames

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
        """ Gets the selected message and marks it as read """
        message = MessageService.get_message(message_id, user_id)
        message.mark_as_read()
        return message.as_dto()

    @staticmethod
    def delete_message(message_id: int, user_id: int):
        """ Deletes the specified message """
        message = MessageService.get_message(message_id, user_id)
        message.delete()

    @staticmethod
    def get_task_link(project_id: int, task_id: int, base_url=None) -> str:
        """ Helper method that generates a link to the task """
        if not base_url:
            base_url = current_app.config['APP_BASE_URL']

        link = f'<a href="{base_url}/project/{project_id}/?task={task_id}">Task {task_id}</a>'
        return link
