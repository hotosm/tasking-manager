from flask_restful import Resource, current_app, request
from server.services.tags_service import TagsService
from server.services.users.user_service import UserService


class OrganisationTagsAPI(Resource):

    def get(self):
        """
        Gets all organisation tags
        ---
        tags:
          - tags
        produces:
          - application/json
        responses:
            200:
                description: Organisation tags
            500:
                description: Internal Server Error
        """
        try:
            preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            tags = TagsService.get_all_organisation_tags(preferred_locale=preferred_locale)
            return tags.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class CampaignsTagsAPI(Resource):

    def get(self):
        """
        Gets all campaign tags
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
            preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            tags = TagsService.get_all_campaign_tags(preferred_locale=preferred_locale)
            return tags.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
