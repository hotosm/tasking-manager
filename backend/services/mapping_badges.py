from typing import List

from databases import Database

from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.dtos.mapping_badge_dto import (
    MappingBadgeDTO,
    MappingBadgeCreateDTO,
    MappingBadgeUpdateDTO,
    MappingBadgeListDTO,
)


class MappingBadgeService:
    @staticmethod
    async def get_by_id(id: int, db: Database) -> MappingBadgeDTO:
        return (await MappingBadge.get_by_id(id, db)).as_dto()

    @staticmethod
    async def get_all(db: Database) -> MappingBadgeListDTO:
        return MappingBadgeListDTO(
            badges=list(map(lambda mb: mb.as_dto(), await MappingBadge.get_all(db))),
        )

    @staticmethod
    async def create(data: MappingBadgeCreateDTO, db: Database) -> MappingBadgeDTO:
        return (await MappingBadge.create(data, db)).as_dto()

    @staticmethod
    async def update(data: MappingBadgeUpdateDTO, db: Database) -> MappingBadgeDTO:
        return (await MappingBadge.update(data, db)).as_dto()

    @staticmethod
    async def delete(id: int, db: Database):
        await MappingBadge.delete(id, db)
