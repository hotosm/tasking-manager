from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.users.authentication_service import login_required
from backend.services.users.user_service import OSMServiceError, UserService

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{username}/openstreetmap/")
async def get_osm_details(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
    username: str = None,
):
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
        return JSONResponse(content={"Error": str(e)}, status_code=502)
