from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.campaign_dto import CampaignDTO
from server.services.campaign_service import CampaignService
from server.models.postgis.utils import NotFound
from server.services.users.authentication_service import token_auth, tm


class CampaignsRestAPI(Resource):
    def get(self, campaign_id):
        """
        Search active campaign
        ---
        tags:
            - search campaign
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
              description: The ID of the campaign
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
        try:
            if tm.authenticated_user_id:
                campaign = CampaignService.get_campaign_as_dto(
                    campaign_id, tm.authenticated_user_id
                )
            else:
                campaign = CampaignService.get_campaign_as_dto(campaign_id, 0)
            return campaign.to_primitive(), 200
        except NotFound:
            return {"Error": "No campaign found"}, 404
        except Exception as e:
            error_msg = f"Messages GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def put(self, campaign_id):

        try:
            campaign_dto = CampaignDTO(request.get_json())
            campaign_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            campaign = CampaignService.update_campaign(campaign_dto, campaign_id)
            return {campaign.name: "Updated"}, 200
        except NotFound:
            return {"Error": "Campaign not found"}, 404
        except Exception as e:
            error_msg = f"User PATCH - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def delete(self, campaign_id):

        try:
            campaign = CampaignService.get_campaign(campaign_id)
            campaign = CampaignService.delete_campaign(campaign_id)
            return {campaign.id: "Deleted"}, 200
        except NotFound:
            return {"Error": "Campaign not found"}, 404
        except Exception as e:
            error_msg = f"User PATCH - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class CampaignsAllAPI(Resource):
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
            campaigns = CampaignService.get_all_campaigns()
            return campaigns.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def post(self):

        try:
            campaign_dto = CampaignDTO(request.get_json())
            campaign_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            campaign = CampaignService.create_campaign(campaign_dto)
            return {campaign.id: "created"}, 200
        except Exception as e:
            error_msg = f"User POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
