import threading
import json
from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.campaign_dto import CampaignDTO, CampaignProjectDTO
# , CampaignProjectDTO, CampaignOrganisationDTO
from server.services.campaign_service import CampaignService
from server.models.postgis.utils import NotFound
from server.models.postgis.campaign import Campaign
from server.services.users.authentication_service import token_auth, tm


class CampaignAPI(Resource):

    def get(self, campaign_id):

        try:
            campaign = CampaignService.get_campaign_as_dto(campaign_id)
            return campaign.to_primitive(), 200
        except NotFound:
            return {"Error": "No campaign found"}, 404
        except Exception as e:
            error_msg = f'Messages GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


    def patch(self, campaign_id):

        try:
            campaign_dto = CampaignDTO(request.get_json())
            campaign_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            campaign = CampaignService.update_campaign(campaign_dto, campaign_id)
            return {campaign_dto.name:"Updated"}, 200
        except NotFound:
            return {"Error": "Campaign not found"}, 404
        except Exception as e:
            error_msg = f'User PATCH - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


    def post(self):

        try:
            print (request.is_json)
            print("is_json end")
            print(request.get_json())
            campaign_dto = CampaignDTO(request.get_json())
            campaign_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            campaign = CampaignService.create_campaign(campaign_dto)
            return {campaign_dto.name :"created"}, 200
        except Exception as e:
            error_msg = f'User POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
    
class GetAllCampaignsAPI(Resource):

    def get(self):
        """
        Gets all campaigns
        ---
        tags:
          - tags
        produces:
          - application/json
        responses:
            200:
                description: Campaign tags
            500:
                description: Internal Server Error
        """
        try:
            # preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            campaigns = CampaignService.get_all_campaigns()
            return campaigns.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class CampaignProjectAPI(Resource):

    def post(self):

        try:
            campaign_project_dto = CampaignProjectDTO(request.get_json())
            campaign_project_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            new_campaigns = CampaignService.create_campaign_project(campaign_project_dto)
            return new_campaigns.to_primitive(), 200
        except Exception as e:
            error_msg = f'User POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    def get(self, project_id):

        try:
            campaigns = CampaignService.get_project_campaigns_as_dto(project_id)
            return campaigns.to_primitive(), 200
        except NotFound:
            return {"Error": "No campaign found"}, 404
        except Exception as e:
            error_msg = f'Messages GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    def delete(self):
        """
        Deletes a Tasking-Manager project
        ---
        tags:
            - project admin
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project deleted
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden - users have submitted mapping
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_id = int(request.args.get('project_id', None)) 
            campaign_id = int(request.args.get('campaign_id', None))
            new_campaigns = CampaignService.delete_project_campaign(project_id, campaign_id)
            return new_campaigns.to_primitive(), 200
        except NotFound:
            return {"Error": "Campaign Not Found"}, 404
        except Exception as e:
            error_msg = f'Project Campaigns GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
