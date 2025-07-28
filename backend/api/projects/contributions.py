from typing import Optional
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.statuses import ProjectStatus
from backend.services.users.authentication_service import login_required_optional
from databases import Database
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from backend.db import get_db
from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/contributions/")
async def get_project_contributions(
    project_id: int,
    user: Optional[AuthUserDTO] = Depends(login_required_optional),
    db: Database = Depends(get_db),
):
    """
    Get all user contributions on a project
    ---
    tags:
      - projects
    produces:
      - application/json
    parameters:
        - name: project_id
          in: path
          description: Unique project ID
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: User contributions
        404:
            description: No contributions
        500:
            description: Internal Server Error
    """

    is_private, status = await ProjectService.get_project_privacy_and_status(
        project_id, db
    )
    # If private or draft, enforce login + permission
    if is_private or status == ProjectStatus.DRAFT.value:
        user_id = user.id if user else None
        if user is None:
            return JSONResponse(
                content={
                    "Error": "User not permitted: Private Project",
                    "SubCode": "PrivateProject",
                },
                status_code=403,
            )

        project_dto = await ProjectService.get_project_dto_for_mapper(
            project_id,
            user_id,
            db,
        )
        if not project_dto:

            return JSONResponse(
                content={
                    "Error": "User not permitted: Private Project",
                    "SubCode": "PrivateProject",
                },
                status_code=403,
            )
    contributions = await StatsService.get_user_contributions(project_id, db)
    return contributions


@router.get("/{project_id}/contributions/queries/day/")
async def get_contributions_by_day(project_id: int, db: Database = Depends(get_db)):
    """
    Get contributions by day for a project
    ---
    tags:
      - projects
    produces:
      - application/json
    parameters:
        - name: project_id
          in: path
          description: Unique project ID
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Project contributions by day
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    contribs = await ProjectService.get_contribs_by_day(project_id, db)
    return contribs
