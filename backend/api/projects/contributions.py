from databases import Database
from fastapi import APIRouter, Depends

from backend.db import get_db
from backend.models.postgis.project import Project
from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/contributions/")
async def get_project_contributions(project_id: int, db: Database = Depends(get_db)):
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
    await Project.exists(project_id, db)
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
