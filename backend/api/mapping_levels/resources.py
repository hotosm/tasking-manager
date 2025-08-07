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
    prefix="/levels",
    tags=["mapping_levels"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
async def get_mapping_levels(
    db: Database = Depends(get_db),
):
    """
    List mapping levels
    ---
    tags:
      - levels
    produces:
      - application/json
    """
    return await MappingLevelService.get_all(db)


@router.post("/")
async def create_mapping_level(
    data: MappingLevelCreateDTO,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    """
    Create a new mapping level
    ---
    tags:
      - levels
    produces:
      - application/json
    """
    return await MappingLevelService.create(data, db)


@router.get("/{level_id}/")
async def get_mapping_level(
    level_id: int,
    db: Database = Depends(get_db),
):
    """
    Get a mapping level by its id
    ---
    tags:
      - levels
    produces:
      - application/json
    """
    return await MappingLevelService.get_by_id(level_id, db)


@router.patch("/{level_id}/")
async def update_mapping_level(
    data: MappingLevelUpdateDTO,
    level_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    """
    Update a given mapping level
    ---
    tags:
      - levels
    produces:
      - application/json
    """
    data.id = level_id

    return await MappingLevelService.update(data, db)


@router.delete("/{level_id}/")
async def delete_mapping_level(
    level_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    """
    Delete the specified mapping level
    ---
    tags:
      - levels
    produces:
      - application/json
    """
    await MappingLevelService.delete(level_id, db)
