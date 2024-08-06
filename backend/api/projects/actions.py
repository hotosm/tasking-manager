import threading

from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from backend.models.dtos.message_dto import MessageDTO
from backend.models.dtos.grid_dto import GridDTO
from backend.services.project_service import ProjectService
from backend.services.project_admin_service import (
    ProjectAdminService,
    ProjectAdminServiceError,
)
from backend.services.grid.grid_service import GridService
from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import token_auth, tm
from backend.services.interests_service import InterestService
from backend.models.postgis.utils import InvalidGeoJson

from shapely import GEOSException
from shapely.errors import TopologicalError


class ProjectsActionsTransferAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Transfers a project to a new user
        ---
        tags:
            - projects
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
            - in: body
              name: body
              required: true
              description: username of the new owner
              schema:
                  properties:
                      username:
                        type: string
        responses:
            200:
                description: Project ownership transferred successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            username = request.get_json()["username"]
        except Exception:
            return {"Error": "Username not provided", "SubCode": "InvalidData"}, 400
        try:
            authenticated_user_id = token_auth.current_user()
            ProjectAdminService.transfer_project_to(
                project_id, authenticated_user_id, username
            )
            return {"Success": "Project Transferred"}, 200
        except (ValueError, ProjectAdminServiceError) as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class ProjectsActionsMessageContributorsAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Send message to all contributors of a project
        ---
        tags:
            - projects
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
            - in: body
              name: body
              required: true
              description: JSON object for creating message
              schema:
                properties:
                    subject:
                        type: string
                        default: Thanks
                        required: true
                    message:
                        type: string
                        default: Thanks for your contribution
                        required: true
        responses:
            200:
                description: Message sent successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            message_dto = MessageDTO(request.get_json())
            message_dto.from_user_id = authenticated_user_id
            message_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Unable to send message to mappers",
                "SubCode": "InvalidData",
            }, 400

        if not ProjectAdminService.is_user_action_permitted_on_project(
            authenticated_user_id, project_id
        ):
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403
        threading.Thread(
            target=MessageService.send_message_to_all_contributors,
            args=(project_id, message_dto),
        ).start()
        return {"Success": "Messages started"}, 200


class ProjectsActionsFeatureAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Set a project as featured
        ---
        tags:
            - projects
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
        responses:
            200:
                description: Featured projects
            400:
                description: Bad request
            403:
                description: Forbidden
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        try:
            ProjectService.set_project_as_featured(project_id)
            return {"Success": True}, 200
        except ValueError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class ProjectsActionsUnFeatureAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Unset a project as featured
        ---
        tags:
            - projects
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
        responses:
            200:
                description: Project is no longer featured
            400:
                description: Bad request
            403:
                description: Forbidden
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        try:
            ProjectService.unset_project_as_featured(project_id)
            return {"Success": True}, 200
        except ValueError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class ProjectsActionsSetInterestsAPI(Resource):
    @token_auth.login_required
    def post(self, project_id):
        """
        Creates a relationship between project and interests
        ---
        tags:
            - interests
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
            - in: body
              name: body
              required: true
              description: JSON object for creating/updating project and interests relationships
              schema:
                  properties:
                      interests:
                          type: array
                          items:
                            type: integer
        responses:
            200:
                description: New project interest relationship created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            if not ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            ):
                raise ValueError()
        except ValueError:
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 403

        data = request.get_json()
        project_interests = InterestService.create_or_update_project_interests(
            project_id, data["interests"]
        )
        return project_interests.to_primitive(), 200


class ProjectActionsIntersectingTilesAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self):
        """
        Gets the tiles intersecting the aoi
        ---
        tags:
            - grid
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
              description: JSON object containing aoi and tasks and bool flag for controlling clip grid to aoi
              schema:
                  properties:
                      clipToAoi:
                        type: boolean
                        default: true
                      areaOfInterest:
                          schema:
                              properties:
                                  type:
                                      type: string
                                      default: FeatureCollection
                                  features:
                                      type: array
                                      items:
                                          schema:
                                              $ref: "#/definitions/GeoJsonFeature"
                      grid:
                          schema:
                              properties:
                                  type:
                                      type: string
                                      default: FeatureCollection
                                  features:
                                      type: array
                                      items:
                                          schema:
                                              $ref: "#/definitions/GeoJsonFeature"
        responses:
            200:
                description: Intersecting tasks found successfully
            400:
                description: Client Error - Invalid Request
            500:
                description: Internal Server Error
        """
        try:
            grid_dto = GridDTO(request.get_json())
            grid_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {"Error": str(e), "SubCode": "InvalidData"}, 400

        try:
            grid = GridService.trim_grid_to_aoi(grid_dto)
            return grid, 200
        except InvalidGeoJson as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400
        except TopologicalError:
            return {
                "error": "Invalid geometry. Polygon is self intersecting",
                "SubCode": "SelfIntersectingAOI",
            }, 400
        except GEOSException as wrapped:
            if (
                isinstance(wrapped.args[0], str)
                and "Self-intersection" in wrapped.args[0]
            ):
                return {
                    "error": "Invalid geometry. Polygon is self intersecting",
                    "SubCode": "SelfIntersectingAOI",
                }, 400
            return {"error": str(wrapped), "SubCode": "InternalServerError"}
