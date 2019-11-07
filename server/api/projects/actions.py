import threading

from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.message_dto import MessageDTO
from server.services.project_service import ProjectService, NotFound
from server.services.project_admin_service import ProjectAdminService
from server.services.messaging.message_service import MessageService
from server.services.users.authentication_service import token_auth, tm
from server.services.interests_service import InterestService


class ProjectsActionsTransferAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Transfers a project to a new user.
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: the username of the new owner
              schema:
                  properties:
                      username:
                        type: string
        responses:
            200:
                description: All tasks reset
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            username = request.get_json()["username"]
            ProjectAdminService.transfer_project_to(
                project_id, tm.authenticated_user_id, username
            )
            return {"Success": "Project Transfered"}, 200
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to transfer project"}, 500


class ProjectsActionsMessageContributorsAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Send message to all contributors to a project
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
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
                description: All mapped tasks validated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            message_dto = MessageDTO(request.get_json())
            message_dto.from_user_id = tm.authenticated_user_id
            message_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to send message to mappers"}, 400

        try:
            threading.Thread(
                target=MessageService.send_message_to_all_contributors,
                args=(project_id, message_dto),
            ).start()

            return {"Success": "Messages started"}, 200
        except Exception as e:
            error_msg = f"Send message all - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to send messages to mappers"}, 500


class ProjectsActionsFeatureAPI(Resource):
    @tm.pm_only(True)
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
              description: The unique project ID
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
            ProjectService.set_project_as_featured(project_id)
            return {"Success": True}, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ValueError as e:
            error_msg = f"FeaturedProjects POST: {str(e)}"
            return {"error": error_msg}, 400
        except Exception as e:
            error_msg = f"FeaturedProjects GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectsActionsUnFeatureAPI(Resource):
    @tm.pm_only(True)
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
              description: The unique project ID
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
            ProjectService.unset_project_as_featured(project_id)
            return {"Success": True}, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ValueError as e:
            error_msg = f"FeaturedProjects DELETE: {str(e)}"
            return {"error": error_msg}, 400
        except Exception as e:
            error_msg = f"FeaturedProjects DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectsActionsSetInterestsAPI(Resource):
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
              description: The unique project ID
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
            500:
                description: Internal Server Error
        """
        try:
            data = request.get_json()
            project_interests = InterestService.create_or_update_project_interests(
                project_id, data["interests"]
            )
            return project_interests.to_primitive(), 200
        except NotFound:
            return {"Error": "project not Found"}, 404
        except Exception as e:
            error_msg = f"project relationship POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
