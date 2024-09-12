from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
)
from sqlalchemy.orm import relationship
from backend.models.postgis.user import User
from backend.models.postgis.utils import timestamp
from backend.models.dtos.notification_dto import NotificationDTO
from datetime import datetime, timedelta
from backend.db import Base, get_session
from databases import Database

session = get_session()


class Notification(Base):
    """Describes a Notification for a user"""

    __tablename__ = "notifications"

    __table_args__ = (ForeignKeyConstraint(["user_id"], ["users.id"]),)

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    unread_count = Column(Integer)
    date = Column(DateTime, default=timestamp)

    # Relationships
    user = relationship(User, foreign_keys=[user_id], backref="notifications")

    def as_dto(self) -> NotificationDTO:
        """Casts notification object to DTO"""
        dto = NotificationDTO()
        dto.user_id = self.user_id
        dto.unread_count = self.unread_count
        dto.date = self.date

        return dto

    def save(self):
        session.add(self)
        session.commit()

    def update(self):
        self.date = timestamp()
        session.commit()

    @staticmethod
    async def get_unread_message_count(user_id: int, db: Database) -> int:
        """Get count of unread messages for user"""
        query = """
            SELECT unread_count, date
            FROM notifications
            WHERE user_id = :user_id
            ORDER BY id
            LIMIT 1
        """
        notification = await db.fetch_one(query, {"user_id": user_id})

        if notification is None:
            date_value = datetime.today() - timedelta(days=30)
            insert_query = """
                INSERT INTO notifications (user_id, unread_count, date)
                VALUES (:user_id, :unread_count, :date)
            """
            await db.execute(
                insert_query,
                {"user_id": user_id, "unread_count": 0, "date": date_value},
            )
        else:
            date_value = notification["date"]

        message_query = """
            SELECT COUNT(*)
            FROM messages
            WHERE to_user_id = :user_id AND read = False AND date > :date_value
        """
        count = await db.fetch_val(
            message_query, {"user_id": user_id, "date_value": date_value}
        )

        return count
