from databases import Database
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
import json
from backend.db import get_db
from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.get("/queries/popular/")
async def get_popular(db: Database = Depends(get_db)):
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
async def get_project_stats(project_id: int, db: Database = Depends(get_db)):
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
async def get_project_user_stats(
    project_id: int, username: str, db: Database = Depends(get_db)
):
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


@router.get("/{project_id}/tasks/invalidated/")
async def get_project_invalidated_counts(
    project_id: int, db: Database = Depends(get_db)
):
    """
    Return all tasks in a project with the number of times each task was invalidated.
    Only counts task_history rows where action='STATE_CHANGE' and action_text='INVALIDATED'.
    """
    query = """
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'taskId', t.id,
                    'invalidatedCount', COALESCE(th.cnt, 0)
                ) ORDER BY t.id
            ),
            '[]'::jsonb
        ) AS tasks
        FROM tasks t
        LEFT JOIN (
            SELECT task_id, COUNT(*)::int AS cnt
            FROM task_history
            WHERE project_id = :project_id
              AND action = 'STATE_CHANGE'
              AND action_text = 'INVALIDATED'
            GROUP BY task_id
        ) th ON th.task_id = t.id
        WHERE t.project_id = :project_id;
    """

    try:
        row = await db.fetch_one(query=query, values={"project_id": project_id})
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "Error": "Failed to query invalidation counts",
                "SubCode": "InternalError",
                "details": str(e),
            },
        )

    tasks_raw = row["tasks"] if row else []
    if isinstance(tasks_raw, str):
        try:
            tasks = json.loads(tasks_raw)
        except Exception:
            tasks = []
    else:
        tasks = tasks_raw or []

    return JSONResponse(status_code=200, content={"tasks": tasks})
