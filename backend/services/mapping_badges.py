from typing import List

from databases import Database

from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.dtos.mapping_badge_dto import (
    MappingBadgeDTO, MappingBadgeCreateDTO, MappingBadgeUpdateDTO,
)


class MappingBadgeService:
    @staticmethod
    async def get_all(db: Database) -> List[MappingBadgeDTO]:
        return list(map(lambda mb: mb.as_dto(), await MappingBadge.get_all(db)))

    @staticmethod
    async def create(data: MappingBadgeCreateDTO, db: Database) -> MappingBadgeDTO:
        return MappingBadgeDTO(**((await MappingBadge.create(data, db)).as_dto().dict()))

    @staticmethod
    async def update(data: MappingBadgeUpdateDTO, db: Database) -> MappingBadgeDTO:
        return MappingBadgeDTO(**((await MappingBadge.update(data, db)).as_dto().dict()))
