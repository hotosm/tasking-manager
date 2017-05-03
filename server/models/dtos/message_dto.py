from schematics import Model
from schematics.types import StringType, IntType


class MessageDTO(Model):
    """ DTO used to define a message that will be sent to a user """
    subject = StringType(required=True)
    message = StringType(required=True)
    from_user = IntType(required=True)
