from flask_restful import Resource, current_app
from schematics.exceptions import DataError

from server.models.postgis.utils import NotFound
from server.models.dtos.project_dto import ProjectFavoriteDTO
from server.services.project_service import ProjectService
from server.services.users.authentication_service import token_auth, tm


class ProjectFavoriteAPI(Resource):
    @token_auth.login_required
    def get(self, project_id: int):
        """
        Validate that project is favorited
        ---
        tags:
            - favorites
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
              description: the id of a project
              required: true
              type: integer
        responses:
            200:
                description: Project favorite
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            user_id = tm.authenticated_user_id
            favorited = ProjectService.is_favorited(project_id, user_id)
            if favorited is True:
                return {"favorited": True}, 200

            return {"favorited": False}, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except Exception as e:
            error_msg = f"Favorite GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def post(self, project_id: int):
        """
        Sets project as favorite
        ---
        tags:
            - favorites
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
              description: the id of a project
              required: true
              type: integer
        responses:
            200:
                description: New favorite created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            favorite_dto = ProjectFavoriteDTO()
            favorite_dto.project_id = project_id
            favorite_dto.user_id = tm.authenticated_user_id
            favorite_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return str(e), 400
        try:
            ProjectService.favorite(project_id, tm.authenticated_user_id)
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ValueError as e:
            return {"error": str(e)}, 400
        except Exception as e:
            error_msg = f"Favorite PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

        return {"project_id": project_id}, 200

    @token_auth.login_required
    def delete(self, project_id: int):
        """
        Unsets a project as favorite.
        ---
        tags:
            - favorites
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
              description: the id of a project
              required: true
              type: integer
        responses:
            200:
                description: New favorite created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ProjectService.unfavorite(project_id, tm.authenticated_user_id)
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ValueError as e:
            return {"error": str(e)}, 400
        except Exception as e:
            error_msg = f"Favorite PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

        return {"project_id": project_id}, 200
