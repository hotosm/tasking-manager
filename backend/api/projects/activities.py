from fastapi import APIRouter, Depends, Request
from backend.services.stats_service import StatsService
from backend.services.project_service import ProjectService
from backend.db import get_db, get_session
from databases import Database
from fastapi import HTTPException


router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

@router.get("/{project_id}/activities/")
async def get(request: Request, project_id: int, db: Database = Depends(get_db)):
    """
    Get all user activity on a project
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
        - in: query
          name: page
          description: Page of results user requested
          type: integer
    responses:
        200:
            description: Project activity
        404:
            description: No activity
        500:
            description: Internal Server Error
    """
    await ProjectService.exists(project_id, db)
    page = int(request.query_params.get("page")) if request.query_params.get("page") else 1
    activity = await StatsService.get_latest_activity(project_id, page, db)
    return activity


@router.get("/{project_id}/activities/latest/")
async def get(request: Request, project_id: int, db: Database = Depends(get_db)):
    """
    Get latest user activity on all of project task
    ---
    tags:
      - projects
    produces:
      - application/json
    parameters:
        - name: project_id
          in: path
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Project activity
        404:
            description: No activity
        500:
            description: Internal Server Error
    """
    await ProjectService.exists(project_id, db)
    activity = await StatsService.get_last_activity(project_id, db)
    return activity
