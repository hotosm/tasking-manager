# from flask_restful import Resource

from backend.models.dtos.project_dto import ProjectFavoriteDTO
from backend.services.project_service import ProjectService

# from backend.services.users.authentication_service import token_auth
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class ProjectsFavoritesAPI(Resource):
# @token_auth.login_required
@router.get("/{project_id}/favorite/")
@requires("authenticated")
async def get(request: Request, project_id: int):
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
    favorited = ProjectService.is_favorited(project_id, user_id)
    if favorited is True:
        return {"favorited": True}, 200

    return {"favorited": False}, 200


# @token_auth.login_required
@router.post("/{project_id}/favorite/")
@requires("authenticated")
async def post(request: Request, project_id: int):
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
    authenticated_user_id = request.user.display_name if request.user else None
    favorite_dto = ProjectFavoriteDTO()
    favorite_dto.project_id = project_id
    favorite_dto.user_id = authenticated_user_id

    ProjectService.favorite(project_id, authenticated_user_id)
    return {"project_id": project_id}, 200


# @token_auth.login_required
@router.delete("/{project_id}/favorite/")
@requires("authenticated")
async def delete(request: Request, project_id: int):
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
        ProjectService.unfavorite(project_id, request.user.display_name)
    except ValueError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400

    return {"project_id": project_id}, 200
