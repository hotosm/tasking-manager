import io
from typing import Optional

from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from backend.db import get_db
from backend.exceptions import BadRequest
from backend.services.mapswipe_service import MapswipeService
from backend.services.partner_service import PartnerService

MAPSWIPE_GROUP_EMPTY_SUBCODE = "EMPTY_MAPSWIPE_GROUP"
MAPSWIPE_GROUP_EMPTY_MESSAGE = "Mapswipe group is not set for this partner."


def is_valid_group_id(group_id: Optional[str]) -> bool:
    return group_id is not None and len(group_id) > 0


router = APIRouter(
    prefix="/partners",
    tags=["partners"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{permalink:str}/filtered-statistics/")
async def get_filtered_statistics(
    request: Request,
    permalink: str,
    db: Database = Depends(get_db),
):
    """
    Get partner statistics by id and time range
    ---
    tags:
        - partners
    produces:
        - application/json
    parameters:
        - in: query
            name: fromDate
            type: string
            description: Fetch partner statistics from date as yyyy-mm-dd
            example: "2024-01-01"
        - in: query
            name: toDate
            type: string
            example: "2024-09-01"
            description: Fetch partner statistics to date as yyyy-mm-dd
        - name: partner_id
            in: path
        - name: permalink
            in: path
            description: The permalink of the partner
            required: true
            type: string
    responses:
        200:
            description: Partner found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Partner not found
        500:
            description: Internal Server Error
    """
    mapswipe = MapswipeService()
    from_date = request.query_params.get("fromDate")
    to_date = request.query_params.get("toDate")

    if from_date is None:
        raise BadRequest(
            sub_code="INVALID_TIME_RANGE",
            message="fromDate is missing",
            from_date=from_date,
            to_date=to_date,
        )

    if to_date is None:
        raise BadRequest(
            sub_code="INVALID_TIME_RANGE",
            message="toDate is missing",
            from_date=from_date,
            to_date=to_date,
        )

    if from_date > to_date:
        raise BadRequest(
            sub_code="INVALID_TIME_RANGE",
            message="fromDate should be less than toDate",
            from_date=from_date,
            to_date=to_date,
        )

    partner = await PartnerService.get_partner_by_permalink(permalink, db)

    if not is_valid_group_id(partner.mapswipe_group_id):
        raise BadRequest(
            sub_code=MAPSWIPE_GROUP_EMPTY_SUBCODE,
            message=MAPSWIPE_GROUP_EMPTY_MESSAGE,
        )

    return mapswipe.fetch_filtered_partner_stats(
        partner.id, partner.mapswipe_group_id, from_date, to_date
    )


@router.get("/{permalink:str}/general-statistics/")
async def get_general_statistics(
    request: Request,
    permalink: str,
    db: Database = Depends(get_db),
):
    """
    Get partner statistics by id and broken down by each contributor.
    This API is paginated with limit and offset query parameters.
    ---
    tags:
        - partners
    produces:
        - application/json
    parameters:
        - in: query
            name: limit
            description: The number of partner members to fetch
            type: integer
            example: 10
        - in: query
            name: offset
            description: The starting index from which to fetch partner members
            type: integer
            example: 0
        - in: query
            name: downloadAsCSV
            description: Download users in this group as CSV
            type: boolean
            example: false
        - name: permalink
            in: path
            description: The permalink of the partner
            required: true
            type: string
    responses:
        200:
            description: Partner found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Partner not found
        500:
            description: Internal Server Error
    """

    mapswipe = MapswipeService()
    partner = await PartnerService.get_partner_by_permalink(permalink, db)

    if not is_valid_group_id(partner.mapswipe_group_id):
        raise BadRequest(
            sub_code=MAPSWIPE_GROUP_EMPTY_SUBCODE,
            message=MAPSWIPE_GROUP_EMPTY_MESSAGE,
        )

    limit = int(request.query_params.get("limit", 10))
    offset = int(request.query_params.get("offset", 0))
    download_as_csv = bool(request.query_params.get("downloadAsCSV", "false") == "true")

    group_dto = mapswipe.fetch_grouped_partner_stats(
        partner.id,
        partner.mapswipe_group_id,
        limit,
        offset,
        download_as_csv,
    )

    if download_as_csv:
        csv_content = group_dto.to_csv()
        csv_buffer = io.StringIO(csv_content)
        return StreamingResponse(
            content=csv_buffer,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=partner_members.csv"},
        )

    return group_dto
