from schematics import Model
from schematics.types import StringType, IntType, BooleanType, UTCDateTimeType
from schematics.types.compound import ListType, ModelType
from backend.models.dtos.stats_dto import Pagination


class MessageDTO(Model):
    """DTO used to define a message that will be sent to a user"""

    message_id = IntType(serialized_name="messageId")
    subject = StringType(
        serialized_name="subject",
        required=True,
        serialize_when_none=False,
        min_length=1,
    )
    message = StringType(
        serialized_name="message",
        required=True,
        serialize_when_none=False,
        min_length=1,
    )
    from_user_id = IntType(required=True, serialize_when_none=False)
    from_username = StringType(serialized_name="fromUsername", default="")
    display_picture_url = StringType(serialized_name="displayPictureUrl", default="")
    project_id = IntType(serialized_name="projectId")
    project_title = StringType(serialized_name="projectTitle")
    task_id = IntType(serialized_name="taskId")
    message_type = StringType(serialized_name="messageType")
    sent_date = UTCDateTimeType(serialized_name="sentDate")
    read = BooleanType()


class MessagesDTO(Model):
    """DTO used to return all user messages"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.user_messages = []

    pagination = ModelType(Pagination)
    user_messages = ListType(ModelType(MessageDTO), serialized_name="userMessages")


class ChatMessageDTO(Model):
    """DTO describing an individual project chat message"""

    id = IntType(required=False, serialize_when_none=False)
    message = StringType(required=True)
    user_id = IntType(required=True, serialize_when_none=False)
    project_id = IntType(required=True, serialize_when_none=False)
    picture_url = StringType(default=None, serialized_name="pictureUrl")
    timestamp = UTCDateTimeType()
    username = StringType()


class ProjectChatDTO(Model):
    """DTO describing all chat messages on one project"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.chat = []

    chat = ListType(ModelType(ChatMessageDTO))
    pagination = ModelType(Pagination)
