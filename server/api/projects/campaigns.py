from flask_restful import Resource, current_app
from schematics.exceptions import DataError

from server.models.dtos.campaign_dto import CampaignProjectDTO
from server.services.campaign_service import CampaignService
from server.services.project_admin_service import ProjectAdminService
from server.models.postgis.utils import NotFound
from server.services.users.authentication_service import token_auth, tm


class ProjectsCampaignsAPI(Resource):
    @token_auth.login_required
    def post(self, project_id, campaign_id):
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
                description: Unauthorized: Forbidden
            500:
                description: Internal Server Error
        """

        try:
            ProjectAdminService.is_user_action_permitted_on_project(
                tm.authenticated_user_id, project_id
            )
        except ValueError as e:
            error_msg = f"ProjectsCampaignsAPI POST: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            campaign_project_dto = CampaignProjectDTO()
            campaign_project_dto.campaign_id = campaign_id
            campaign_project_dto.project_id = project_id
            campaign_project_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            CampaignService.create_campaign_project(campaign_project_dto)
            message = "campaign with id {} assigned successfully for project with id {}".format(
                campaign_id, project_id
            )
            return ({"Success": message}, 200)
        except Exception as e:
            error_msg = f"ProjectsCampaignsAPI POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    def get(self, project_id):
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
        try:
            campaigns = CampaignService.get_project_campaigns_as_dto(project_id)
            return campaigns.to_primitive(), 200
        except NotFound:
            return {"Error": "No campaign found"}, 404
        except Exception as e:
            error_msg = f"Messages GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @token_auth.login_required
    def delete(self, project_id, campaign_id):
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
                description: Unauthorized - Forbidden
            500:
                description: Internal Server Error
        """
        try:
            ProjectAdminService.is_user_action_permitted_on_project(
                tm.authenticated_user_id, project_id
            )
        except ValueError as e:
            error_msg = f"ProjectsCampaignsAPI DELETE: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            CampaignService.delete_project_campaign(project_id, campaign_id)
            return {"Success": "Campaigns Deleted"}, 200
        except NotFound:
            return {"Error": "Campaign Not Found"}, 404
        except Exception as e:
            error_msg = f"ProjectCampaignsAPI DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
