from sqlalchemy.sql.expression import false

from backend import db
from flask import current_app
from enum import Enum

from backend.exceptions import NotFound
from backend.models.dtos.message_dto import MessageDTO, MessagesDTO
from backend.models.postgis.user import User
from backend.models.postgis.task import Task, TaskHistory, TaskAction
from backend.models.postgis.project import Project
from backend.models.postgis.utils import timestamp


class MessageType(Enum):
    """Describes the various kinds of messages a user might receive"""

    SYSTEM = 1  # Generic system-generated message
    BROADCAST = 2  # Broadcast message from a project manager
    MENTION_NOTIFICATION = 3  # Notification that user was mentioned in a comment/chat
    VALIDATION_NOTIFICATION = 4  # Notification that user's mapped task was validated
    INVALIDATION_NOTIFICATION = (
        5  # Notification that user's mapped task was invalidated
    )
    REQUEST_TEAM_NOTIFICATION = 6
    INVITATION_NOTIFICATION = 7
    TASK_COMMENT_NOTIFICATION = 8
    PROJECT_CHAT_NOTIFICATION = 9
    PROJECT_ACTIVITY_NOTIFICATION = 10
    TEAM_BROADCAST = 11  # Broadcast message from a team manager


class Message(db.Model):
    """Describes an individual Message a user can send"""

    __tablename__ = "messages"

    __table_args__ = (
        db.ForeignKeyConstraint(
            ["task_id", "project_id"], ["tasks.id", "tasks.project_id"]
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String)
    subject = db.Column(db.String)
    from_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    to_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), index=True)
    task_id = db.Column(db.Integer, index=True)
    message_type = db.Column(db.Integer, index=True)
    date = db.Column(db.DateTime, default=timestamp)
    read = db.Column(db.Boolean, default=False)

    # Relationships
    from_user = db.relationship(User, foreign_keys=[from_user_id])
    to_user = db.relationship(User, foreign_keys=[to_user_id], backref="messages")
    project = db.relationship(Project, foreign_keys=[project_id], backref="messages")
    task = db.relationship(
        Task,
        primaryjoin="and_(Task.id == foreign(Message.task_id), Task.project_id == Message.project_id)",
        backref="messages",
    )

    @classmethod
    def from_dto(cls, to_user_id: int, dto: MessageDTO):
        """Creates new message from DTO"""
        message = cls()
        message.subject = dto.subject
        message.message = dto.message
        message.from_user_id = dto.from_user_id
        message.to_user_id = to_user_id
        message.project_id = dto.project_id
        message.task_id = dto.task_id
        if dto.message_type is not None:
            message.message_type = MessageType(dto.message_type)

        return message

    def as_dto(self) -> MessageDTO:
        """Casts message object to DTO"""
        dto = MessageDTO()
        dto.message_id = self.id
        dto.message = self.message
        dto.sent_date = self.date
        dto.read = self.read
        dto.subject = self.subject
        dto.project_id = self.project_id
        dto.task_id = self.task_id
        if self.message_type is not None:
            dto.message_type = MessageType(self.message_type).name
        else:
            dto.message_type = MessageType.SYSTEM.name

        if self.from_user_id:
            dto.from_username = self.from_user.username
            dto.display_picture_url = self.from_user.picture_url

        return dto

    def add_message(self):
        """Add message into current transaction - DO NOT COMMIT HERE AS MESSAGES ARE PART OF LARGER TRANSACTIONS"""
        current_app.logger.debug("Adding message to session")
        db.session.add(self)

    def save(self):
        """Save"""
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get_all_contributors(project_id: int):
        """Get all contributors to a project"""

        contributors = (
            db.session.query(Task.mapped_by)
            .filter(Task.project_id == project_id)
            .filter(Task.mapped_by.isnot(None))
            .union(
                db.session.query(Task.validated_by)
                .filter(Task.project_id == project_id)
                .filter(Task.validated_by.isnot(None))
            )
            .distinct()
        ).all()
        return contributors

    @staticmethod
    def get_all_tasks_contributors(project_id: int, task_id: int):
        """Get all contributors of a task"""
        contributors = (
            TaskHistory.query.distinct(TaskHistory.user_id)
            .filter(TaskHistory.project_id == project_id)
            .filter(TaskHistory.task_id == task_id)
            .filter(TaskHistory.action != TaskAction.COMMENT.name)
            .all()
        )
        contributors = [
            contributor.actioned_by.username for contributor in contributors
        ]
        return contributors

    def mark_as_read(self):
        """Mark the message in scope as Read"""
        self.read = True
        db.session.commit()

    @staticmethod
    def get_unread_message_count(user_id: int):
        """Get count of unread messages for user"""
        return Message.query.filter(
            Message.to_user_id == user_id, Message.read == false()
        ).count()

    @staticmethod
    def get_all_messages(user_id: int) -> MessagesDTO:
        """Gets all messages to the user"""
        user_messages = Message.query.filter(Message.to_user_id == user_id).all()

        if len(user_messages) == 0:
            raise NotFound(
                sub_code="MESSAGES_NOT_FOUND",
                user_id=user_id,
            )

        messages_dto = MessagesDTO()
        for message in user_messages:
            messages_dto.user_messages.append(message.as_dto())

        return messages_dto

    @staticmethod
    def delete_multiple_messages(message_ids: list, user_id: int):
        """Deletes the specified messages to the user"""
        Message.query.filter(
            Message.to_user_id == user_id, Message.id.in_(message_ids)
        ).delete(synchronize_session=False)
        db.session.commit()

    @staticmethod
    def delete_all_messages(user_id: int, message_type_filters: list = None):
        """Deletes all messages to the user
        -----------------------------------
        :param user_id: user id of the user whose messages are to be deleted
        :param message_type_filters: list of message types to filter by
        returns: None
        """
        query = Message.query.filter(Message.to_user_id == user_id)
        if message_type_filters:
            query = query.filter(Message.message_type.in_(message_type_filters))
        query.delete(synchronize_session=False)
        db.session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def mark_multiple_messages_read(message_ids: list, user_id: int):
        """Marks the specified messages as read
        ----------------------------------------
        :param message_ids: list of message ids to mark as read
        :param user_id: user id of the user who is marking the messages as read
        """
        Message.query.filter(
            Message.to_user_id == user_id, Message.id.in_(message_ids)
        ).update({Message.read: True}, synchronize_session=False)
        db.session.commit()

    @staticmethod
    def mark_all_messages_read(user_id: int, message_type_filters: list = None):
        """Marks all messages as read
        ----------------------------------------
        :param user_id: user id of the user who is marking the messages as read
        :param message_type_filters: list of message types to filter by
        """
        # https://docs.sqlalchemy.org/en/13/orm/query.html#sqlalchemy.orm.query.Query.update
        query = Message.query.filter(
            Message.to_user_id == user_id, Message.read == false()
        )
        if message_type_filters:
            query = query.filter(Message.message_type.in_(message_type_filters))
        query.update({Message.read: True}, synchronize_session=False)
        db.session.commit()
