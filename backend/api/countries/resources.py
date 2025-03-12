from databases import Database
from fastapi import APIRouter, Depends

from backend.db import get_db
from backend.models.dtos.tags_dto import TagsDTO
from backend.services.tags_service import TagsService

router = APIRouter(
    prefix="/countries",
    tags=["countries"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=TagsDTO)
async def get_all_countries(db: Database = Depends(get_db)):
    """
    Fetch all Country tags
    ---
    tags:
      - countries
    produces:
      - application/json
    responses:
        200:
            description: All Country tags returned
        500:
            description: Internal Server Error
    """
    tags = await TagsService.get_all_countries(db)
    return tags
