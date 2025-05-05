from databases import Database

from backend.exceptions import NotFound
from backend.models.postgis.mapping_level import MappingLevel


class MappingLevelService:
    @staticmethod
    async def get_by_id(mapping_level_id: int, db: Database) -> MappingLevel:
        mapping_level = await MappingLevel.get_by_id(mapping_level_id, db)

        if mapping_level is None:
            raise NotFound(sub_code="MAPPING_LEVEL_NOT_FOUND", mapping_level_id=mapping_level_id)

        return mapping_level
