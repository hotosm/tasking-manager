from flask_restful import Resource, current_app

from server.services.campaign_service import CampaignService
from server.models.postgis.utils import NotFound
from server.services.users.authentication_service import token_auth


class OrganisationsCampaignsAPI(Resource):
    @token_auth.login_required
    def put(self, organisation_id, campaign_id):
        """
        Assigns an campaign to a organisation
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
              description: The unique organisation ID
              required: true
              type: integer
              default: 1
            - name: campaign_id
              in: path
              description: The unique campaign ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Organisation campaign created
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
            campaigns = CampaignService.create_campaign_organisation(
                organisation_id, campaign_id
            )
            return campaigns.to_primitive(), 200
        except Exception as e:
            error_msg = f"Campaign Organisation POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    def get(self, organisation_id):
        """
        Returns campaings realated to an organisation
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
            campaigns = CampaignService.get_organisation_campaigns_as_dto(
                organisation_id
            )
            return campaigns.to_primitive(), 200
        except NotFound:
            return {"Error": "No campaign found"}, 404
        except Exception as e:
            error_msg = f"Messages GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @token_auth.login_required
    def delete(self, organisation_id, campaign_id):
        """
        Unassigns an organization from an campaign
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
              description: The unique organisation ID
              required: true
              type: integer
              default: 1
            - name: campaign_id
              in: path
              description: The unique campaign ID
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
            CampaignService.delete_organisation_campaign(organisation_id, campaign_id)
            return {"Success": "Campaign Deleted"}, 200
        except NotFound:
            return {"Error": "Campaign Not Found"}, 404
        except Exception as e:
            error_msg = f"Organisation Campaigns GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
