from flask_restful import Resource, current_app, request
# from schematics.exceptions import DataError

from backend.models.dtos.user_dto import UserDTO, UserRegisterEmailDTO
from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import tm
from backend.services.users.user_service import UserService, UserServiceError
from backend.services.interests_service import InterestService
from fastapi import APIRouter, Depends, Request
from backend.db.database import get_db
from starlette.authentication import requires

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)

# class UsersActionsSetUsersAPI(Resource):
    # @token_auth.login_required
@router.patch("/me/actions/set-user/")
@requires("authenticated")
@tm.pm_only(False)
async def patch(request: Request):
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
            authenticated_user_id = request.user.display_name
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


# class UsersActionsSetLevelAPI(Resource):
    # @token_auth.login_required
@router.patch("/{username}/actions/set-level/{level}/")
@requires("authenticated")
@tm.pm_only()
async def patch(request: Request, username, level):
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


# class UsersActionsSetRoleAPI(Resource):
    # @token_auth.login_required
@router.patch("/{username}/actions/set-role/{role}/")
@requires("authenticated")
@tm.pm_only()
async def patch(request: Request, username: str, role: str):
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
            UserService.add_role_to_user(request.user.display_name, username, role)
            return {"Success": "Role Added"}, 200
        except UserServiceError as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


# class UsersActionsSetExpertModeAPI(Resource):
#     @tm.pm_only(False)
#     @token_auth.login_required
@router.patch("/{user_name}/actions/set-expert-mode/{is_expert}/")
@requires("authenticated")
@tm.pm_only()
async def patch(request: Request, user_name, is_expert):
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
                request.user.display_name, is_expert == "true"
            )
            return {"Success": "Expert mode updated"}, 200
        except UserServiceError:
            return {"Error": "Not allowed"}, 400


# class UsersActionsVerifyEmailAPI(Resource):
#     @tm.pm_only(False)
#     @token_auth.login_required
@router.patch("/me/actions/verify-email/")
@requires("authenticated")
@tm.pm_only()
async def patch(request: Request):
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
        MessageService.resend_email_validation(request.user.display_name)
        return {"Success": "Verification email resent"}, 200
    except ValueError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400


# class UsersActionsRegisterEmailAPI(Resource):
@router.post("/actions/register/")
async def post(request: Request):
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
            user_dto = UserRegisterEmailDTO(await request.json())
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
            return user_dto.model_dump(by_alias=True), 200
        except ValueError as e:
            user_dto = UserRegisterEmailDTO(dict(email=user_dto.email, details=str(e)))
            return user_dto.model_dump(by_alias=True), 400


# class UsersActionsSetInterestsAPI(Resource):
    # @token_auth.login_required
@router.post("/me/actions/set-interests/")
@requires("authenticated")
async def post(request: Request):
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
            request.user.display_name, data["interests"]
        )
        return user_interests.model_dump(by_alias=True), 200
    except (ValueError, KeyError) as e:
        return {"Error": str(e)}, 400
