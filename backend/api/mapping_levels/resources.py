from databases import Database
from fastapi import APIRouter, Depends

from backend.db import get_db
from backend.models.dtos.mapping_level_dto import (
    MappingLevelCreateDTO,
    MappingLevelUpdateDTO,
)
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.mapping_levels import MappingLevelService
from backend.services.users.authentication_service import pm_only

router = APIRouter(
    prefix="/mapping_levels",
    tags=["mapping_levels"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
async def get_mapping_levels(
    db: Database = Depends(get_db),
):
    return await MappingLevelService.get_all(db)


@router.post("/")
async def create_mapping_level(
    data: MappingLevelCreateDTO,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    return await MappingLevelService.create(data, db)


@router.patch("/{level_id}/")
async def update_mapping_level(
    data: MappingLevelUpdateDTO,
    level_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    data.id = level_id

    return await MappingLevelService.update(data, db)


@router.delete("/{level_id}/")
async def delete_mapping_level(
    level_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    return await MappingLevelService.delete(level_id, db)
