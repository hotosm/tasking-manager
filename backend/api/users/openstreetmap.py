from backend.services.users.user_service import UserService, OSMServiceError
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires
from backend.db import get_db
from databases import Database

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class UsersOpenStreetMapAPI(Resource):
# @token_auth.login_required
@router.get("/{username}/openstreetmap/")
@requires("authenticated")
async def get(request: Request, db: Database = Depends(get_db), username: str = None):
    """
    Get details from OpenStreetMap for a specified username
    ---
    tags:
      - users
    produces:
      - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded sesesion token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: username
          in: path
          description: Mapper's OpenStreetMap username
          required: true
          type: string
          default: Thinkwhere
    responses:
        200:
            description: User found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User not found
        500:
            description: Internal Server Error
        502:
            description: Bad response from OSM
    """
    try:
        osm_dto = await UserService.get_osm_details_for_user(username, db)
        return osm_dto.model_dump(by_alias=True)
    except OSMServiceError as e:
        return {"Error": str(e)}, 502
