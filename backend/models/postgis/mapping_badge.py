from databases import Database
from sqlalchemy import Integer, String, Column, ForeignKey, Boolean, JSON

from backend.db import Base
from backend.models.dtos.mapping_badge_dto import (
    MappingBadgeDTO,
    MappingBadgeCreateDTO,
    MappingBadgeUpdateDTO,
)


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
            imagePath=self.image_path,
            requirements=self.requirements,
            isEnabled=self.is_enabled,
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

        return await MappingBadge.get_by_id(badge_id, db)

    @staticmethod
    async def update(data: MappingBadgeUpdateDTO, db: Database):
        badge_dict = data.dict(exclude_unset=True)
        updated_values = {
            key: badge_dict[key] for key in badge_dict.keys() if key not in ["id"]
        }
        set_clause = ", ".join(f"{key} = :{key}" for key in updated_values.keys())

        if set_clause:
            update_query = f"""
            UPDATE mapping_badges
            SET {set_clause}
            WHERE id = :id
            """
            await db.execute(update_query, values={**updated_values, "id": data.id})

        return await MappingBadge.get_by_id(data.id, db)

    @staticmethod
    async def delete(id: int, db: Database):
        delete_query = "DELETE FROM mapping_badges WHERE id = :id"
        await db.execute(delete_query, values={"id": id})

    @staticmethod
    async def get_by_id(id: int, db: Database):
        query = "SELECT * FROM mapping_badges WHERE id = :id"
        result = await db.fetch_one(query, values={"id": id})

        return MappingBadge(**result) if result is not None else None

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
