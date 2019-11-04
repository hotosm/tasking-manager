from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.campaign_dto import CampaignOrganisationDTO
from server.services.campaign_service import CampaignService
from server.models.postgis.utils import NotFound
from server.services.users.authentication_service import token_auth


class OrganisationsCampaignsAPI(Resource):
    @token_auth.login_required
    def post(self):

        try:
            campaign_project_dto = CampaignOrganisationDTO(request.get_json())
            campaign_project_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            new_campaigns = CampaignService.create_campaign_organisation(
                campaign_project_dto
            )
            return new_campaigns.to_primitive(), 200
        except Exception as e:
            error_msg = f"Campaign POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    def get(self, organisation_id):

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
            return {"error": error_msg}, 500

    @token_auth.login_required
    def delete(self, organisation_id, campaign_id):
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
            new_campaigns = CampaignService.delete_organisation_campaign(
                organisation_id, campaign_id
            )
            return new_campaigns.to_primitive(), 200
        except NotFound:
            return {"Error": "Campaign Not Found"}, 404
        except Exception as e:
            error_msg = f"Organisation Campaigns GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
