from schematics import Model
from schematics.types import IntType, DateTimeType


class NotificationDTO(Model):
    """ DTO used to define a notification count that will be sent to a user """

    user_id = IntType(serialized_name="userId")
    date = DateTimeType(serialized_name="date")
    unread_count = IntType(serialized_name="unreadCount")
