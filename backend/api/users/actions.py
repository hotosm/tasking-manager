from fastapi import APIRouter, Depends, Request, Body
from fastapi.responses import JSONResponse
from loguru import logger

from backend.models.dtos.user_dto import UserDTO, UserRegisterEmailDTO
from databases import Database
from backend.db import get_db
from backend.services.users.authentication_service import login_required
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import tm
from backend.services.users.user_service import UserService, UserServiceError
from backend.services.interests_service import InterestService
from backend.db import get_session
from starlette.authentication import requires

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


@router.patch("/me/actions/set-user/")
# @tm.pm_only(False)
async def patch(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    user_dto: UserDTO = Body(...),
):
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
        if user_dto.email_address == "":
            user_dto.email_address = (
                None  # Replace empty string with None so validation doesn't break
            )
        if user.id != user_dto.id:
            return JSONResponse(
                content={
                    "Error": "Unable to authenticate",
                    "SubCode": "UnableToAuth",
                },
                status_code=401,
            )
    except ValueError as e:
        return JSONResponse(content={"Error": str(e)}, status_code=400)
    except ValueError as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": "Unable to update user details",
                "SubCode": "InvalidData",
            },
            status_code=400,
        )

    verification_sent = await UserService.update_user_details(user.id, user_dto, db)
    return verification_sent


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


@router.patch("/{user_name}/actions/set-expert-mode/{is_expert}/")
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
        UserService.set_user_is_expert(request.user.display_name, is_expert == "true")
        return {"Success": "Expert mode updated"}, 200
    except UserServiceError:
        return {"Error": "Not allowed"}, 400


@router.patch("/me/actions/verify-email/")
# @tm.pm_only()
async def patch(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
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
        await MessageService.resend_email_validation(user.id, db)
        return JSONResponse(
            content={"Success": "Verification email resent"}, status_code=200
        )
    except ValueError as e:
        return JSONResponse(
            content={"Error": str(e), "SubCode": str(e).split("-")[0]}, status_code=400
        )


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
        logger.error(f"error validating request: {str(e)}")
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


@router.post("/me/actions/set-interests/")
async def post(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        data = await request.json()
        user_interests = await InterestService.create_or_update_user_interests(
            user.id, data["interests"], db
        )
        return user_interests
    except (ValueError, KeyError) as e:
        return {"Error": str(e)}, 400
