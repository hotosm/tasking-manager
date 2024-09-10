from backend.services.project_service import ProjectService
from fastapi import APIRouter, Depends, Request
from backend.db import get_db
from databases import Database
from backend.services.users.authentication_service import login_required
from backend.models.dtos.user_dto import AuthUserDTO

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/favorite/")
async def get(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Validate that project is favorited
    ---
    tags:
        - favorites
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: project_id
          in: path
          description: Unique project ID
          required: true
          type: integer
    responses:
        200:
            description: Project favorite
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    user_id = request.user.display_name if request.user else None
    favorited = await ProjectService.is_favorited(project_id, user_id, db)
    if favorited is True:
        return {"favorited": True}
    return {"favorited": False}


@router.post("/{project_id}/favorite/")
async def post(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Set a project as favorite
    ---
    tags:
        - favorites
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: project_id
          in: path
          description: Unique project ID
          required: true
          type: integer
    responses:
        200:
            description: New favorite created
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """

    await ProjectService.favorite(project_id, user.id, db)
    return {"project_id": project_id}


@router.delete("/{project_id}/favorite/")
async def delete(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Unsets a project as favorite
    ---
    tags:
        - favorites
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: project_id
          in: path
          description: Unique project ID
          required: true
          type: integer
    responses:
        200:
            description: New favorite created
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    try:
        await ProjectService.unfavorite(project_id, user.id, db)
    except ValueError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400
    return {"project_id": project_id}
