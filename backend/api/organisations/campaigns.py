from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.campaign_dto import CampaignListDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.campaign_service import CampaignService
from backend.services.organisation_service import OrganisationService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/organisations",
    tags=["organisations"],
    responses={404: {"description": "Not found"}},
)


@router.post("/{organisation_id}/campaigns/{campaign_id}/")
async def post_organisation_campaign(
    request: Request,
    organisation_id: int,
    campaign_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Assigns a campaign to an organisation
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: organisation_id
            in: path
            description: Unique organisation ID
            required: true
            type: integer
            default: 1
        - name: campaign_id
            in: path
            description: Unique campaign ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Organisation and campaign assigned successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden - users have submitted mapping
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    if await OrganisationService.can_user_manage_organisation(
        organisation_id, request.user.display_name, db
    ):
        if await CampaignService.campaign_organisation_exists(
            campaign_id, organisation_id, db
        ):
            message = "Campaign {} is already assigned to organisation {}.".format(
                campaign_id, organisation_id
            )
            return JSONResponse(
                content={"Error": message, "SubCode": "CampaignAlreadyAssigned"},
                status_code=400,
            )
        async with db.transaction():
            await CampaignService.create_campaign_organisation(
                organisation_id, campaign_id, db
            )
            message = "campaign with id {} assigned for organisation with id {}".format(
                campaign_id, organisation_id
            )
            return JSONResponse(content={"Success": message}, status_code=200)
    else:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the organisation",
                "SubCode": "UserNotPermitted",
            },
            status_code=403,
        )


@router.get("/{organisation_id}/campaigns/", response_model=CampaignListDTO)
async def get_organisation_campaigns(
    organisation_id: int, db: Database = Depends(get_db)
):
    """
    Returns all campaigns related to an organisation
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: false
            type: string
            default: Token sessionTokenHere==
        - name: organisation_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Success
        404:
            description: Organisation not found
        500:
            description: Internal Server Error
    """
    campaigns = await CampaignService.get_organisation_campaigns_as_dto(
        organisation_id, db
    )
    return campaigns


@router.delete("/{organisation_id}/campaigns/{campaign_id}/")
async def delete_organisation_campaign(
    request: Request,
    organisation_id: int,
    campaign_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Un-assigns an organization from an campaign
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: organisation_id
            in: path
            description: Unique organisation ID
            required: true
            type: integer
            default: 1
        - name: campaign_id
            in: path
            description: Unique campaign ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Organisation and campaign unassociated successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden - users have submitted mapping
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    if await OrganisationService.can_user_manage_organisation(
        organisation_id, request.user.display_name, db
    ):
        async with db.transaction():
            await CampaignService.delete_organisation_campaign(
                organisation_id, campaign_id, db
            )
            return JSONResponse(
                content={
                    "Success": "Organisation and campaign unassociated successfully"
                },
                status_code=200,
            )
    else:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the organisation",
                "SubCode": "UserNotPermitted",
            },
            status_code=403,
        )
