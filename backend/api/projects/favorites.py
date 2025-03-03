from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/favorite/")
async def get_favorite(
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
    user_id = request.user.display_name if request.user and request.user.display_name else None

    favorited = await ProjectService.is_favorited(project_id, user_id, db)
    if favorited is True:
        return JSONResponse(content={"favorited": True}, status_code=200)
    return JSONResponse(content={"favorited": False}, status_code=200)


@router.post("/{project_id}/favorite/")
async def make_favorite(
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
    return JSONResponse(content={"project_id": project_id}, status_code=201)


@router.delete("/{project_id}/favorite/")
async def remove_favorite(
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
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )
    return JSONResponse(content={"project_id": project_id}, status_code=200)
