import re
import bleach
from databases import Database
from loguru import logger
from markdown import markdown
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.db import Base
from backend.models.dtos.message_dto import (
    ChatMessageDTO,
    ListChatMessageDTO,
    Pagination,
    ProjectChatDTO,
)
from backend.models.postgis.user import User
from backend.models.postgis.utils import timestamp


class ProjectChat(Base):
    """Contains all project info localized into supported languages"""

    __tablename__ = "project_chat"
    id = Column(BigInteger, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_stamp = Column(DateTime, nullable=False, default=timestamp)
    message = Column(String, nullable=False)

    # Relationships
    posted_by = relationship(User, foreign_keys=[user_id])

    @classmethod
    async def create_from_dto(cls, dto: ChatMessageDTO, db: Database):
        """Creates a new ProjectInfo class from dto, used from project edit"""
        logger.debug("Create chat message from DTO")

        # Extended allowed tags to support all markdown features
        allowed_tags = [
            "a",
            "abbr",
            "acronym",
            "b",
            "blockquote",
            "br",
            "code",
            "em",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "img",
            "i",
            "li",
            "ol",
            "p",
            "pre",
            "strong",
            "ul",
            "div",
            "table",
            "thead",
            "tbody",
            "tfoot",
            "tr",
            "td",
            "th",
            "iframe",
            "input",
            "hr",
            "del",
            "s",
            "strike",
            "span",
            "caption",
            "col",
            "colgroup",
        ]

        # Extended allowed attributes
        allowed_attributes = {
            "a": ["href", "rel", "target", "title"],
            "img": ["src", "alt", "title", "width", "height"],
            "iframe": [
                "width",
                "height",
                "src",
                "title",
                "frameborder",
                "allow",
                "referrerpolicy",
                "allowfullscreen",
            ],
            "input": ["type", "checked", "disabled"],
            "th": ["align", "scope"],
            "td": ["align", "colspan", "rowspan"],
            "table": ["class"],
            "code": ["class"],
            "pre": ["class"],
        }

        text = re.sub(r"~~(.*?)~~", r"<del>\1</del>", dto.message)

        html_content = markdown(
            text,
            extensions=[
                "markdown.extensions.tables",
                "markdown.extensions.fenced_code",
                "markdown.extensions.nl2br",
                "markdown.extensions.sane_lists",
                "markdown.extensions.codehilite",
            ],
        )

        # Sanitize with bleach
        clean_message = bleach.clean(
            html_content, tags=allowed_tags, attributes=allowed_attributes, strip=False
        )

        # Linkify URLs in the message
        clean_message = bleach.linkify(clean_message, parse_email=True)

        query = """
            INSERT INTO project_chat (project_id, user_id, message, time_stamp)
            VALUES (:project_id, :user_id, :message, :time_stamp)
            RETURNING id, project_id, user_id, message, time_stamp
        """

        values = {
            "project_id": dto.project_id,
            "user_id": dto.user_id,
            "time_stamp": dto.timestamp,
            "message": clean_message,
        }

        new_message_id = await db.execute(query=query, values=values)
        new_message = await db.fetch_one(
            """
                SELECT pc.id, pc.message, pc.project_id, pc.time_stamp, u.id AS user_id, u.username, u.picture_url
                FROM project_chat pc
                JOIN users u ON u.id = pc.user_id
                WHERE pc.id = :message_id
            """,
            {"message_id": new_message_id},
        )
        return ListChatMessageDTO(
            id=new_message["id"],
            message=new_message["message"],
            picture_url=new_message["picture_url"],
            timestamp=new_message["time_stamp"],
            username=new_message["username"],
        )

    @staticmethod
    async def get_messages(
        project_id: int, db: Database, page: int, per_page: int = 20
    ) -> ProjectChatDTO:
        """Get all messages on the project"""

        offset = (page - 1) * per_page
        count_query = """
            SELECT COUNT(*)
            FROM project_chat
            WHERE project_id = :project_id
        """
        messages_query = """
            SELECT pc.id, pc.message, pc.project_id, pc.time_stamp, u.id AS user_id, u.username, u.picture_url
            FROM project_chat pc
            JOIN users u ON u.id = pc.user_id
            WHERE pc.project_id = :project_id
            ORDER BY pc.time_stamp DESC
            LIMIT :limit OFFSET :offset
        """

        total_count = await db.fetch_val(count_query, {"project_id": project_id})

        if total_count == 0:
            return ProjectChatDTO()  # Return empty DTO if no messages

        messages = await db.fetch_all(
            messages_query,
            {"project_id": project_id, "limit": per_page, "offset": offset},
        )

        dto = ProjectChatDTO()

        for message in messages:
            chat_dto = ListChatMessageDTO(
                id=message["id"],
                message=message["message"],
                picture_url=message["picture_url"],
                timestamp=message["time_stamp"],
                username=message["username"],
            )
            dto.chat.append(chat_dto)

        dto.pagination = Pagination.from_total_count(
            page=page, per_page=per_page, total=total_count
        )

        return dto
