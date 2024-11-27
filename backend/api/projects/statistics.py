# from flask_restful import Resource
from backend.services.stats_service import StatsService
from backend.services.project_service import ProjectService
from fastapi import APIRouter, Depends
from backend.db import get_session

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

# class ProjectsStatisticsQueriesPopularAPI(Resource):
@router.get("/queries/popular/")
async def get():
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
    stats = StatsService.get_popular_projects()
    return stats.model_dump(by_alias=True), 200


# class ProjectsStatisticsAPI(Resource):
@router.get("/{project_id}/statistics/")
async def get(project_id):
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
    # preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
    summary = ProjectService.get_project_stats(project_id)
    return summary.model_dump(by_alias=True), 200


# class ProjectsStatisticsQueriesUsernameAPI(Resource):
@router.get("/{project_id}/statistics/queries/{username}/")
async def get(project_id, username):
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
    stats_dto = ProjectService.get_project_user_stats(project_id, username)
    return stats_dto.model_dump(by_alias=True), 200
