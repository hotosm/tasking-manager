from databases import Database
from fastapi import APIRouter, Depends, Query
from fastapi.logger import logger
from fastapi.responses import JSONResponse
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError

from backend import osm
from backend.config import settings
from backend.db import get_db
from backend.services.users.authentication_service import (
    AuthenticationService,
    AuthServiceError,
)

router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


# class SystemAuthenticationLoginAPI():
@router.get("/authentication/login/")
async def login(
    redirect_uri: str = Query(
        default=settings.OAUTH_REDIRECT_URI,
        description="Route to redirect user once authenticated",
    )
):
    """
    Redirects user to OSM to authenticate
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
        - in: query
          name: redirect_uri
          description: Route to redirect user once authenticated
          type: string
          default: /take/me/here
    responses:
      200:
        description: oauth2 params
    """
    authorize_url = f"{settings.OSM_SERVER_URL}/oauth2/authorize"
    state = AuthenticationService.generate_random_state()

    osm.redirect_uri = redirect_uri
    osm.state = state

    login_url, state = osm.authorization_url(authorize_url)
    return {"auth_url": login_url, "state": state}


# class SystemAuthenticationCallbackAPI():
@router.get("/authentication/callback/")
async def callback(
    authorization_code: str
    | None = Query(
        None, alias="code", description="Code obtained after user authorization"
    ),
    redirect_uri: str = Query(
        settings.OAUTH_REDIRECT_URI,
        description="Route to redirect user once authenticated",
    ),
    email: str
    | None = Query(
        None,
        alias="email_address",
        description="Email address to used for email notifications from TM.",
    ),
    db: Database = Depends(get_db),
):
    """
    Handles the OSM OAuth callback
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
        - in: query
          name: redirect_uri
          description: Route to redirect user once authenticated
          type: string
          default: /take/me/here
          required: false
        - in: query
          name: code
          description: Code obtained after user authorization
          type: string
          required: true
        - in: query
          name: email_address
          description: Email address to used for email notifications from TM.
          type: string
          required: false
    responses:
      302:
        description: Redirects to login page, or login failed page
      400:
        description: Missing/Invalid code parameter
      500:
        description: A problem occurred authenticating the user
      502:
        description: A problem occurred negotiating with the OSM API
    """

    token_url = f"{settings.OSM_SERVER_URL}/oauth2/token"
    if authorization_code is None:
        return JSONResponse(
            content={"SubCode": "InvalidData", "Error": "Missing code parameter"},
            status_code=400,
        )

    osm.redirect_uri = redirect_uri
    try:
        osm_resp = osm.fetch_token(
            token_url=token_url,
            client_secret=settings.OAUTH_CLIENT_SECRET,
            code=authorization_code,
        )
    except InvalidGrantError:
        return JSONResponse(
            content={
                "Error": "The provided authorization grant is invalid, expired or revoked",
                "SubCode": "InvalidGrantError",
            },
            status_code=400,
        )
    if osm_resp is None:
        logger.critical("Couldn't obtain token from OSM.")
        return JSONResponse(
            content={
                "SubCode": "TokenFetchError",
                "Error": "Couldn't fetch token from OSM.",
            },
            status_code=502,
        )

    user_info_url = f"{settings.OAUTH_API_URL}/user/details.json"

    osm_response = osm.get(user_info_url)  # Get details for the authenticating user
    if osm_response.status_code != 200:
        logger.critical("Error response from OSM")
        return JSONResponse(
            content={
                "SubCode": "OSMServiceError",
                "Error": "Couldn't fetch user details from OSM.",
            },
            status_code=502,
        )

    try:
        user_params = await AuthenticationService.login_user(
            osm_response.json(), email, db
        )
        user_params["session"] = osm_resp
        return user_params
    except AuthServiceError:
        return JSONResponse(
            content={"SubCode": "AuthError", "Error": "Unable to authenticate"},
            status_code=502,
        )


@router.get("/authentication/email/")
async def authenticate_email(
    username: str = Query(..., description="Username, e.g. thinkwhere"),
    token: str = Query(..., description="Authentication token, e.g. 1234dvsdf"),
    db: Database = Depends(get_db),
):
    """
    Authenticates user owns email address
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
        - in: query
          name: username
          type: string
          default: thinkwhere
        - in: query
          name: token
          type: string
          default: 1234dvsdf
    responses:
        301:
            description: Will redirect to email validation page
        403:
            description: Forbidden
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    try:
        await AuthenticationService.authenticate_email_token(username, token, db)
        return JSONResponse(content={"Status": "OK"}, status_code=200)

    except AuthServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )
