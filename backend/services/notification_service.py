from databases import Database

from backend.exceptions import NotFound
from backend.models.postgis.notification import Notification
from backend.models.postgis.utils import timestamp


class NotificationService:
    @staticmethod
    async def update(user_id: int, db: Database):
        async with db.transaction():
            query = """
                SELECT * FROM notifications WHERE user_id = :user_id ORDER BY id LIMIT 1
            """
            notifications = await db.fetch_one(query, {"user_id": user_id})

            if notifications is None:
                raise NotFound(sub_code="NOTIFICATIONS_NOT_FOUND", user_id=user_id)

            # Update the notification's date
            update_query = """
                UPDATE notifications
                SET date = :timestamp
                WHERE user_id = :user_id
            """
            await db.execute(
                update_query, {"user_id": user_id, "timestamp": timestamp()}
            )

            return notifications["unread_count"]

    @staticmethod
    def get_unread_message_count(user_id: int):
        return Notification.get_unread_message_count(user_id)
