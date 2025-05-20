from databases import Database
from sqlalchemy import Integer, String, Column, ForeignKey, Boolean, JSON

from backend.db import Base
from backend.models.dtos.mapping_badge_dto import MappingBadgeDTO, MappingBadgeCreateDTO


class MappingBadge(Base):
    """Represents achievements by users that can be later used to grant mapping
    levels"""

    __tablename__ = "mapping_badges"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    requirements = Column(JSON, nullable=False)
    is_enabled = Column(Boolean, nullable=False, default=True)

    def as_dto(self) -> MappingBadgeDTO:
        return MappingBadgeDTO(
            id=self.id,
            name=self.name,
            description=self.description,
            image_path=self.image_path,
            requirements=self.requirements,
            is_enabled=self.is_enabled,
        )

    @staticmethod
    async def create(data: MappingBadgeCreateDTO, db: Database) -> MappingBadgeDTO:
        query = """
            INSERT INTO mapping_badges (name, description, image_path, requirements, is_enabled)
            VALUES (:name, :description, :image_path, :requirements, :is_enabled)
            RETURNING id;
        """
        badge_id = await db.execute(
            query,
            {
                "name": data.name,
                "description": data.description,
                "image_path": data.image_path,
                "requirements": data.requirements,
                "is_enabled": data.is_enabled,
            },
        )

        query_select = """
            SELECT *
            FROM mapping_badges
            WHERE id = :id
        """
        return await db.fetch_one(query_select, {"id": badge_id})

    @staticmethod
    async def get_all(db: Database):
        """
        Returns all mapping badges.
        :param db: Database connection
        :return: Array of MappingBadge
        """
        query = "SELECT * FROM mapping_badges ORDER BY name ASC"
        result = await db.fetch_all(query)

        return [MappingBadge(**row) for row in result]
