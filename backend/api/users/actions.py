from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from backend.models.dtos.user_dto import UserDTO, UserRegisterEmailDTO
from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import token_auth, tm
from backend.services.users.user_service import UserService, UserServiceError
from backend.services.interests_service import InterestService


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
                      id:
                        type: integer
                        example: 1
                      name:
                          type: string
                          example: Your Name
                      city:
                          type: string
                          example: Your City
                      country:
                          type: string
                          example: Your Country
                      emailAddress:
                          type: string
                          example: test@test.com
                      twitterId:
                          type: string
                          example: twitter handle without @
                      facebookId:
                          type: string
                          example: facebook username
                      linkedinId:
                          type: string
                          example: linkedin username
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
                    None  # Replace empty string with None so validation doesn't break
                )

            user_dto.validate()
            authenticated_user_id = token_auth.current_user()
            if authenticated_user_id != user_dto.id:
                return {
                    "Error": "Unable to authenticate",
                    "SubCode": "UnableToAuth",
                }, 401
        except ValueError as e:
            return {"Error": str(e)}, 400
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {
                "Error": "Unable to update user details",
                "SubCode": "InvalidData",
            }, 400

        verification_sent = UserService.update_user_details(
            authenticated_user_id, user_dto
        )
        return verification_sent, 200


class UsersActionsSetLevelAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def patch(self, username, level):
        """
        Allows PMs to set a user's mapping level
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
              description: Mapper's OpenStreetMap username
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
        except UserServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400


class UsersActionsSetRoleAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def patch(self, username, role):
        """
        Allows PMs to set a user's role
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
              description: Mapper's OpenStreetMap username
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
            UserService.add_role_to_user(token_auth.current_user(), username, role)
            return {"Success": "Role Added"}, 200
        except UserServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


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
                token_auth.current_user(), is_expert == "true"
            )
            return {"Success": "Expert mode updated"}, 200
        except UserServiceError:
            return {"Error": "Not allowed"}, 400


class UsersActionsVerifyEmailAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def patch(self):
        """
        Resends the verification email token to the logged in user
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
            MessageService.resend_email_validation(token_auth.current_user())
            return {"Success": "Verification email resent"}, 200
        except ValueError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400


class UsersActionsRegisterEmailAPI(Resource):
    def post(self):
        """
        Registers users without OpenStreetMap account
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - in: body
              name: body
              required: true
              description: JSON object to update a user
              schema:
                  properties:
                      email:
                          type: string
                          example: test@test.com
        responses:
            200:
                description: User registered
            400:
                description: Client Error - Invalid Request
            500:
                description: Internal Server Error
        """
        try:
            user_dto = UserRegisterEmailDTO(request.get_json())
            user_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {"Error": str(e), "SubCode": "InvalidData"}, 400

        try:
            user = UserService.register_user_with_email(user_dto)
            user_dto = UserRegisterEmailDTO(
                dict(
                    success=True,
                    email=user_dto.email,
                    details="User created successfully",
                    id=user.id,
                )
            )
            return user_dto.to_primitive(), 200
        except ValueError as e:
            user_dto = UserRegisterEmailDTO(dict(email=user_dto.email, details=str(e)))
            return user_dto.to_primitive(), 400


class UsersActionsSetInterestsAPI(Resource):
    @token_auth.login_required
    def post(self):
        """
        Creates a relationship between user and interests
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
            - in: body
              name: body
              required: true
              description: JSON object for creating/updating user and interests relationships
              schema:
                  properties:
                      interests:
                          type: array
                          items:
                            type: integer
        responses:
            200:
                description: New user interest relationship created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            data = request.get_json()
            user_interests = InterestService.create_or_update_user_interests(
                token_auth.current_user(), data["interests"]
            )
            return user_interests.to_primitive(), 200
        except (ValueError, KeyError) as e:
            return {"Error": str(e)}, 400
