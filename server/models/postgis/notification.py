from server import db
from flask import current_app
from server.models.postgis.user import User
from server.models.postgis.utils import timestamp
from server.models.dtos.notification_dto import NotificationDTO


class Notification(db.Model):
    """ Describes a Notification for a user """

    __tablename__ = "notifications"

    __table_args__ = (db.ForeignKeyConstraint(["user_id"], ["users.id"]),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), index=True)
    unread_count = db.Column(db.Integer)
    date = db.Column(db.DateTime, default=timestamp)

    # Relationships
    user = db.relationship(User, foreign_keys=[user_id], backref="notifications")

    def as_dto(self) -> NotificationDTO:
        """ Casts notification object to DTO """
        dto = NotificationDTO()
        dto.user_id = self.user_id
        dto.unread_count = self.unread_count
        dto.date = self.date

        return dto

    def update_notification_count(self):
        current_app.logger.debug("Updating notification count")
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get_unread_message_count(user_id: int) -> NotificationDTO:
        """ Get count of unread messages for user """
        notifications = Notification.query.filter(
            Notification.user_id == user_id
        ).first()
        return notifications.unread_count
