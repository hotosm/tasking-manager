from backend.services.application_service import ApplicationService
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires

router = APIRouter(
    prefix="/system",
    tags=["system"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


@router.get("/authentication/applications/")
@requires("authenticated")
async def get(request: Request):
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
        tokens = ApplicationService.get_all_tokens_for_logged_in_user(
            request.user.dispaly_name
        )
        if len(tokens) == 0:
            return 400
        return tokens.model_dump(by_alias=True), 200

@router.post("/authentication/applications/")
@requires("authenticated")
async def post(request: Request):
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
        token = ApplicationService.create_token(request.user.dispaly_name)
        return token.model_dump(by_alias=True), 200

@router.patch("/authentication/applications/{application_key}/")
async def patch(request: Request, application_key):
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
        is_valid = ApplicationService.check_token(application_key)
        if is_valid:
            return 200
        else:
            return 302

@router.delete("/authentication/applications/{application_key}/")
async def delete(request: Request, application_key):
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
        token = ApplicationService.get_token(application_key)
        if token.user == request.user.dispaly_name:
            token.delete()
            return 200
        else:
            return 302
