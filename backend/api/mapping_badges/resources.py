from databases import Database
from fastapi import APIRouter, Depends

from backend.db import get_db
from backend.models.dtos.mapping_badge_dto import MappingBadgeCreateDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.mapping_badges import MappingBadgeService
from backend.services.users.authentication_service import pm_only

router = APIRouter(
    prefix="/mapping_badges",
    tags=["mapping_badges"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
async def get_mapping_badges(
    db: Database = Depends(get_db),
):
    """
    List mapping badges
    """
    return await MappingBadgeService.get_all(db)


@router.post("/")
async def create_mapping_badge(
    data: MappingBadgeCreateDTO,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    """
    Creates a new MappingBadge
    """
    return await MappingBadgeService.create(data, db)
