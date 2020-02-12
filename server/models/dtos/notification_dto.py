from schematics import Model
from schematics.types import IntType, DateTimeType
from server.models.postgis.utils import utc_format


class NotificationDTO(Model):
    """ DTO used to define a notification count that will be sent to a user """

    user_id = IntType(serialized_name="userId")
    date = DateTimeType(serialized_name="date", serialized_format=utc_format())
    unread_count = IntType(serialized_name="unreadCount")
