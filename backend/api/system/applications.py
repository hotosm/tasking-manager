from databases import Database
from fastapi import APIRouter, Depends, Request, Response

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.application import Application
from backend.services.application_service import ApplicationService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


@router.get("/authentication/applications/")
async def get(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Gets application keys for a user
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
      - in: header
        name: Authorization
        description: Base64 encoded session token
        required: true
        type: string
        default: Token sessionTokenHere==
    responses:
      200:
        description: User keys retrieved
      404:
        description: User has no keys
      500:
        description: A problem occurred
    """
    tokens = await ApplicationService.get_all_tokens_for_logged_in_user(user.id, db)
    return tokens.model_dump(by_alias=True)


@router.post("/authentication/applications/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Creates an application key for the user
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
      - in: header
        name: Authorization
        description: Base64 encoded session token
        required: true
        type: string
        default: Token sessionTokenHere==
    responses:
      200:
        description: Key generated successfully
      302:
        description: User is not authorized to create a key
      500:
        description: A problem occurred
    """
    token = await ApplicationService.create_token(user.id, db)
    return token.model_dump(by_alias=True)


@router.patch("/authentication/applications/{application_key}/")
async def patch(request: Request, application_key: str, db: Database = Depends(get_db)):
    """
    Checks the validity of an application key
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
      - in: path
        name: application_key
        description: Application key to test
        type: string
        required: true
        default: 1
    responses:
      200:
        description: Key is valid
      302:
        description: Key is not valid
      500:
        description: A problem occurred
    """
    is_valid = await ApplicationService.check_token(application_key, db)
    if is_valid:
        return Response(status_code=200)
    else:
        return Response(status_code=302)


@router.delete("/authentication/applications/{application_key}/")
async def delete(
    request: Request,
    application_key: str,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Deletes an application key for a user
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
      - in: header
        name: Authorization
        description: Base64 encoded session token
        required: true
        type: string
        default: Token sessionTokenHere==
      - in: path
        name: application_key
        description: Application key to remove
        type: string
        required: true
        default: 1
    responses:
      200:
        description: Key deleted successfully
      302:
        description: User is not authorized to delete the key
      404:
        description: Key not found
      500:
        description: A problem occurred
    """
    token = await ApplicationService.get_token(application_key, db)
    if token.user == user.id:
        await Application.delete(token, db)
        return Response(status_code=200)
    else:
        return Response(status_code=302)
