# from flask import current_app, request
# from flask_restful import
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError

from backend import osm
from backend.config import settings
from backend.services.users.authentication_service import (
    AuthenticationService,
    AuthServiceError,
)
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from fastapi.logger import logger

from databases import Database
from backend.db import get_db


router = APIRouter(
    prefix="/system",
    tags=["system"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class SystemAuthenticationLoginAPI():
@router.get("/authentication/login/")
async def get(request: Request):
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
    redirect_uri = request.query_params.get("redirect_uri", settings.OAUTH_REDIRECT_URI)
    authorize_url = f"{settings.OSM_SERVER_URL}/oauth2/authorize"
    state = AuthenticationService.generate_random_state()

    osm.redirect_uri = redirect_uri
    osm.state = state

    login_url, state = osm.authorization_url(authorize_url)
    return {"auth_url": login_url, "state": state}, 200


# class SystemAuthenticationCallbackAPI():
@router.get("/authentication/callback/")
async def get(request: Request, db: Database = Depends(get_db)):
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
    authorization_code = request.query_params.get("code", None)
    if authorization_code is None:
        return {"SubCode": "InvalidData", "Error": "Missing code parameter"}, 400

    email = request.query_params.get("email_address", None)
    redirect_uri = request.query_params.get("redirect_uri", settings.OAUTH_REDIRECT_URI)
    osm.redirect_uri = redirect_uri
    try:
        osm_resp = osm.fetch_token(
            token_url=token_url,
            client_secret=settings.OAUTH_CLIENT_SECRET,
            code=authorization_code,
        )
    except InvalidGrantError:
        return {
            "Error": "The provided authorization grant is invalid, expired or revoked",
            "SubCode": "InvalidGrantError",
        }, 400
    if osm_resp is None:
        logger.critical("Couldn't obtain token from OSM.")
        return {
            "SubCode": "TokenFetchError",
            "Error": "Couldn't fetch token from OSM.",
        }, 502

    user_info_url = f"{settings.OAUTH_API_URL}/user/details.json"

    osm_response = osm.get(user_info_url)  # Get details for the authenticating user
    if osm_response.status_code != 200:
        logger.critical("Error response from OSM")
        return {
            "SubCode": "OSMServiceError",
            "Error": "Couldn't fetch user details from OSM.",
        }, 502

    try:
        user_params = await AuthenticationService.login_user(
            osm_response.json(), email, db
        )
        user_params["session"] = osm_resp
        return user_params, 200
    except AuthServiceError:
        return {"Error": "Unable to authenticate", "SubCode": "AuthError"}, 500


# class SystemAuthenticationEmailAPI():
@router.get("/authentication/email/")
async def get(request: Request):
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
        username = request.query_params.get("username")
        token = request.query_params.get("token")
        AuthenticationService.authenticate_email_token(username, token)

        return {"Status": "OK"}, 200

    except AuthServiceError as e:
        return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403
