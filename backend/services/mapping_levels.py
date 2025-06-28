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
    async def _single_record(
        mapping_level: MappingLevel, db: Database
    ) -> MappingLevelDTO:
        if mapping_level is None:
            raise NotFound(sub_code="MAPPING_LEVEL_NOT_FOUND", mapping_level_id=id)

        dto = mapping_level.as_dto()
        dto.required_badges = await MappingLevelService.get_associated_badges(
            dto.id, db
        )

        return dto

    @staticmethod
    async def get_by_id(id: int, db: Database) -> MappingLevelDTO:
        mapping_level = await MappingLevel.get_by_id(id, db)

        return await MappingLevelService._single_record(mapping_level, db)

    @staticmethod
    async def get_associated_badges(id: int, db: Database) -> List[MappingBadgeDTO]:
        badges = await MappingBadge.get_related_to_level(id, db)

        return [b.as_associated() for b in badges]

    @staticmethod
    async def get_by_name(name: str, db: Database) -> MappingLevel:
        mapping_level = await MappingLevel.get_by_name(name, db)

        return await MappingLevelService._single_record(mapping_level, db)

    @staticmethod
    async def create(data: MappingLevelCreateDTO, db: Database) -> MappingLevelDTO:
        dto = (await MappingLevel.create(data, db)).as_dto()
        dto.required_badges = await MappingLevelService.get_associated_badges(
            dto.id, db
        )

        return dto

    @staticmethod
    async def update(data: MappingLevelUpdateDTO, db: Database) -> MappingLevelDTO:
        dto = (await MappingLevel.update(data, db)).as_dto()
        dto.required_badges = await MappingLevelService.get_associated_badges(
            dto.id, db
        )

        return dto

    @staticmethod
    async def delete(id: int, db: Database):
        await MappingLevel.delete(id, db)
