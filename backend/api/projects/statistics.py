# from flask_restful import Resource
from backend.services.stats_service import StatsService
from backend.services.project_service import ProjectService
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


@router.get("/queries/popular/")
async def get(db: Database = Depends(get_db)):
    """
    Get popular projects
    ---
    tags:
      - projects
    produces:
      - application/json
    responses:
        200:
            description: Popular Projects stats
        500:
            description: Internal Server Error
    """
    stats = await StatsService.get_popular_projects(db)
    return stats


@router.get("/{project_id}/statistics/")
async def get(project_id: int, db: Database = Depends(get_db)):
    """
    Get Project Stats
    ---
    tags:
      - projects
    produces:
      - application/json
    parameters:
        - in: header
          name: Accept-Language
          description: Language user is requesting
          type: string
          required: true
          default: en
        - name: project_id
          in: path
          description: Unique project ID
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Project stats
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    summary = await ProjectService.get_project_stats(project_id, db)
    return summary


@router.get("/{project_id}/statistics/queries/{username}/")
async def get(project_id: int, username: str, db: Database = Depends(get_db)):
    """
    Get detailed stats about user
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
        - name: username
          in: path
          description: Mapper's OpenStreetMap username
          required: true
          type: string
          default: Thinkwhere
    responses:
        200:
            description: User found
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    stats_dto = await ProjectService.get_project_user_stats(project_id, username, db)
    return stats_dto
