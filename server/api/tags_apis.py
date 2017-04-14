from flask_restful import Resource, current_app
from server.services.user_service import UserService, UserServiceError, NotFound


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
            pass
            # user_dto = UserService.get_user_dto_by_username(username)
            # return user_dto.to_primitive(), 200
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
            pass
            # user_dto = UserService.get_user_dto_by_username(username)
            # return user_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500