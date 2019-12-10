from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.campaign_dto import CampaignProjectDTO
from server.services.campaign_service import CampaignService
from server.models.postgis.utils import NotFound
from server.services.users.authentication_service import token_auth


class ProjectsCampaignsAPI(Resource):
    @token_auth.login_required
    def post(self):
        """
        Assign a campaign for a project
        ---
        tags:
          - campaign
        produces:
          - application/json
        parameters:
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
            500:
                description: Internal Server Error
        """
        try:
            campaign_project_dto = CampaignProjectDTO(request.get_json())
            campaign_project_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            new_campaigns = CampaignService.create_campaign_project(
                campaign_project_dto
            )
            return new_campaigns.to_primitive(), 200
        except Exception as e:
            error_msg = f"User POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    def get(self, project_id):
        """
        Gets all campaigns for a project
        ---
        tags:
          - campaign
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
            201:
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
          - campaign
        produces:
          - application/json
        parameters:
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
            500:
                description: Internal Server Error
        """
        try:
            CampaignService.delete_project_campaign(project_id, campaign_id)
            return {"Success": "Campaigns Deleted"}, 200
        except NotFound:
            return {"Error": "Campaign Not Found"}, 404
        except Exception as e:
            error_msg = f"Project Campaigns GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
