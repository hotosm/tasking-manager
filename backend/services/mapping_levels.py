from typing import List

from databases import Database

from backend.exceptions import NotFound
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.dtos.mapping_level_dto import MappingLevelDTO


class MappingLevelService:
    @staticmethod
    async def get_all(db: Database) -> List[MappingLevelDTO]:
        return list(map(lambda ml: ml.as_dto(), await MappingLevel.get_all(db)))

    @staticmethod
    async def get_by_id(id: int, db: Database) -> MappingLevel:
        mapping_level = await MappingLevel.get_by_id(id, db)

        if mapping_level is None:
            raise NotFound(sub_code="MAPPING_LEVEL_NOT_FOUND", mapping_level_id=id)

        return mapping_level

    @staticmethod
    async def get_by_name(name: str, db: Database) -> MappingLevel:
        mapping_level = await MappingLevel.get_by_name(name, db)

        if mapping_level is None:
            raise NotFound(sub_code="MAPPING_LEVEL_NOT_FOUND", mapping_level_name=name)

        return mapping_level
