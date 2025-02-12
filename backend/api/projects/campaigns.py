# from flask_restful import Resource, current_app
# from schematics.exceptions import DataError

from backend.models.dtos.campaign_dto import CampaignProjectDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.campaign_service import CampaignService
from backend.services.project_admin_service import ProjectAdminService

# from backend.services.users.authentication_service import token_auth
from backend.services.users.authentication_service import login_required
from fastapi import APIRouter, Depends
from backend.db import get_db, get_session
from databases import Database


router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


@router.post("/{project_id}/campaigns/{campaign_id}/")
async def post(
    project_id: int,
    campaign_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
    if not await ProjectAdminService.is_user_action_permitted_on_project(
        user.id, project_id, db
    ):
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403

    # Check if the project is already assigned to the campaign
    query = """
    SELECT COUNT(*)
    FROM campaign_projects
    WHERE project_id = :project_id AND campaign_id = :campaign_id
    """
    result = await db.fetch_val(
        query, values={"project_id": project_id, "campaign_id": campaign_id}
    )

    if result > 0:
        return {
            "Error": "Project is already assigned to this campaign",
            "SubCode": "CampaignAssignmentError",
        }, 400

    campaign_project_dto = CampaignProjectDTO(
        project_id=project_id, campaign_id=campaign_id
    )

    await CampaignService.create_campaign_project(campaign_project_dto, db)
    message = "campaign with id {} assigned successfully for project with id {}".format(
        campaign_id, project_id
    )
    return ({"Success": message}, 200)


@router.get("/{project_id}/campaigns/")
async def get(project_id: int, db: Database = Depends(get_db)):
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
    campaigns = await CampaignService.get_project_campaigns_as_dto(project_id, db)
    return campaigns


@router.delete("/{project_id}/campaigns/{campaign_id}/")
async def delete(
    project_id: int,
    campaign_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
    if not await ProjectAdminService.is_user_action_permitted_on_project(
        user.id, project_id, db
    ):
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403

    await CampaignService.delete_project_campaign(project_id, campaign_id, db)
    return {"Success": "Campaigns Deleted"}, 200
