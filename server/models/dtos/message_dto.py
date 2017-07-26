from schematics import Model
from schematics.types import StringType, IntType, DateTimeType, BooleanType
from schematics.types.compound import ListType, ModelType

from server.models.dtos.stats_dto import Pagination


class MessageDTO(Model):
    """ DTO used to define a message that will be sent to a user """
    message_id = IntType(serialized_name='messageId')
    subject = StringType(required=True)
    message = StringType(required=True, serialize_when_none=False)
    from_user_id = IntType(required=True, serialize_when_none=False)
    from_username = StringType(serialized_name='fromUsername', default="")
    sent_date = DateTimeType(serialized_name='sentDate')
    read = BooleanType()


class MessagesDTO(Model):
    """ DTO used to return all user messages """
    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.user_messages = []

    user_messages = ListType(ModelType(MessageDTO), serialized_name='userMessages')


class ChatMessageDTO(Model):
    """ DTO describing an individual project chat message """
    message = StringType(required=True)
    user_id = IntType(required=True, serialize_when_none=False)
    project_id = IntType(required=True, serialize_when_none=False)
    timestamp = DateTimeType()
    username = StringType()


class ProjectChatDTO(Model):
    """ DTO describing all chat messages on one project """
    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.chat = []

    chat = ListType(ModelType(ChatMessageDTO))
    pagination = ModelType(Pagination)
