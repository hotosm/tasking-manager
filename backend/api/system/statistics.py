from backend.services.stats_service import StatsService
from distutils.util import strtobool
from fastapi import APIRouter, Depends, Request
from backend.db.database import get_db

router = APIRouter(
    prefix="/system",
    tags=["system"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)

@router.get("/statistics/")
async def get(request: Request):
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
    abbreviated = (
        strtobool(request.query_params.get("abbreviated"))
        if request.query_params.get("abbreviated")
        else True
    )

    stats = StatsService.get_homepage_stats(abbreviated)
    return stats.model_dump(by_alias=True), 200
