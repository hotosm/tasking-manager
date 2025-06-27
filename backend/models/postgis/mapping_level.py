from databases import Database
from sqlalchemy import (
    Integer, String, Column, Boolean, ForeignKey, UniqueConstraint,
    PrimaryKeyConstraint,
)
from asyncpg import ForeignKeyViolationError

from backend.db import Base
from backend.exceptions import Conflict
from backend.models.dtos.mapping_level_dto import (
    MappingLevelDTO,
    MappingLevelCreateDTO,
    MappingLevelUpdateDTO,
)


class MappingLevel(Base):
    """Allows to sort users by their mapping experience"""

    __tablename__ = "mapping_levels"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    approvals_required = Column(Integer, nullable=False, default=0)
    color = Column(String, nullable=True)
    ordering = Column(Integer, nullable=False)
    is_beginner = Column(Boolean, nullable=False, default=False)

    def as_dto(self) -> MappingLevelDTO:
        dto = MappingLevelDTO(
            id=self.id,
            name=self.name,
            approvalsRequired=self.approvals_required,
            color=self.color,
            ordering=self.ordering,
            isBeginner=self.is_beginner,
        )

        return dto

    @staticmethod
    async def create(data: MappingLevelCreateDTO, db: Database):
        async with db.transaction():
            next_ordering = await db.execute("select max(ordering)+1 from mapping_levels")
            query = """
                INSERT INTO mapping_levels (name, approvals_required, color, ordering, is_beginner)
                VALUES (:name, :approvals_required, :color, :ordering, :is_beginner)
                RETURNING id;
            """
            level_id = await db.execute(
                query,
                {
                    "name": data.name,
                    "approvals_required": data.approvals_required,
                    "color": data.color,
                    "ordering": next_ordering,
                    "is_beginner": data.is_beginner,
                },
            )

            for badge in data.required_badges:
                query = "INSERT INTO mapping_level_badges (level_id, badge_id) VALUES (:level_id, :badge_id)"
                await db.execute(query, values={
                    "level_id": level_id,
                    "badge_id": badge.id,
                })

            return await MappingLevel.get_by_id(level_id, db)

    @staticmethod
    async def update(data: MappingLevelUpdateDTO, db: Database):
        level_dict = data.dict(exclude_unset=True)
        updated_values = {
            key: level_dict[key] for key in level_dict.keys() if key not in ["id", "required_badges"]
        }
        set_clause = ", ".join(f"{key} = :{key}" for key in updated_values.keys())

        async with db.transaction():
            if set_clause:
                update_query = f"""
                UPDATE mapping_levels
                SET {set_clause}
                WHERE id = :id
                """
                await db.execute(update_query, values={**updated_values, "id": data.id})

            clear_query = "DELETE FROM mapping_level_badges WHERE level_id = :level_id"
            await db.execute(clear_query, values={"level_id": data.id})

            for badge in data.required_badges:
                query = "INSERT INTO mapping_level_badges (level_id, badge_id) VALUES (:level_id, :badge_id)"
                await db.execute(query, values={
                    "level_id": data.id,
                    "badge_id": badge.id,
                })

        return await MappingLevel.get_by_id(data.id, db)

    @staticmethod
    async def delete(id: int, db: Database):
        delete_query = "DELETE FROM mapping_levels WHERE id = :id"
        try:
            await db.execute(delete_query, values={"id": id})
        except ForeignKeyViolationError:
            raise Conflict("MAPPING_LEVEL_HAS_USERS")

    @staticmethod
    async def get_by_id(id: int, db: Database):
        query = "SELECT * FROM mapping_levels WHERE id = :id"
        result = await db.fetch_one(query, values={"id": id})

        return MappingLevel(**result) if result is not None else None

    @staticmethod
    async def get_all(db: Database):
        """
        Returns all mapping levels ordered.
        :param db: Database connection
        :return: Array of MappingLevel
        """
        query = "SELECT * FROM mapping_levels ORDER BY ordering ASC"
        result = await db.fetch_all(query)

        return [MappingLevel(**row) for row in result]

    @staticmethod
    async def get_by_name(name: str, db: Database):
        query = "SELECT * FROM mapping_levels WHERE name = :name"
        result = await db.fetch_one(query, values={"name": name})

        return MappingLevel(**result) if result is not None else None

    @staticmethod
    async def get_beginner_level(db: Database):
        query = "SELECT * FROM mapping_levels WHERE is_beginner"
        result = await db.fetch_one(query)

        return MappingLevel(**result) if result is not None else None

    @staticmethod
    async def get_max_level(db: Database):
        query = "SELECT * FROM mapping_levels ORDER BY ordering DESC LIMIT 1"
        result = await db.fetch_one(query)

        return MappingLevel(**result) if result is not None else None


class MappingLevelBadges(Base):
    __tablename__ = "mapping_level_badges"

    level_id = Column(Integer, ForeignKey("mapping_levels.id"))
    badge_id = Column(Integer, ForeignKey("mapping_badges.id"))

    __table_args__ = (
        UniqueConstraint("level_id", "badge_id"),
        PrimaryKeyConstraint("level_id", "badge_id"),
    )
