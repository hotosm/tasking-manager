from databases import Database
from fastapi import APIRouter, Body, Depends, Request
from fastapi.logger import logger
from pydantic import ValidationError

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.dtos.banner_dto import BannerDTO
from backend.models.postgis.banner import Banner
from backend.models.postgis.statuses import UserRole
from backend.services.users.authentication_service import login_required
from backend.services.users.user_service import UserService

router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


@router.get("/banner/", response_model=BannerDTO)
async def get(db: Database = Depends(get_db)):
    """
    Returns a banner
    ---
    tags:
        - system
    produces:
        - application/json
    responses:
        200:
            description: Fetched banner successfully
        500:
            description: Internal Server Error
    """

    banner = await Banner.get(db)
    return banner


@router.patch("/banner/", response_model=BannerDTO)
async def patch(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
    banner: BannerDTO = Body(...),
):
    """
    Updates the current banner in the DB
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
        - in: body
          name: body
          required: true
          description: JSON object for updating the banner. Message can be written in markdown (max 255 chars) \n
            \n
            Allowed tags are `a`, `b`, `i`, `h3`, `h4`, `h5`, `h6`, `p`, `pre`, `strong`
          schema:
            properties:
                message:
                    description: The message to display on the banner. Max 255 characters allowed.
                    required: true
                    type: string
                    default: Welcome to the Tasking Manager
                visible:
                    description: Whether the banner is visible or not
                    type: boolean
                    default: false
    responses:
        201:
            description: Banner updated successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
    """

    try:
        banner_dto = banner
    except ValidationError as e:
        logger.error(f"error validating request: {str(e)}")
        return {"Error": "Unable to create project", "SubCode": "InvalidData"}, 400

    # Check user permission for this action
    authenticated_user = await UserService.get_user_by_id(user.id, db)
    if authenticated_user.role != UserRole.ADMIN.value:
        return {
            "Error": "Banner can only be updated by system admins",
            "SubCode": "OnlyAdminAccess",
        }, 403

    banner_dto.message = Banner.to_html(
        banner_dto.message if banner_dto.message is not None else ""
    )  # Convert the markdown message to html
    banner = await Banner.get(db)
    updated_banner = await Banner.update_from_dto(banner, db, banner_dto)
    return updated_banner
