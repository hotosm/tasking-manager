from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.user_dto import UserDTO
from server.services.messaging.message_service import MessageService
from server.services.users.authentication_service import token_auth, tm
from server.services.users.user_service import UserService, UserServiceError, NotFound


class UsersActionsSetUsersAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def patch(self):
        """
        Updates user info
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
                      gender:
                          type: string
                          description: gender
                      selfDescriptionGender:
                          type: string
                          description: gender self-description
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
        except ValueError as e:
            return {"Error": str(e)}, 400
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {"Error": "Unable to update user details"}, 400

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
            return {"Error": "Unable to update user details"}, 500


class UsersActionsSetLevelAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def patch(self, username, level):
        """
        Allows PMs to set a users mapping level
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
            return {"Error": "Unable to update mapping level"}, 500


class UsersActionsSetRoleAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def patch(self, username, role):
        """
        Allows PMs to set the users role
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
            return {"Error": "Unable to update user role"}, 500


class UsersActionsSetExpertModeAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def patch(self, is_expert):
        """
        Allows user to enable or disable expert mode
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
            return {"Error": "Unable to update expert mode"}, 500


class UsersActionsVerifyEmailAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def patch(self):
        """
        Resends the validation user to the logged in user
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
        responses:
            200:
                description: Resends the user their email verification email
            500:
                description: Internal Server Error
        """
        try:
            MessageService.resend_email_validation(tm.authenticated_user_id)
            return {"Success": "Verification email resent"}, 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to send verification email"}, 500
