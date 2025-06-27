from typing import List

from databases import Database

from backend.exceptions import NotFound
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.dtos.mapping_level_dto import (
    MappingLevelDTO,
    MappingLevelCreateDTO,
    MappingLevelUpdateDTO,
    MappingLevelListDTO,
)
from backend.models.dtos.mapping_badge_dto import MappingBadgeDTO


class MappingLevelService:
    @staticmethod
    async def get_all(db: Database) -> List[MappingLevelDTO]:
        return MappingLevelListDTO(
            levels=list(map(lambda ml: ml.as_dto(), await MappingLevel.get_all(db))),
        )

    @staticmethod
    async def get_by_id(id: int, db: Database) -> MappingLevelDTO:
        mapping_level = await MappingLevel.get_by_id(id, db)

        if mapping_level is None:
            raise NotFound(sub_code="MAPPING_LEVEL_NOT_FOUND", mapping_level_id=id)

        return mapping_level.as_dto()

    @staticmethod
    async def get_badges(id: int, db: Database) -> List[MappingBadgeDTO]:
        badges = await MappingBadge.get_related_to_level(id, db)

        return [b.as_dto() for b in badges]

    @staticmethod
    async def get_by_name(name: str, db: Database) -> MappingLevel:
        mapping_level = await MappingLevel.get_by_name(name, db)

        if mapping_level is None:
            raise NotFound(sub_code="MAPPING_LEVEL_NOT_FOUND", mapping_level_name=name)

        return mapping_level

    @staticmethod
    async def create(data: MappingLevelCreateDTO, db: Database) -> MappingLevelDTO:
        return (await MappingLevel.create(data, db)).as_dto()

    @staticmethod
    async def update(data: MappingLevelUpdateDTO, db: Database) -> MappingLevelDTO:
        return (await MappingLevel.update(data, db)).as_dto()

    @staticmethod
    async def delete(id: int, db: Database):
        await MappingLevel.delete(id, db)
