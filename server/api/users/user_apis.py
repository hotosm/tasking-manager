from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.user_dto import UserSearchQuery, UserDTO
from server.services.users.authentication_service import token_auth, tm
from server.services.users.user_service import UserService, UserServiceError, NotFound


class UserAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, username):
        """
        Gets user information
        ---
        tags:
          - user
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
            user_dto = UserService.get_user_dto_by_username(username, tm.authenticated_user_id)
            return user_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserUpdateAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self):
        """
        Updates user info
        ---
        tags:
          - user
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
              description: JSON object for creating draft project
              schema:
                  properties:
                      emailAddress:
                          type: string
                          default: test@test.com
                      twitterId:
                          type: string
                          default: tweeter
                      facebookId:
                          type: string
                          default: fbme
                      linkedinId:
                          type: string
                          default: linkme
        responses:
            200:
                description: Details saved
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            user_dto = UserDTO(request.get_json())
            if user_dto.email_address == '':
                user_dto.email_address = None  # Replace empty string with None so validation doesn't break

            user_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            verification_sent = UserService.update_user_details(tm.authenticated_user_id, user_dto)
            return verification_sent, 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserSearchAllAPI(Resource):
    def get(self):
        """
        Gets paged list of all usernames
        ---
        tags:
          - user
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
            query.page = int(request.args.get('page')) if request.args.get('page') else 1
            query.username = request.args.get('username')
            query.mapping_level = request.args.get('level')
            query.role = request.args.get('role')
            query.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            users_dto = UserService.get_all_users(query)
            return users_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserSearchFilterAPI(Resource):
    def get(self, username):
        """
        Gets paged lists of users matching username filter
        ---
        tags:
          - user
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
        responses:
            200:
                description: Users found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            page = int(request.args.get('page')) if request.args.get('page') else 1
            users_dto = UserService.filter_users(username, page)
            return users_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserOSMAPI(Resource):
    def get(self, username):
        """
        Gets details from OSM for the specified username
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
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
            502:
                description: Bad response from OSM
        """
        try:
            osm_dto = UserService.get_osm_details_for_user(username)
            return osm_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except UserServiceError as e:
            return {"Error": str(e)}, 502
        except Exception as e:
            error_msg = f'User OSM GET - unhandled error: {str(e)}'
            current_app.logger.error(error_msg)
            return {"error": error_msg}, 500


class UserMappedProjects(Resource):
    def get(self, username):
        """
        Gets projects user has mapped
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - name: username
              in: path
              description: The users username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: Mapped projects found
            404:
                description: No mapped projects found
            500:
                description: Internal Server Error
        """
        try:
            locale = request.environ.get('HTTP_ACCEPT_LANGUAGE') if request.environ.get(
                'HTTP_ACCEPT_LANGUAGE') else 'en'
            user_dto = UserService.get_mapped_projects(username, locale)
            return user_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User or mapping not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserSetRole(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, username, role):
        """
        Allows PMs to set the users role
        ---
        tags:
          - user
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
            - name: role
              in: path
              description: The role to add
              required: true
              type: string
              default: ADMIN
        responses:
            200:
                description: Role set
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            UserService.add_role_to_user(tm.authenticated_user_id, username, role)
            return {"Success": "Role Added"}, 200
        except UserServiceError:
            return {"Error": "Not allowed"}, 403
        except NotFound:
            return {"Error": "User or mapping not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserSetLevel(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def post(self, username, level):
        """
        Allows PMs to set a users mapping level
        ---
        tags:
          - user
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
            - name: level
              in: path
              description: The mapping level that should be set
              required: true
              type: string
              default: ADVANCED
        responses:
            200:
                description: Level set
            400:
                description: Bad Request - Client Error
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            UserService.set_user_mapping_level(username, level)
            return {"Success": "Level set"}, 200
        except UserServiceError:
            return {"Error": "Not allowed"}, 400
        except NotFound:
            return {"Error": "User or mapping not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserAcceptLicense(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, license_id):
        """
        Post to indicate user has accepted license terms
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: license_id
              in: path
              description: ID of license terms have been accepted for
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Terms accepted
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User or license not found
            500:
                description: Internal Server Error
        """
        try:
            UserService.accept_license_terms(tm.authenticated_user_id, license_id)
            return {"Success": "Terms Accepted"}, 200
        except NotFound:
            return {"Error": "User or mapping not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
