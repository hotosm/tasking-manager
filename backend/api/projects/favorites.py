from flask_restful import Resource

from backend.models.dtos.project_dto import ProjectFavoriteDTO
from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import token_auth


class ProjectsFavoritesAPI(Resource):
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
              description: Unique project ID
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
        user_id = token_auth.current_user()
        favorited = ProjectService.is_favorited(project_id, user_id)
        if favorited is True:
            return {"favorited": True}, 200

        return {"favorited": False}, 200

    @token_auth.login_required
    def post(self, project_id: int):
        """
        Set a project as favorite
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
              description: Unique project ID
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
        authenticated_user_id = token_auth.current_user()
        favorite_dto = ProjectFavoriteDTO()
        favorite_dto.project_id = project_id
        favorite_dto.user_id = authenticated_user_id

        ProjectService.favorite(project_id, authenticated_user_id)
        return {"project_id": project_id}, 200

    @token_auth.login_required
    def delete(self, project_id: int):
        """
        Unsets a project as favorite
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
              description: Unique project ID
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
            ProjectService.unfavorite(project_id, token_auth.current_user())
        except ValueError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400

        return {"project_id": project_id}, 200
