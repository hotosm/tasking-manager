from schematics import Model
from schematics.types import StringType, IntType, DateTimeType, BooleanType
from schematics.types.compound import ListType, ModelType


class MessageDTO(Model):
    """ DTO used to define a message that will be sent to a user """
    subject = StringType(required=True)
    message = StringType(required=True)
    from_user_id = IntType(required=True, serialize_when_none=False)
    from_username = StringType(serialized_name='fromUsername')
    sent_date = DateTimeType(serialized_name='sentDate')
    read = BooleanType()


class MessagesDTO(Model):
    """ DTO used to return all user messages """

    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.user_messages = []

    user_messages = ListType(ModelType(MessageDTO), serialized_name='userMessages')
