from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.user_dto import UserSearchQuery
from server.services.users.authentication_service import token_auth, tm
from server.services.users.user_service import UserService, NotFound


class UsersRestAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, userid):
        """
        Gets user information by id
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded sesesion token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: userid
              in: path
              description: The users user id
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: User found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            user_dto = UserService.get_user_dto_by_id(userid)
            return user_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"Userid GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch user details"}, 500


class UsersAllAPI(Resource):
    def get(self):
        """
        Gets paged list of all usernames
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - in: query
              name: page
              description: Page of results user requested
              type: integer
            - in: query
              name: username
              description: Full or part username
              type: integer
            - in: query
              name: role
              description: Role of User, eg ADMIN, PROJECT_MANAGER
              type: string
            - in: query
              name: level
              description: Level of User, eg BEGINNER
              type: string
        responses:
            200:
                description: Users found
            500:
                description: Internal Server Error
        """
        try:
            query = UserSearchQuery()
            query.page = (
                int(request.args.get("page")) if request.args.get("page") else 1
            )
            query.username = request.args.get("username")
            query.mapping_level = request.args.get("level")
            query.role = request.args.get("role")
            query.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to fetch user list"}, 400

        try:
            users_dto = UserService.get_all_users(query)
            return users_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch user list"}, 500


class UsersQueriesUsernameAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, username):
        """
        Gets user information
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: username
              in: path
              description: The users username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            user_dto = UserService.get_user_dto_by_username(
                username, tm.authenticated_user_id
            )
            return user_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch user details"}, 500


class UsersQueriesUsernameFilterAPI(Resource):
    def get(self, username):
        """
        Gets paged lists of users matching username filter
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - name: username
              in: path
              description: Partial or full username
              type: string
              default: ab
            - in: query
              name: page
              description: Page of results user requested
              type: integer
            - in: query
              name: projectId
              description: Optional, promote project participants to head of results
              type: integer
        responses:
            200:
                description: Users found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            page = int(request.args.get("page")) if request.args.get("page") else 1
            project_id = request.args.get("projectId", None, int)
            is_project_manager = request.args.get("isProjectManager", False) == "true"
            users_dto = UserService.filter_users(
                username, project_id, page, is_project_manager
            )
            return users_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch matching users"}, 500


class UserFavoritesAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self):
        """
        Gets projects favorited by user
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
        responses:
            200:
                description: Projects favorited by user
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            favs_dto = UserService.get_projects_favorited(tm.authenticated_user_id)
            return favs_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"UserFavorites GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
