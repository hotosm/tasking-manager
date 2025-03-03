from enum import Enum

from databases import Database
from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, ForeignKeyConstraint, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import false

from backend.db import Base
from backend.exceptions import NotFound
from backend.models.dtos.message_dto import MessageDTO, MessagesDTO
from backend.models.postgis.project import Project
from backend.models.postgis.task import Task, TaskAction
from backend.models.postgis.user import User
from backend.models.postgis.utils import timestamp


class MessageType(Enum):
    """Describes the various kinds of messages a user might receive"""

    SYSTEM = 1  # Generic system-generated message
    BROADCAST = 2  # Broadcast message from a project manager
    MENTION_NOTIFICATION = 3  # Notification that user was mentioned in a comment/chat
    VALIDATION_NOTIFICATION = 4  # Notification that user's mapped task was validated
    INVALIDATION_NOTIFICATION = 5  # Notification that user's mapped task was invalidated
    REQUEST_TEAM_NOTIFICATION = 6
    INVITATION_NOTIFICATION = 7
    TASK_COMMENT_NOTIFICATION = 8
    PROJECT_CHAT_NOTIFICATION = 9
    PROJECT_ACTIVITY_NOTIFICATION = 10
    TEAM_BROADCAST = 11  # Broadcast message from a team manager


class Message(Base):
    """Describes an individual Message a user can send"""

    __tablename__ = "messages"

    __table_args__ = (ForeignKeyConstraint(["task_id", "project_id"], ["tasks.id", "tasks.project_id"]),)

    id = Column(Integer, primary_key=True)
    message = Column(String)
    subject = Column(String)
    from_user_id = Column(BigInteger, ForeignKey("users.id"))
    to_user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    task_id = Column(Integer, index=True)
    message_type = Column(Integer, index=True)
    date = Column(DateTime, default=timestamp)
    read = Column(Boolean, default=False)

    # Relationships
    from_user = relationship(User, foreign_keys=[from_user_id])
    to_user = relationship(User, foreign_keys=[to_user_id], backref="messages")
    project = relationship(Project, foreign_keys=[project_id], backref="messages")
    task = relationship(
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
        message.date = timestamp()
        message.read = False
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

    async def save(self, db: Database):
        """Save"""
        await db.execute(
            Message.__table__.insert().values(
                subject=self.subject,
                message=self.message,
                from_user_id=self.from_user_id,
                to_user_id=self.to_user_id,
                project_id=self.project_id,
                task_id=self.task_id,
                message_type=self.message_type,
                read=self.read,
                date=self.date,
            )
        )

    @staticmethod
    async def get_all_contributors(project_id: int, db: Database):
        """Get all contributors to a project using async raw SQL"""

        query = """
            SELECT DISTINCT contributor
            FROM (
                SELECT mapped_by AS contributor
                FROM tasks
                WHERE project_id = :project_id
                  AND mapped_by IS NOT NULL
                UNION
                SELECT validated_by AS contributor
                FROM tasks
                WHERE project_id = :project_id
                  AND validated_by IS NOT NULL
            ) AS contributors
        """

        rows = await db.fetch_all(query=query, values={"project_id": project_id})

        contributors = [row["contributor"] for row in rows]
        return contributors

    @staticmethod
    async def get_all_tasks_contributors(project_id: int, task_id: int, db: Database):
        """Get all contributors of a task"""
        query = """
            SELECT DISTINCT u.username
            FROM task_history th
            JOIN users u ON th.user_id = u.id
            WHERE th.project_id = :project_id
            AND th.task_id = :task_id
            AND th.action != :comment_action
        """
        contributors = await db.fetch_all(
            query,
            {
                "project_id": project_id,
                "task_id": task_id,
                "comment_action": TaskAction.COMMENT.name,
            },
        )

        return [contributor["username"] for contributor in contributors]

    @staticmethod
    def get_unread_message_count(user_id: int):
        """Get count of unread messages for user"""
        return Message.query.filter(Message.to_user_id == user_id, Message.read == false()).count()

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
    async def delete_multiple_messages(message_ids: list, user_id: int, db: Database):
        """Deletes the specified messages to the user"""
        delete_query = """
            DELETE FROM messages
            WHERE to_user_id = :user_id AND id = ANY(:message_ids)
        """
        await db.execute(delete_query, {"user_id": user_id, "message_ids": message_ids})

    @staticmethod
    async def delete_all_messages(user_id: int, db: Database, message_type_filters: list = None):
        """Deletes all messages to the user
        -----------------------------------
        :param user_id: user id of the user whose messages are to be deleted
        :param message_type_filters: list of message types to filter by
        returns: None
        """
        delete_query = """
            DELETE FROM messages
            WHERE to_user_id = :user_id
        """
        params = {"user_id": user_id}

        if message_type_filters:
            delete_query += " AND message_type = ANY(:message_type_filters)"
            params["message_type_filters"] = message_type_filters
        await db.execute(delete_query, params)

    @staticmethod
    async def mark_multiple_messages_read(message_ids: list, user_id: int, db: Database):
        """Marks the specified messages as read
        ----------------------------------------
        :param message_ids: list of message ids to mark as read
        :param user_id: user id of the user who is marking the messages as read
        :param db: database connection
        """
        async with db.transaction():
            query = """
                UPDATE messages
                SET read = True
                WHERE to_user_id = :user_id AND id = ANY(:message_ids)
            """
            await db.execute(query, {"user_id": user_id, "message_ids": message_ids})

    @staticmethod
    async def mark_all_messages_read(user_id: int, db: Database, message_type_filters: list = None):
        """Marks all messages as read
        ----------------------------------------
        :param user_id: user id of the user who is marking the messages as read
        :param db: database connection
        :param message_type_filters: list of message types to filter by
        """
        async with db.transaction():
            query = """
                UPDATE messages
                SET read = TRUE
                WHERE to_user_id = :user_id
                AND read = FALSE
            """

            params = {"user_id": user_id}

            if message_type_filters:
                query += " AND message_type = ANY(:message_type_filters)"
                params["message_type_filters"] = message_type_filters

            await db.execute(query, params)
