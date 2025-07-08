from databases import Database
from fastapi import APIRouter, Depends, Query

from backend.db import get_db
from backend.services.stats_service import StatsService

router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


@router.get("/statistics/")
async def get_statistics(
    abbreviated: bool = Query(
        default=True,
        description="Set to false if complete details on projects including total area, campaigns, orgs are required",
    ),
    db: Database = Depends(get_db),
):
    """
    Get HomePage Stats
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
    - in: query
      name: abbreviated
      type: boolean
      description: Set to false if complete details on projects including total area, campaigns, orgs are required
      default: True
    responses:
        200:
            description: Project stats
        500:
            description: Internal Server Error
    """
    stats = await StatsService.get_homepage_stats(abbreviated, db)
    return stats.model_dump(by_alias=True)
