from backend.models.postgis.notification import Notification
from backend.exceptions import NotFound


class NotificationService:
    @staticmethod
    def update(user_id: int):
        notifications = Notification.query.filter(
            Notification.user_id == user_id
        ).first()

        if notifications is None:
            raise NotFound(sub_code="NOTIFICATIONS_NOT_FOUND", user_id=user_id)

        notifications.update()
        return notifications.unread_count

    @staticmethod
    def get_unread_message_count(user_id: int):
        return Notification.get_unread_message_count(user_id)
