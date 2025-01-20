from backend.models.dtos.campaign_dto import CampaignDTO, NewCampaignDTO
from backend.services.campaign_service import CampaignService
from backend.services.organisation_service import OrganisationService
from fastapi import APIRouter, Depends, Request
from backend.db.database import get_db
from starlette.authentication import requires
from loguru import logger

router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)

@router.get("/{campaign_id}/")
async def get(request: Request, campaign_id: int):
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
    authenticated_user_id = request.user.display_name if request.user else None
    if authenticated_user_id:
        campaign = CampaignService.get_campaign_as_dto(
            campaign_id, authenticated_user_id
        )
    else:
        campaign = CampaignService.get_campaign_as_dto(campaign_id, 0)
    return campaign.model_dump(by_alias=True)

@router.patch("/{campaign_id}/")
@requires("authenticated")
async def patch(request: Request, campaign_id: int):
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
        orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"CampaignsRestAPI PATCH: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    try:
        campaign_dto = CampaignDTO(request.get_json())
        campaign_dto.validate()
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    try:
        campaign = CampaignService.update_campaign(campaign_dto, campaign_id)
        return {"Success": "Campaign {} updated".format(campaign.id)}, 200
    except ValueError:
        error_msg = "Campaign PATCH - name already exists"
        return {"Error": error_msg, "SubCode": "NameExists"}

@router.delete("/{campaign_id}/")
@requires("authenticated")
async def delete(request: Request, campaign_id: int):
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
        orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"CampaignsRestAPI DELETE: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    campaign = CampaignService.get_campaign(campaign_id)
    CampaignService.delete_campaign(campaign.id)
    return {"Success": "Campaign deleted"}, 200


# class CampaignsAllAPI(Resource):
@router.get("/")
async def get():
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
    campaigns = CampaignService.get_all_campaigns()
    return campaigns.model_dump(by_alias=True)

@router.post("/")
@requires("authenticated")
async def post(request: Request):
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
        orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"CampaignsAllAPI POST: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    try:
        campaign_dto = NewCampaignDTO(request.json())
        campaign_dto.validate()
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    try:
        campaign = CampaignService.create_campaign(campaign_dto)
        return {"campaignId": campaign.id}, 201
    except ValueError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 409
