from backend.models.dtos.campaign_dto import CampaignDTO, CampaignListDTO, NewCampaignDTO
from backend.services.campaign_service import CampaignService
from backend.services.organisation_service import OrganisationService
from fastapi import APIRouter, Depends, Request
from backend.db import get_db, get_session
from starlette.authentication import requires
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from databases import Database
from fastapi import HTTPException
from backend.services.users.authentication_service import login_required
from backend.models.dtos.user_dto import AuthUserDTO

router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

@router.get("/{campaign_id}/", response_model=CampaignDTO)
async def retrieve_campaign(request: Request, campaign_id: int, db: Database = Depends(get_db)):
    """
    Get an active campaign's information
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - name: campaign_id
            in: path
            description: Campaign ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Campaign found
        404:
            description: No Campaign found
        500:
            description: Internal Server Error
    """
    campaign = await CampaignService.get_campaign_as_dto(campaign_id, db)
    return campaign

@router.patch("/{campaign_id}/")
async def update_campaign(campaign_dto : CampaignDTO,request: Request, campaign_id: int, user: AuthUserDTO = Depends(login_required), db: Database = Depends(get_db)):
    """
    Updates an existing campaign
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            required: true
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - name: campaign_id
            in: path
            description: Campaign ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object for updating a Campaign
            schema:
            properties:
                name:
                    type: string
                    example: HOT Campaign
                logo:
                    type: string
                    example: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                url:
                    type: string
                    example: https://hotosm.org
                organisations:
                    type: array
                    items:
                        type: integer
                    default: [
                        1
                    ]
    responses:
        200:
            description: Campaign updated successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Campaign not found
        409:
            description: Resource duplication
        500:
            description: Internal Server Error
    """
    try:
        orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(user.id, db)
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"CampaignsRestAPI PATCH: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403
    try:
        campaign = await CampaignService.update_campaign(campaign_dto, campaign_id, db)
        return {"Success": "Campaign {} updated".format(campaign.id)}, 200
    except ValueError:
        error_msg = "Campaign PATCH - name already exists"
        return {"Error": error_msg, "SubCode": "NameExists"}

@router.delete("/{campaign_id}/")
async def delete_campaign(request: Request, campaign_id: int, user: AuthUserDTO = Depends(login_required), db: Database = Depends(get_db)):
    """
    Deletes an existing campaign
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            required: true
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - name: campaign_id
            in: path
            description: Campaign ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Campaign deleted successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Campaign not found
        500:
            description: Internal Server Error
    """
    try:
        orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name, db
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"CampaignsRestAPI DELETE: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    campaign = await CampaignService.get_campaign(campaign_id, db)
    await CampaignService.delete_campaign(campaign.id, db)
    return {"Success": "Campaign deleted"}, 200


@router.get("/", response_model=CampaignListDTO)
async def list_campaigns(
    request: Request,
    db: Database = Depends(get_db),
):
    """
    Get all active campaigns
    ---
    tags:
        - campaigns
    produces:
        - application/json
    responses:
        200:
            description: All Campaigns returned successfully
        500:
            description: Internal Server Error
    """
    campaigns = await CampaignService.get_all_campaigns(db)
    return campaigns


@router.post("/")
async def create_campaign(campaign_dto: NewCampaignDTO,request: Request, user: AuthUserDTO = Depends(login_required), db: Database = Depends(get_db)):
    """
    Creates a new campaign
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            required: true
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - in: body
            name: body
            required: true
            description: JSON object for creating a new Campaign
            schema:
            properties:
                name:
                    type: string
                    example: HOT Campaign
                logo:
                    type: string
                    example: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                url:
                    type: string
                    example: https://hotosm.org
                organisations:
                    type: array
                    items:
                        type: integer
                    default: [
                        1
                    ]
    responses:
        201:
            description: New campaign created successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        409:
            description: Resource duplication
        500:
            description: Internal Server Error
    """
    try:
        orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name, db
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"CampaignsAllAPI POST: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    try:
        campaign_id = await CampaignService.create_campaign(campaign_dto, db)
        return {"campaignId": campaign_id}, 201
    except ValueError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 409
