from databases import Database
from sqlalchemy import Integer, String, Column, ForeignKey, Boolean

from backend.db import Base


class MappingLevel(Base):
    """Allows to sort users by their mapping experience"""

    __tablename__ = "mapping_levels"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    approvals_required = Column(Integer, nullable=False, default=0)
    color = Column(String, nullable=True)
    ordering = Column(Integer, nullable=False)
    is_beginner = Column(Boolean, nullable=False, default=False)

    @staticmethod
    async def get_by_id(id: int, db: Database):
        """
        Return the mapping level for the specified id, or None if not found.
        :param id: ID of the mapping level to retrieve
        :param db: Database connection
        :return: MappingLevel object or None
        """
        query = "SELECT * FROM mapping_levels WHERE id = :id"
        result = await db.fetch_one(query, values={"id": id})

        if result is None:
            return None

        return MappingLevel(**result)

    @staticmethod
    async def get_by_name(name: str, db: Database):
        query = "SELECT * FROM mapping_levels WHERE name = :name"
        result = await db.fetch_one(query, values={"name": name})

        if result is None:
            return None

        return MappingLevel(**result)
