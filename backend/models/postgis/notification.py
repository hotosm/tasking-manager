from backend import db
from backend.models.postgis.user import User
from backend.models.postgis.message import Message
from backend.models.postgis.utils import timestamp
from backend.models.dtos.notification_dto import NotificationDTO
from datetime import datetime, timedelta


class Notification(db.Model):
    """Describes a Notification for a user"""

    __tablename__ = "notifications"

    __table_args__ = (db.ForeignKeyConstraint(["user_id"], ["users.id"]),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), index=True)
    unread_count = db.Column(db.Integer)
    date = db.Column(db.DateTime, default=timestamp)

    # Relationships
    user = db.relationship(User, foreign_keys=[user_id], backref="notifications")

    def as_dto(self) -> NotificationDTO:
        """Casts notification object to DTO"""
        dto = NotificationDTO()
        dto.user_id = self.user_id
        dto.unread_count = self.unread_count
        dto.date = self.date

        return dto

    def save(self):
        db.session.add(self)
        db.session.commit()

    def update(self):
        self.date = timestamp()
        db.session.commit()

    @staticmethod
    def get_unread_message_count(user_id: int) -> int:
        """Get count of unread messages for user"""
        notifications = Notification.query.filter(
            Notification.user_id == user_id
        ).first()

        # Create if does not exist.
        if notifications is None:
            # In case users are new but have not logged in previously.
            date_value = datetime.today() - timedelta(days=30)
            notifications = Notification(
                user_id=user_id, unread_count=0, date=date_value
            )
            notifications.save()

        # Count messages that the user has received after last check.
        count = (
            Message.query.filter_by(to_user_id=user_id, read=False)
            .filter(Message.date > notifications.date)
            .count()
        )

        return count
