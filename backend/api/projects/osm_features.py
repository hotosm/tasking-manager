import json

from databases import Database
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.exceptions import BadRequest, NotFound
from backend.services.overpass_service import OverpassService, OverpassServiceError

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/tasks/{task_id}/osm-features/")
async def get_osm_features_for_task(
    project_id: int,
    task_id: int,
    db: Database = Depends(get_db),
):
    """
    Fetch existing OSM features from the real OpenStreetMap within a task's boundary.
    This endpoint is only available for sandbox projects and is intended for
    data conflation in the sandbox environment.

    Returns a GeoJSON FeatureCollection of all tagged OSM features (nodes, ways)
    within the task boundary.
    """
    project = await db.fetch_one(
        "SELECT id, sandbox FROM projects WHERE id = :project_id",
        values={"project_id": project_id},
    )
    if not project:
        raise NotFound(
            sub_code="PROJECT_NOT_FOUND",
            message=f"Project {project_id} not found.",
        )
    if not project["sandbox"]:
        raise BadRequest(
            sub_code="NOT_SANDBOX_PROJECT",
            message="This endpoint is only available for sandbox projects.",
        )

    task = await db.fetch_one(
        """
        SELECT id, project_id, ST_AsGeoJSON(geometry) AS geojson
        FROM tasks
        WHERE id = :task_id
        AND project_id = :project_id
        """,
        values={"task_id": task_id, "project_id": project_id},
    )
    if not task:
        raise NotFound(
            sub_code="TASK_NOT_FOUND",
            message=f"Task {task_id} not found in project {project_id}.",
        )

    geometry_geojson = json.loads(task["geojson"])

    try:
        feature_collection = await OverpassService.fetch_osm_features_for_boundary(
            geometry_geojson
        )
    except OverpassServiceError as e:
        raise BadRequest(
            sub_code="OVERPASS_API_ERROR",
            message=str(e.message),
        )

    return JSONResponse(content=feature_collection)
