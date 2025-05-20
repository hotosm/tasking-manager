from typing import List

from databases import Database

from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.dtos.mapping_badge_dto import MappingBadgeDTO, MappingBadgeCreateDTO


class MappingBadgeService:
    @staticmethod
    async def get_all(db: Database) -> List[MappingBadgeDTO]:
        return list(map(lambda mb: mb.as_dto(), await MappingBadge.get_all(db)))

    @staticmethod
    async def create(data: MappingBadgeCreateDTO, db: Database):
        return MappingBadgeDTO(**(await MappingBadge.create(data, db)))
