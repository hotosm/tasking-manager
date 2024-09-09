from backend.services.users.user_service import UserService
from backend.services.users.authentication_service import login_required
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires
from backend.models.dtos.user_dto import AuthUserDTO
from databases import Database
from backend.db import get_db

router = APIRouter(
    prefix="/licenses",
    tags=["licenses"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class LicensesActionsAcceptAPI(Resource):
#     @token_auth.login_required
@router.post("/{license_id}/actions/accept-for-me/")
@requires("authenticated")
async def post(
    request: Request,
    license_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Capture user acceptance of license terms
    ---
    tags:
      - licenses
    produces:
      - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: license_id
          in: path
          description: License ID terms have been accepted for
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Terms accepted
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User or license not found
        500:
            description: Internal Server Error
    """
    await UserService.accept_license_terms(user.id, license_id, db)
    return {"Success": "Terms Accepted"}, 200
