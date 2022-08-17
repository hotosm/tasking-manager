from flask import current_app
from flask_restful import Resource, request
from schematics.exceptions import DataError
from ...models.postgis.banner import Banner

from backend.services.users.authentication_service import token_auth
from backend.services.users.user_service import UserService
from backend.models.dtos.banner_dto import BannerDTO
from backend.models.postgis.statuses import UserRole


class SystemBannerAPI(Resource):
    def get(self):
        """
        Returns a banner
        ---
        tags:
            - system
        produces:
            - application/json
        responses:
            200:
                description: Fetched banner successfully
            500:
                description: Internal Server Error
        """

        banner = Banner.get()
        return banner.as_dto().to_primitive(), 200

    @token_auth.login_required
    def patch(self):
        """
        Updates the current banner in the DB
        ---
        tags:
            - system
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
              description: JSON object for updating the banner. Banner message can be written in markdown
              schema:
                properties:
                    message:
                        description: The message to display on the banner in markdown
                        required: true
                        type: string
                        default: Welcome to the Tasking Manager
                    visible:
                        description: Whether the banner is visible or not
                        type: boolean
                        default: false
        responses:
            201:
                description: Banner updated successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
        """

        # Check user permission for this action
        authenticated_user_id = token_auth.current_user()
        authenticated_user = UserService.get_user_by_id(authenticated_user_id)

        if authenticated_user.role != UserRole.ADMIN.value:
            return {
                "Error": "Banner can only be updated by system admins",
                "SubCode": "OnlyAdminAccess",
            }, 403
        try:
            banner_dto = BannerDTO(request.get_json())
            banner_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {"Error": "Unable to create project", "SubCode": "InvalidData"}, 400
       
        banner = Banner.get()
        banner.update_from_dto(banner_dto)
        return banner.as_dto().to_primitive(), 200
