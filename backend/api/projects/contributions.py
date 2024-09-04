# from flask_restful import Resource

from backend.models.postgis.project import Project
from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService
from fastapi import APIRouter, Depends
from backend.db import get_session
from backend.db import get_db
from databases import Database

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

@router.get("/{project_id}/contributions/")
async def get(project_id: int, db: Database = Depends(get_db)):
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
async def get(project_id: int, db: Database = Depends(get_db)):
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
