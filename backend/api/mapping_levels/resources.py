from databases import Database
from fastapi import APIRouter, Depends

from backend.db import get_db
from backend.services.mapping_levels import MappingLevelService

router = APIRouter(
    prefix="/mapping_levels",
    tags=["mapping_levels"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
async def get_mapping_levels(
    db: Database = Depends(get_db),
):
    """
    List mapping levels
    """
    return await MappingLevelService.get_all(db)
