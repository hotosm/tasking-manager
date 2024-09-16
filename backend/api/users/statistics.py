from datetime import date, timedelta
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
import requests

from backend.config import settings
from backend.services.users.user_service import UserService
from backend.services.stats_service import StatsService
from backend.services.interests_service import InterestService

# from backend.services.users.authentication_service import token_auth
from backend.services.users.authentication_service import login_required
from backend.api.utils import validate_date_input
from backend.models.dtos.user_dto import AuthUserDTO
from backend.db import get_db
from databases import Database
from backend.db import get_session
from starlette.authentication import requires
import os

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class UsersStatisticsAPI(Resource, JSONEncoder):
# @token_auth.login_required
@router.get("/{username}/statistics/")
@requires("authenticated")
async def get(request: Request, username):
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
    stats_dto = UserService.get_detailed_stats(username)
    return stats_dto.model_dump(by_alias=True), 200


@router.get("/{user_id}/statistics/interests/")
async def get(
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
@requires("authenticated")
async def get(request: Request):
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
        if request.query_params.get("startDate"):
            start_date = validate_date_input(request.query_params.get("startDate"))
        else:
            return {
                "Error": "Start date is required",
                "SubCode": "MissingDate",
            }, 400
        end_date = validate_date_input(
            request.query_params.get("endDate", date.today())
        )
        if end_date < start_date:
            raise ValueError(
                "InvalidDateRange- Start date must be earlier than end date"
            )
        if (end_date - start_date) > timedelta(days=366 * 3):
            raise ValueError(
                "InvalidDateRange- Date range can not be bigger than 1 year"
            )

        stats = StatsService.get_all_users_statistics(start_date, end_date)
        return stats.to_primitive(), 200
    except (KeyError, ValueError) as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400


@router.get("/statistics/ohsome/")
@requires("authenticated")
async def get(request: Request):
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
        description: get user stats for osm contributions
    responses:
        200:
            description: User stats
        500:
            description: Internal Server Error
    """
    url = request.query_params.get("url")
    if not url:
        return JSONResponse(
            content={"Error": "URL is None", "SubCode": "URL not provided"},
            status_code=400,
        )
    try:
        headers = {"Authorization": f"Basic {settings.OHSOME_STATS_TOKEN}"}

        # Make the GET request with headers
        response = requests.get(url, headers=headers)
        return response.json()
    except Exception as e:
        return JSONResponse(
            content={"Error": str(e), "SubCode": "Error fetching data"}, status_code=400
        )
