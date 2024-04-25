from json import JSONEncoder
from datetime import date, timedelta
from flask_restful import Resource, request

from backend.services.users.user_service import UserService
from backend.services.stats_service import StatsService
from backend.services.interests_service import InterestService
from backend.services.users.authentication_service import token_auth
from backend.api.utils import validate_date_input
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires

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
@requires("authenticated")
async def get(request: Request, user_id: int):
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
    rate = InterestService.compute_contributions_rate(user_id)
    return rate.model_dump(by_alias=True), 200


# class UsersStatisticsAllAPI(Resource):
    # @token_auth.login_required
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
        end_date = validate_date_input(request.query_params.get("endDate", date.today()))
        if end_date < start_date:
            raise ValueError(
                "InvalidDateRange- Start date must be earlier than end date"
            )
        if (end_date - start_date) > timedelta(days=366 * 3):
            raise ValueError(
                "InvalidDateRange- Date range can not be bigger than 1 year"
            )

        stats = StatsService.get_all_users_statistics(start_date, end_date)
        return stats.model_dump(by_alias=True), 200
    except (KeyError, ValueError) as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400
