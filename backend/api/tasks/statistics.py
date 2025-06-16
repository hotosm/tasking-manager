from datetime import date, timedelta

from databases import Database
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from backend.api.utils import validate_date_input
from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.stats_service import StatsService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)


@router.get("/statistics/")
async def get_task_stats(
    start_date_str: str = Query(..., alias="startDate"),
    end_date_str: str = Query(default=str(date.today()), alias="endDate"),
    organisation_id: str = Query(default=None, alias="organisationId"),
    organisation_name: str = Query(default=None, alias="organisationName"),
    campaign: str = Query(default=None),
    project_id: str = Query(default=None, alias="projectId"),
    country: str = Query(default=None),
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Get Task Stats
    ---
    tags:
      - tasks
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
          description: Date to filter as minimum
          required: true
          type: string
        - in: query
          name: endDate
          description: Date to filter as maximum. Default value is the current date.
          required: false
          type: string
        - in: query
          name: organisationName
          description: Organisation name to filter by
          required: false
        - in: query
          name: organisationId
          description: Organisation ID to filter by
          required: false
        - in: query
          name: campaign
          description: Campaign name to filter by
          required: false
        - in: query
          name: projectId
          description: Project IDs to filter by
          required: false
        - in: query
          name: country
          description: Country name to filter by
          required: false
    responses:
        200:
            description: Task statistics
        400:
            description: Bad Request
        401:
            description: Request is not authenticated
        500:
            description: Internal Server Error
    """
    try:
        start_date = validate_date_input(start_date_str)
        end_date = validate_date_input(end_date_str)

        if end_date < start_date:
            raise ValueError(
                "InvalidDateRange- Start date must be earlier than end date"
            )
        if (end_date - start_date) > timedelta(days=366):
            raise ValueError(
                "InvalidDateRange- Date range cannot be greater than 1 year"
            )

        project_ids = list(map(int, project_id.split(","))) if project_id else None

        task_stats = await StatsService.get_task_stats(
            db,
            start_date,
            end_date,
            organisation_id,
            organisation_name,
            campaign,
            project_ids,
            country,
        )
        return task_stats

    except (KeyError, ValueError) as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )
