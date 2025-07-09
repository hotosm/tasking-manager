from datetime import date, timedelta

import requests
from databases import Database
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse
from typing import Optional
from backend.api.utils import validate_date_input
from backend.config import settings
from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.interests_service import InterestService
from backend.services.stats_service import StatsService
from backend.services.users.authentication_service import login_required
from backend.services.users.user_service import UserService
from datetime import datetime
from fastapi import HTTPException


router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{username}/statistics/")
async def get_user_stats(
    request: Request,
    username: str,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Get detailed stats about a user by OpenStreetMap username
    ---
    tags:
        - users
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: username
            in: path
            description: Mapper's OpenStreetMap username
            required: true
            type: string
            default: Thinkwhere
    responses:
        200:
            description: User found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    stats_dto = await UserService.get_detailed_stats(username, db)
    return stats_dto


@router.get("/{user_id}/statistics/interests/")
async def get_user_interests_statistics(
    user_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Get rate of contributions from a user given their interests
    ---
    tags:
        - interests
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: user_id
            in: path
            description: User ID
            required: true
            type: integer
    responses:
        200:
            description: Interest found
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    rate = await InterestService.compute_contributions_rate(user_id, db)
    return rate


@router.get("/statistics/")
async def get_period_user_stats(
    start_date_str: str = Query(
        ..., alias="startDate", description="Initial date (e.g., YYYY-MM-DD)"
    ),
    end_date_str: Optional[str] = Query(
        None, alias="endDate", description="Final date (e.g., YYYY-MM-DD)"
    ),
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Get stats about users registered within a period of time
    ---
    tags:
        - users
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            required: true
            default: Token sessionTokenHere==
        - in: query
            name: startDate
            description: Initial date
            required: true
            type: string
        - in: query
            name: endDate
            description: Final date.
            type: string
    responses:
        200:
            description: User statistics
        400:
            description: Bad Request
        401:
            description: Request is not authenticated
        500:
            description: Internal Server Error
    """
    try:
        start_date = validate_date_input(start_date_str)
        if end_date_str:
            end_date = validate_date_input(end_date_str)
        else:
            end_date: str = date.today()

        if end_date < start_date:
            raise ValueError(
                "InvalidDateRange- Start date must be earlier than end date"
            )
        if (end_date - start_date) > timedelta(days=366 * 3):
            raise ValueError(
                "InvalidDateRange- Date range can not be bigger than 1 year"
            )

        stats = await StatsService.get_all_users_statistics(start_date, end_date, db)
        return stats.model_dump(by_alias=True)

    except (KeyError, ValueError) as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )


@router.get("/statistics/ohsome/")
async def get_ohsome_stats(
    url: str = Query(
        ...,
        description="Base OHSOME stats endpoint, e.g. https://stats.now.ohsome.org/api/stats/user",
    ),
    userId: int = Query(..., description="OSM user ID"),
    topics: str = Query(
        ..., description="Comma-separated list of OSM topics, e.g. building,highway"
    ),
    startdate: Optional[str] = Query(
        None, description="YYYY-MM-DD, start of time range"
    ),
    enddate: Optional[str] = Query(None, description="YYYY-MM-DD, end of time range"),
    hashtag: Optional[str] = Query(None, description="Filter by hashtag"),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Get HomePage Stats
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
      - in: header
        name: Authorization
        description: Base64 encoded session token
        required: true
        type: string
        default: Token sessionTokenHere==
      - in: query
        name: url
        type: string
        required: true
        description: Base OHSOME stats URL
      - in: query
        name: userId
        type: integer
        required: true
        description: OSM user ID
      - in: query
        name: topics
        type: string
        required: true
        description: Comma-separated list of topics
      - in: query
        name: startdate
        type: string
        required: false
        description: Start date (YYYY-MM-DD)
      - in: query
        name: enddate
        type: string
        required: false
        description: End date (YYYY-MM-DD)
      - in: query
        name: hashtag
        type: string
        required: false
        description: Hashtag filter
    responses:
      200:
        description: User stats
      400:
        description: Bad Request
      500:
        description: Internal Server Error
    """

    def format_date(date_str):
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").strftime(
                "%Y-%m-%dT00:00:00Z"
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date format for '{date_str}', expected YYYY-MM-DD",
            )

    params = {
        "userId": userId,
        "topics": topics,
    }

    if startdate:
        params["startdate"] = format_date(startdate)
    if enddate:
        params["enddate"] = format_date(enddate)
    if hashtag:
        params["hashtag"] = hashtag

    try:
        headers = {"Authorization": f"Basic {settings.OHSOME_STATS_TOKEN}"}
        response = requests.get(url, headers=headers, params=params)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        return JSONResponse(
            content={"Error": str(e), "SubCode": "Error fetching data"}, status_code=400
        )
