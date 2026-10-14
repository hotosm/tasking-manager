from typing import List, Optional
from urllib.parse import quote

from databases import Database
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.db import get_db
from backend.services.ohsome_service import OhsomeService
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


def join_topics(topics: Optional[List[str]]) -> Optional[str]:
    """ohsomeNow wants one comma-separated `topics` value.

    Callers may pass either `?topics=building,road` or `?topics=building&topics=road`,
    so both are normalised to the comma-separated form here.
    """
    if not topics:
        return None
    return ",".join(topic for topic in topics if topic)


@router.get("/statistics/ohsome/")
async def get_ohsome_statistics(
    hashtag: str = Query(
        ..., description="Hashtag to filter by, e.g. hotosm-project-*"
    ),
    topics: Optional[List[str]] = Query(
        None, description="ohsomeNow topics, e.g. building,road"
    ),
    startdate: str = Query(None, description="ISO timestamp, start of time range"),
    enddate: str = Query(None, description="ISO timestamp, end of time range"),
):
    """
    Proxy for the ohsomeNow /stats endpoint.

    ohsomeNow requires the HeiGIT API token on every request, so the frontend
    goes through here instead of calling api.heigit.org directly.
    """
    params = {"hashtag": hashtag}
    joined_topics = join_topics(topics)
    if joined_topics:
        params["topics"] = joined_topics
    if startdate:
        params["startdate"] = startdate
    if enddate:
        params["enddate"] = enddate
    return await OhsomeService.fetch("/stats", params)


@router.get("/statistics/ohsome/metadata/")
async def get_ohsome_metadata():
    """
    Proxy for the ohsomeNow /metadata endpoint, which reports how up to date
    the ohsomeNow data is.
    """
    return await OhsomeService.fetch("/metadata")


@router.get(
    "/statistics/ohsome/hashtags/",
    responses={400: {"description": "Invalid hashtag"}},
)
async def get_ohsome_hashtag_statistics(
    hashtags: str = Query(..., description="Comma-separated list of hashtags"),
    topics: Optional[List[str]] = Query(
        None, description="ohsomeNow topics, e.g. building,road"
    ),
):
    """
    Proxy for the ohsomeNow /stats/hashtags/{hashtags} endpoint.
    """
    # hashtags is interpolated into the upstream path, so percent-encode it:
    # unencoded it could escape the segment with "/", start a query string with
    # "?", truncate the URL with "#", or forge log lines with a newline.
    # "," stays literal because ohsomeNow uses it to separate hashtags.
    if "/" in hashtags or ".." in hashtags:
        raise HTTPException(status_code=400, detail="Invalid hashtag")
    joined_topics = join_topics(topics)
    params = {"topics": joined_topics} if joined_topics else None
    return await OhsomeService.fetch(
        f"/stats/hashtags/{quote(hashtags, safe=',')}", params
    )
