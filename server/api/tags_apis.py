from flask_restful import Resource, current_app, request
from server.services.tags_service import TagsService, TagsServiceError
from server.models.postgis.utils import NotFound
from server.services.users.authentication_service import token_auth


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
            tags = TagsService.get_all_organisation_tags()
            return tags.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def post(self):
        """
        Delete the specified mapping license
        ---
        tags:
            - tags
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: body
              name: body
              required: true
              description: JSON object for deleting organisation tag
              schema:
                  properties:
                      organisation_tag:
                          type: string
                          default: organisation
        responses:
            200:
                description: Tag Deleted
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Organisation tag belongs to some project
            404:
                description: Organisation Tag Not Found
            500:
                description: Internal Server Error
        """
        try:
            organisation_tag = request.get_json().get('organisation_tag')
            print(organisation_tag)
            TagsService.delete_organisation_tags(organisation_tag)
            return {"Success": "Organisation Tag deleted"}, 200
        except TagsServiceError as e:
            error_msg = f'{str(e)}'
            return {"Error": error_msg }, 403
        except NotFound:
            return {"Error": "Organisation Tag Not Found"}, 404
        except Exception as e:
            error_msg = f'Organisation Tag DELETE - unhandled error: {str(e)}'
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
            tags = TagsService.get_all_campaign_tags()
            return tags.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
