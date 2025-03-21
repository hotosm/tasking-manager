from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from loguru import logger

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.task import Task
from backend.models.postgis.task_annotation import TaskAnnotation
from backend.services.project_service import ProjectService
from backend.services.task_annotations_service import TaskAnnotationsService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/annotations/{annotation_type}/")
@router.get("/{project_id}/annotations/")
async def get_annotations(
    request: Request,
    project_id: int,
    annotation_type: str = None,
    db: Database = Depends(get_db),
):
    """
    Get all task annotations for a project
    ---
    tags:
        - annotations
    produces:
        - application/json
    parameters:
        - name: project_id
          in: path
          description: The ID of the project
          required: true
          type: integer
        - name: annotation_type
          in: path
          description: The type of annotation to fetch
          required: false
          type: integer
    responses:
        200:
            description: Project Annotations
        404:
            description: Project or annotations not found
        500:
            description: Internal Server Error
    """
    await ProjectService.exists(project_id, db)
    if annotation_type:
        annotations = await TaskAnnotation.get_task_annotations_by_project_id_type(
            project_id, annotation_type, db
        )
    else:
        annotations = await TaskAnnotation.get_task_annotations_by_project_id(
            project_id, db
        )
    return annotations.model_dump(by_alias=True)


@router.post("/{project_id}/annotations/{annotation_type}/")
async def post_annotations(
    request: Request,
    project_id: int,
    annotation_type: str,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Store new task annotations for tasks of a project
    ---
    tags:
        - annotations
    produces:
        - application/json
    parameters:
        - in: header
          name: Content-Type
          description: Content type for post body
          required: true
          type: string
          default: application/json
        - name: project_id
          in: path
          description: Unique project ID
          required: true
          type: integer
        - name: annotation_type
          in: path
          description: Annotation type
          required: true
          type: string
        - name: Application-Token
          in: header
          description: Application token registered with TM
          required: true
          type: string
        - in: body
          name: body
          required: true
          description: JSON object for creating draft project
          schema:
            projectId:
                type: integer
                required: true
            annotationType:
                type: string
                required: true
            tasks:
                type: array
                required: true
                items:
                    schema:
                        taskId:
                            type: integer
                            required: true
                        annotationSource:
                            type: string
                        annotationMarkdown:
                            type: string
                        properties:
                            description: JSON object with properties
    responses:
        200:
            description: Project updated
        400:
            description: Client Error - Invalid Request
        404:
            description: Project or task not found
        500:
            description: Internal Server Error
    """
    try:
        annotations = await request.json() or {}
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")

    await ProjectService.exists(project_id, db)

    task_ids = [t["taskId"] for t in annotations["tasks"]]

    tasks = await Task.get_tasks(project_id, task_ids, db)
    tasks_ids_db = [t.id for t in tasks]
    if len(task_ids) != len(tasks_ids_db):
        return JSONResponse(content={"Error": "Invalid task id"}, status_code=500)

    for annotation in annotations["tasks"]:
        try:
            await TaskAnnotationsService.add_or_update_annotation(
                annotation, project_id, annotation_type, db
            )
        except Exception as e:
            logger.error(f"Error creating annotations: {str(e)}")
            return JSONResponse(
                content={
                    "Error": "Error creating annotations",
                    "SubCode": "InvalidData",
                },
                status_code=400,
            )

    return project_id
