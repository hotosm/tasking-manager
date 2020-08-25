import threading

from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from backend.models.dtos.message_dto import MessageDTO
from backend.models.dtos.grid_dto import GridDTO
from backend.services.project_service import ProjectService, NotFound
from backend.services.project_admin_service import ProjectAdminService
from backend.services.grid.grid_service import GridService
from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import token_auth, tm
from backend.services.interests_service import InterestService
from backend.models.postgis.utils import InvalidGeoJson


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
                description: Project ownership transfered successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            username = request.get_json()["username"]
            authenticated_user_id = token_auth.current_user()
            ProjectAdminService.transfer_project_to(
                project_id, authenticated_user_id, username
            )
            return {"Success": "Project Transfered"}, 200
        except ValueError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f"ProjectsActionsTransferAPI POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to transfer project"}, 500


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
            return {"Error": "Unable to send message to mappers"}, 400

        try:
            ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            )
            threading.Thread(
                target=MessageService.send_message_to_all_contributors,
                args=(project_id, message_dto),
            ).start()

            return {"Success": "Messages started"}, 200
        except ValueError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f"Send message all - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to send messages to mappers"}, 500


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
            ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            )
        except ValueError as e:
            error_msg = f"FeaturedProjects POST: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            ProjectService.set_project_as_featured(project_id)
            return {"Success": True}, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ValueError as e:
            error_msg = f"FeaturedProjects POST: {str(e)}"
            return {"Error": error_msg}, 400
        except Exception as e:
            error_msg = f"FeaturedProjects POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


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
                description: Project Unfeatured
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
            ProjectAdminService.is_user_action_permitted_on_project(
                token_auth.current_user(), project_id
            )
        except ValueError as e:
            error_msg = f"FeaturedProjects POST: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            ProjectService.unset_project_as_featured(project_id)
            return {"Success": True}, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ValueError as e:
            error_msg = f"FeaturedProjects DELETE: {str(e)}"
            return {"Error": error_msg}, 400
        except Exception as e:
            error_msg = f"FeaturedProjects DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


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
            ProjectAdminService.is_user_action_permitted_on_project(
                token_auth.current_user(), project_id
            )
        except ValueError as e:
            error_msg = f"ProjectsActionsSetInterestsAPI POST: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            data = request.get_json()
            project_interests = InterestService.create_or_update_project_interests(
                project_id, data["interests"]
            )
            return project_interests.to_primitive(), 200
        except NotFound:
            return {"Error": "Project not Found"}, 404
        except Exception as e:
            error_msg = (
                f"ProjectsActionsSetInterestsAPI POST - unhandled error: {str(e)}"
            )
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


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
            return str(e), 400

        try:
            grid = GridService.trim_grid_to_aoi(grid_dto)
            return grid, 200
        except InvalidGeoJson as e:
            return {"error": f"{str(e)}"}, 400
        except Exception as e:
            error_msg = f"IntersectingTiles GET API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
