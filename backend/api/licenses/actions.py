from backend.services.users.user_service import UserService
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires

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
async def post(request: Request, license_id):
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
    UserService.accept_license_terms(request.user.display_name, license_id)
    return {"Success": "Terms Accepted"}, 200
