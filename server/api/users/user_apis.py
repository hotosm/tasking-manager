from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.user_dto import (
    UserSearchQuery,
    UserDTO,
    UserValidatorRoleRequestDTO,
)
from server.services.users.authentication_service import token_auth, tm
from server.services.users.user_service import (
    UserService,
    UserServiceError,
    NotFound,
    UserValidatorRoleRequestService,
)
from server.models.postgis.statuses import UserValidatorRoleRequestStatus
from server.models.postgis.utils import timestamp


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
            user_dto = UserService.get_user_dto_by_username(
                username, tm.authenticated_user_id
            )
            return user_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserIdAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, userid):
        """
        Gets user information by id
        ---
        tags:
          - user
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
            return {"error": error_msg}, 500


class UserContributionsAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, userid):
        """
        Gets daily amount of user contributions by id
        ---
        tags:
          - user
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
            contributions = UserService.get_contributions_by_day(userid)
            return contributions.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"Userid GET - unhandled error: {str(e)}"
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
              description: JSON object to update a user
              schema:
                  properties:
                      name:
                          type: string
                          default: Your Name
                      city:
                          type: string
                          default: Your City
                      country:
                          type: string
                          default: Your Country
                      emailAddress:
                          type: string
                          default: test@test.com
                      twitterId:
                          type: string
                          default: twitter handle without @
                      facebookId:
                          type: string
                          default: facebook username
                      linkedinId:
                          type: string
                          default: linkedin username
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
            if user_dto.email_address == "":
                user_dto.email_address = (
                    None
                )  # Replace empty string with None so validation doesn't break

            user_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            verification_sent = UserService.update_user_details(
                tm.authenticated_user_id, user_dto
            )
            return verification_sent, 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
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
            query.page = (
                int(request.args.get("page")) if request.args.get("page") else 1
            )
            query.username = request.args.get("username")
            query.mapping_level = request.args.get("level")
            query.role = request.args.get("role")
            query.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return str(e), 400

        try:
            users_dto = UserService.get_all_users(query)
            return users_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
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
            error_msg = f"User OSM GET - unhandled error: {str(e)}"
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
            locale = (
                request.environ.get("HTTP_ACCEPT_LANGUAGE")
                if request.environ.get("HTTP_ACCEPT_LANGUAGE")
                else "en"
            )
            user_dto = UserService.get_mapped_projects(username, locale)
            return user_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User or mapping not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
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
            error_msg = f"User GET - unhandled error: {str(e)}"
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
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserSetExpertMode(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, is_expert):
        """
        Allows user to enable or disable expert mode
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
            - name: is_expert
              in: path
              description: true to enable expert mode, false to disable
              required: true
              type: string
        responses:
            200:
                description: Mode set
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
            UserService.set_user_is_expert(
                tm.authenticated_user_id, is_expert == "true"
            )
            return {"Success": "Expert mode updated"}, 200
        except UserServiceError:
            return {"Error": "Not allowed"}, 400
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"UserSetExpert POST - unhandled error: {str(e)}"
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
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserValidatorRoleByIdAPI(Resource):
    @tm.pm_only(True)
    @token_auth.login_required
    def put(self, id):
        """
        put to update a validator role request id
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
            - in: path
              name: id
              description: User validator role request id
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for updating validator role request
              schema:
                  properties:
                      response_reason:
                          type: string
                      status:
                          type: string
                          description: response status. OPTIONS "DENY", "ACCEPT"
        responses:
            200:
                description: Validator role request updated
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            payload = request.get_json()
            # Validate that user exists.
            dto = UserValidatorRoleRequestService.get_by_id_as_dto(id)
            dto.response_reason = payload["response_reason"]
            dto.status = UserValidatorRoleRequestStatus[payload["status"]].name
            dto.response_user_id = tm.authenticated_user_id
            dto.updated_date = timestamp()
            dto.validate()

            dto = UserValidatorRoleRequestService.update(dto)

            return dto.serialize()
        except KeyError:
            return {"Error": "Invalid status value"}, 400
        except ValueError as e:
            return {"Error": str(e)}, 400
        except NotFound:
            return {"Error": "User not found"}, 404
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

    @token_auth.login_required
    def get(self, id):
        """
        Gets user validation role request
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
            - name: id
              in: path
              description: The role request id
              required: true
              type: integer
        responses:
            200:
                description: User validator role request found
            404:
                description: No user validator role request found
            500:
                description: Internal Server Error
        """
        try:
            data = UserValidatorRoleRequestService.get_by_id_as_dto(id)
            return data.serialize()
        except ValueError as e:
            return {"Error": str(e)}, 400
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only(True)
    @token_auth.login_required
    def delete(self, id):
        """
        Deletes user validation role request
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
            - name: id
              in: path
              description: The role request id
              required: true
              type: integer
        responses:
            200:
                description: User validator role request found
            404:
                description: No user validator role request found
            500:
                description: Internal Server Error
        """
        try:
            UserValidatorRoleRequestService.delete(id)
            return {"Success": True}
        except ValueError as e:
            return {"Error": str(e)}, 400
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserValidatorRoleRequestAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self):
        """
        Post to indicate user has applied as a validator role
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
              description: JSON object for creating a validator role request
              schema:
                  properties:
                      reason:
                          type: string
                      reviewed_howto:
                          type: boolean
                      read_learnosm:
                          type: boolean
                      read_code_conduct:
                          type: boolean
                      agreed_interactions:
                          type: boolean
                      agreed_osmdata:
                          type: boolean
        responses:
            200:
                description: Validator role request created
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            payload = request.get_json()
            payload["requester_user_id"] = tm.authenticated_user_id
            role_dto = UserValidatorRoleRequestDTO(payload)
            role_dto.validate()

            # Now we insert it into the database.
            role_dto = UserValidatorRoleRequestService.create(role_dto)
            return role_dto.serialize()

        except NotFound:
            return {"Error": "User not found"}, 404
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400
