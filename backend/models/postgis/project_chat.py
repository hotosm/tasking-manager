import bleach
from markdown import markdown
from loguru import logger
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.models.postgis.user import User
from backend.models.postgis.utils import timestamp
from backend.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO, Pagination
from backend.db import Base, get_session
from databases import Database

session = get_session()


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
        return ChatMessageDTO(
            id=new_message["id"],
            message=new_message["message"],
            picture_url=new_message["picture_url"],
            timestamp=new_message["time_stamp"],
            username=new_message["username"],
            project_id=new_message["project_id"],
            user_id=new_message["user_id"],
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
            chat_dto = ChatMessageDTO(
                id=message["id"],
                message=message["message"],
                picture_url=message["picture_url"],
                timestamp=message["time_stamp"],
                username=message["username"],
                project_id=message["project_id"],
                user_id=message["user_id"],
            )
            chat_dto_dict = chat_dto.dict()
            filtered_chat_dto_dict = {
                k: v
                for k, v in chat_dto_dict.items()
                if k not in ["project_id", "user_id"]
            }
            dto.chat.append(filtered_chat_dto_dict)

        dto.pagination = Pagination.from_total_count(
            page=page, per_page=per_page, total=total_count
        )

        return dto
