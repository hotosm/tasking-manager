import bleach
from markdown import markdown
from loguru import logger
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.models.postgis.user import User
from backend.models.postgis.utils import timestamp
from backend.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO, Pagination
from backend.db import Base, get_session
session = get_session()

class ProjectChat(Base):
    """Contains all project info localized into supported languages"""

    __tablename__ = "project_chat"
    id = Column(BigInteger, primary_key=True)
    project_id = Column(
        Integer, ForeignKey("projects.id"), index=True, nullable=False
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_stamp = Column(DateTime, nullable=False, default=timestamp)
    message = Column(String, nullable=False)

    # Relationships
    posted_by = relationship(User, foreign_keys=[user_id])

    @classmethod
    def create_from_dto(cls, dto: ChatMessageDTO):
        """Creates a new ProjectInfo class from dto, used from project edit"""
        logger.debug("Create chat message from DTO")
        new_message = cls()
        new_message.project_id = dto.project_id
        new_message.user_id = dto.user_id

        # Use bleach to remove any potential mischief
        allowed_tags = [
            "a",
            "b",
            "blockquote",
            "br",
            "code",
            "em",
            "h1",
            "h2",
            "h3",
            "img",
            "i",
            "li",
            "ol",
            "p",
            "pre",
            "strong",
            "ul",
        ]
        allowed_atrributes = {"a": ["href", "rel"], "img": ["src", "alt"]}
        clean_message = bleach.clean(
            markdown(dto.message, output_format="html"),
            tags=allowed_tags,
            attributes=allowed_atrributes,
        )
        clean_message = bleach.linkify(clean_message)
        new_message.message = clean_message

        session.add(new_message)
        return new_message

    @staticmethod
    def get_messages(project_id: int, page: int, per_page: int = 20) -> ProjectChatDTO:
        """Get all messages on the project"""

        project_messages = (
            session.query(ProjectChat).filter_by(project_id=project_id)
            .order_by(ProjectChat.time_stamp.desc())
            .paginate(page=page, per_page=per_page, error_out=True)
        )

        dto = ProjectChatDTO()

        if project_messages.total == 0:
            return dto

        for message in project_messages.items:
            chat_dto = ChatMessageDTO()
            chat_dto.message = message.message
            chat_dto.username = message.posted_by.username
            chat_dto.picture_url = message.posted_by.picture_url
            chat_dto.timestamp = message.time_stamp
            chat_dto.id = message.id

            dto.chat.append(chat_dto)

        dto.pagination = Pagination(project_messages)

        return dto
