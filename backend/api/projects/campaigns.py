# from flask_restful import Resource, current_app
# from schematics.exceptions import DataError

from backend.models.dtos.campaign_dto import CampaignProjectDTO
from backend.services.campaign_service import CampaignService
from backend.services.project_admin_service import ProjectAdminService
# from backend.services.users.authentication_service import token_auth
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class ProjectsCampaignsAPI(Resource):
    # @token_auth.login_required
@router.post("/{project_id}/campaigns/{campaign_id}/")
@requires(["authenticated"])
async def post(request: Request, project_id: int, campaign_id: int):
    """
    Assign a campaign for a project
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
        - name: project_id
            in: path
            description: Unique project ID
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
        201:
            description: Campaign assigned successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    authenticated_user_id = request.user.display_name
    if not ProjectAdminService.is_user_action_permitted_on_project(
        authenticated_user_id, project_id
    ):
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403
    try:
        campaign_project_dto = CampaignProjectDTO()
        campaign_project_dto.campaign_id = campaign_id
        campaign_project_dto.project_id = project_id
        campaign_project_dto.validate()
    except DataError as e:
        current_app.logger.error(f"error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    CampaignService.create_campaign_project(campaign_project_dto)
    message = (
        "campaign with id {} assigned successfully for project with id {}".format(
            campaign_id, project_id
        )
    )
    return ({"Success": message}, 200)

@router.get("/{project_id}/campaigns/")
async def get(project_id: int, session: AsyncSession = Depends(get_session)):
    """
    Gets all campaigns for a project
    ---
    tags:
        - campaigns
    produces:
        - application/json
    parameters:
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Campaign list returned successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    campaigns = await CampaignService.get_project_campaigns_as_dto(project_id, session)
    return campaigns.model_dump(by_alias=True), 200


@router.delete("/{project_id}/campaigns/{campaign_id}/")
@requires(["authenticated"])
async def delete(request: Request, project_id: int, campaign_id: int):
    """
    Delete a campaign for a project
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
        - name: project_id
            in: path
            description: Unique project ID
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
            description: Campaign assigned successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    authenticated_user_id = request.user.display_name
    if not ProjectAdminService.is_user_action_permitted_on_project(
        authenticated_user_id, project_id
    ):
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403

    CampaignService.delete_project_campaign(project_id, campaign_id)
    return {"Success": "Campaigns Deleted"}, 200
