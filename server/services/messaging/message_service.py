import re
import time

from cachetools import TTLCache, cached
from typing import List
from flask import current_app

from server import create_app
from server.models.dtos.message_dto import MessageDTO
from server.models.postgis.message import Message, NotFound
from server.models.postgis.task import TaskStatus
from server.services.messaging.smtp_service import SMTPService
from server.services.messaging.template_service import get_template, get_profile_url
from server.services.project_service import ProjectService
from server.services.users.user_service import UserService, User


message_cache = TTLCache(maxsize=512, ttl=30)


class MessageServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MessageService:

    @staticmethod
    def send_welcome_message(user: User):
        """ Sends welcome message to all new users at Sign up"""
        text_template = get_template('welcome_message_en.txt')

        text_template = text_template.replace('[USERNAME]', user.username)
        text_template = text_template.replace('[PROFILE_LINK]', get_profile_url(user.username))

        welcome_message = Message()
        welcome_message.to_user_id = user.id
        welcome_message.subject = 'Welcome to the HOT Tasking Manager'
        welcome_message.message = text_template
        welcome_message.save()

        return welcome_message.id

    @staticmethod
    def send_message_after_validation(status: int, validated_by: int, mapped_by: int, task_id: int, project_id: int):
        """ Sends mapper a notification after their task has been marked valid or invalid """
        if validated_by == mapped_by:
            return  # No need to send a message to yourself

        user = UserService.get_user_by_id(mapped_by)
        if user.validation_message == False:
            return # No need to send validation message

        text_template = get_template('invalidation_message_en.txt' if status == TaskStatus.INVALIDATED \
                                                                   else 'validation_message_en.txt')
        status_text = 'marked invalid' if status == TaskStatus.INVALIDATED else 'validated'
        task_link = MessageService.get_task_link(project_id, task_id)

        text_template = text_template.replace('[USERNAME]', user.username)
        text_template = text_template.replace('[TASK_LINK]', task_link)

        validation_message = Message()
        validation_message.from_user_id = validated_by
        validation_message.to_user_id = mapped_by
        validation_message.subject = f'Your mapping in Project {project_id} on {task_link} has just been {status_text}'
        validation_message.message = text_template
        validation_message.add_message()

        SMTPService.send_email_alert(user.email_address, user.username)

    @staticmethod
    def send_message_to_all_contributors(project_id: int, message_dto: MessageDTO):
        """  Sends supplied message to all contributors on specified project.  Message all contributors can take
             over a minute to run, so this method is expected to be called on its own thread """

        app = create_app()  # Because message-all run on background thread it needs it's own app context

        with app.app_context():
            contributors = Message.get_all_contributors(project_id)

            project_link = MessageService.get_project_link(project_id)

            message_dto.message = f'{project_link}<br/><br/>' + message_dto.message  # Append project link to end of message

            msg_count = 0
            for contributor in contributors:
                message = Message.from_dto(contributor[0], message_dto)
                message.save()
                user = UserService.get_user_by_id(contributor[0])
                SMTPService.send_email_alert(user.email_address, user.username)
                msg_count += 1
                if msg_count == 10:
                    time.sleep(0.5)  # Sleep for 0.5 seconds to avoid hitting AWS rate limits every 10 messages
                    msg_count = 0

    @staticmethod
    def send_message_after_comment(comment_from: int, comment: str, task_id: int, project_id: int):
        """ Will send a canned message to anyone @'d in a comment """
        usernames = MessageService._parse_message_for_username(comment)

        if len(usernames) == 0:
            return  # Nobody @'d so return

        task_link = MessageService.get_task_link(project_id, task_id)
        project_title = ProjectService.get_project_title(project_id)
        for username in usernames:

            try:
                user = UserService.get_user_by_username(username)
            except NotFound:
                current_app.logger.error(f'Username {username} not found')
                continue  # If we can't find the user, keep going no need to fail

            message = Message()
            message.from_user_id = comment_from
            message.to_user_id = user.id
            message.subject = f'You were mentioned in a comment in Project {project_id} on {task_link}'
            message.message = comment
            message.add_message()
            SMTPService.send_email_alert(user.email_address, user.username)

    @staticmethod
    def send_message_after_chat(chat_from: int, chat: str, project_id: int):
        """ Send alert to user if they were @'d in a chat message """
        current_app.logger.debug('Sending Message After Chat')
        usernames = MessageService._parse_message_for_username(chat)

        if len(usernames) == 0:
            return  # Nobody @'d so return

        link = MessageService.get_project_link(project_id)

        for username in usernames:
            current_app.logger.debug(f'Searching for {username}')
            try:
                user = UserService.get_user_by_username(username)
            except NotFound:
                current_app.logger.error(f'Username {username} not found')
                continue  # If we can't find the user, keep going no need to fail

            message = Message()
            message.from_user_id = chat_from
            message.to_user_id = user.id
            message.subject = f'You were mentioned in Project Chat on {link}'
            message.message = chat
            message.add_message()
            SMTPService.send_email_alert(user.email_address, user.username)

    @staticmethod
    def resend_email_validation(user_id: int):
        """ Resends the email validation email to the logged in user """
        user = UserService.get_user_by_id(user_id)
        SMTPService.send_verification_email(user.email_address, user.username)

    @staticmethod
    def _parse_message_for_username(message: str) -> List[str]:
        """ Extracts all usernames from a comment looks for format @[user name] """

        parser = re.compile('((?<=@)\w+|\[.+?\])')

        usernames = []
        for username in parser.findall(message):
            username = username.replace("[", "", 1)
            index = username.rfind(']')
            username = username.replace("]", "", index)
            usernames.append(username)

        return usernames

    @staticmethod
    @cached(message_cache)
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

    @staticmethod
    def get_project_link(project_id: int, base_url=None) -> str:
        """ Helper method to generate a link to project chat"""
        if not base_url:
            base_url = current_app.config['APP_BASE_URL']

        link = f'<a href="{base_url}/project/{project_id}?tab=chat">Project {project_id}</a>'
        return link
