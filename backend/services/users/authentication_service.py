import base64
import binascii
import urllib.parse
from random import SystemRandom
from typing import Optional

from databases import Database
from fastapi import Depends, HTTPException, Security, status
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from loguru import logger
from starlette.authentication import (
    AuthCredentials,
    AuthenticationBackend,
    AuthenticationError,
    SimpleUser,
)

from backend.api.utils import TMAPIDecorators
from backend.config import settings
from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.statuses import UserRole
from backend.models.postgis.user import User
from backend.services.messaging.message_service import MessageService
from backend.services.users.user_service import NotFound, UserService

# token_auth = HTTPTokenAuth(scheme="Token")
tm = TMAPIDecorators()

UNICODE_ASCII_CHARACTER_SET = (
    "abcdefghijklmnopqrstuvwxyz" "ABCDEFGHIJKLMNOPQRSTUVWXYZ" "0123456789" "-_"
)


# @token_auth.error_handler
def handle_unauthorized_token():
    logger.debug("Token not valid")
    return JSONResponse(
        content={"Error": "Token is expired or invalid", "SubCode": "InvalidToken"},
        status_code=401,
    )


# @token_auth.verify_token
def verify_token(token):
    """Verify the supplied token and check user role is correct for the requested resource"""
    tm.authenticated_user_id = None
    if not token:
        return False

    try:
        decoded_token = base64.b64decode(token).decode("utf-8")
    except UnicodeDecodeError:
        logger.debug("Unable to decode token")
        return False  # Can't decode token, so fail login

    valid_token, user_id = AuthenticationService.is_valid_token(decoded_token, 120)
    if not valid_token:
        logger.debug("Token not valid")
        return False

    tm.authenticated_user_id = (
        user_id  # Set the user ID on the decorator as a convenience
    )
    return user_id  # All tests passed token is good for the requested resource


class TokenAuthBackend(AuthenticationBackend):
    async def authenticate(self, conn):
        if "authorization" not in conn.headers:
            return None

        auth = conn.headers["authorization"]
        try:
            scheme, credentials = auth.split()
            if scheme.lower() != "token":
                return None
            try:
                decoded_token = base64.b64decode(credentials).decode("ascii")
            except UnicodeDecodeError:
                logger.debug("Unable to decode token")
                return None
        except (ValueError, UnicodeDecodeError, binascii.Error):
            raise AuthenticationError("Invalid auth credentials")

        valid_token, user_id = AuthenticationService.is_valid_token(
            decoded_token, 604800
        )
        if not valid_token:
            logger.debug("Token not valid.")
            return None
        tm.authenticated_user_id = user_id
        return AuthCredentials(["authenticated"]), SimpleUser(user_id)


class AuthServiceError(Exception):
    """Custom Exception to notify callers an error occurred when authenticating"""

    def __init__(self, message):
        logger.debug(message)


class AuthenticationService:
    @staticmethod
    async def login_user(osm_user_details, email, db, user_element="user") -> dict:
        """
        Generates authentication details for user, creating in DB if user is unknown to us
        :param osm_user_details: XML response from OSM
        :param redirect_to: Route to redirect user to, from callback url
        :param user_element: Exists for unit testing
        :raises AuthServiceError
        :returns A dictionary containing the keys "username", "session_token"
        and "picture."
        """
        osm_user = osm_user_details.get(user_element)

        if osm_user is None:
            raise AuthServiceError("User element not found in OSM response")

        osm_id = int(osm_user.get("id"))
        username = osm_user.get("display_name")
        try:
            # get gravatar profile picture file name
            user_picture = osm_user.get("img").get("href")
        except (AttributeError, IndexError):
            user_picture = None

        try:
            await UserService.update_user(osm_id, username, user_picture, db)
        except NotFound:
            # User not found, so must be new user
            changesets = osm_user.get("changesets")
            changeset_count = int(changesets.get("count"))
            async with db.transaction():
                new_user = await UserService.register_user(
                    osm_id, username, changeset_count, user_picture, email, db
                )
            await MessageService.send_welcome_message(new_user, db)

        # Update stats
        await UserService.get_and_save_stats(osm_id, db)

        session_token = AuthenticationService.generate_session_token_for_user(osm_id)
        return {
            "username": username,
            "session_token": session_token,
            "picture": user_picture,
        }

    @staticmethod
    async def authenticate_email_token(username: str, token: str, db: Database):
        """Validate that the email token is valid"""
        user = await UserService.get_user_by_username(username, db)

        is_valid, tokenised_email = AuthenticationService.is_valid_token(token, 86400)

        if not is_valid:
            raise AuthServiceError(
                tokenised_email
            )  # Since token is invalid, tokenised_email is the error message

        if user.email_address != tokenised_email:
            raise AuthServiceError("InvalidEmail- Email address does not match token")

        # Token is valid so update DB and return
        await User.set_email_verified_status(user, is_verified=True, db=db)
        return AuthenticationService._get_email_validated_url(True)

    @staticmethod
    def _get_email_validated_url(is_valid: bool) -> str:
        """Helper function to generate redirect url for email verification"""
        base_url = settings.APP_BASE_URL

        verification_params = {"is_valid": is_valid}
        verification_url = "{0}/validate-email?{1}".format(
            base_url, urllib.parse.urlencode(verification_params)
        )
        return verification_url

    @staticmethod
    def get_authentication_failed_url():
        """Generates the auth-failed URL for the running app"""
        base_url = settings.APP_BASE_URL
        auth_failed_url = f"{base_url}/auth-failed"
        return auth_failed_url

    @staticmethod
    def generate_session_token_for_user(osm_id: int):
        """
        Generates a unique token with the osm_id and current time embedded within it
        :param osm_id: OSM ID of the user authenticating
        :return: Token
        """
        entropy = settings.SECRET_KEY if settings.SECRET_KEY else "un1testingmode"

        serializer = URLSafeTimedSerializer(entropy)
        return serializer.dumps(osm_id)

    # code taken from https://github.com/oauthlib/oauthlib/blob/master/oauthlib/common.py
    @staticmethod
    def generate_random_state(length=48, chars=UNICODE_ASCII_CHARACTER_SET):
        """Generates a non-guessable OAuth token
        OAuth (1 and 2) does not specify the format of tokens except that they
        should be strings of random characters. Tokens should not be guessable
        and entropy when generating the random characters is important. Which is
        why SystemRandom is used instead of the default random.choice method.
        """
        rand = SystemRandom()
        return "".join(rand.choice(chars) for x in range(length))

    @staticmethod
    def is_valid_token(token, token_expiry):
        """
        Validates if the supplied token is valid, and hasn't expired.
        :param token: Token to check
        :param token_expiry: When the token expires in seconds
        :return: True if token is valid, and user_id contained in token
        """
        entropy = settings.SECRET_KEY if settings.SECRET_KEY else "un1testingmode"
        serializer = URLSafeTimedSerializer(entropy)

        try:
            tokenised_user_id = serializer.loads(token, max_age=token_expiry)
        except SignatureExpired:
            # current_app.logger.debug("Token has expired")
            return False, "ExpiredToken- Token has expired"
        except BadSignature:
            # current_app.logger.debug("Bad Token Signature")
            return False, "BadSignature- Bad Token Signature"

        return True, tokenised_user_id


async def login_required(
    Authorization: str = Security(APIKeyHeader(name="Authorization")),
):
    if not Authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    try:
        scheme, credentials = Authorization.split()
        if scheme.lower() != "token":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        try:
            decoded_token = base64.b64decode(credentials).decode("ascii")
        except UnicodeDecodeError:
            logger.debug("Unable to decode token")
            raise HTTPException(status_code=401, detail="Invalid token")
    except (ValueError, UnicodeDecodeError, binascii.Error):
        raise AuthenticationError("Invalid auth credentials")
    valid_token, user_id = AuthenticationService.is_valid_token(decoded_token, 604800)
    if not valid_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"Error": "Token is expired or invalid", "SubCode": "InvalidToken"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return AuthUserDTO(id=user_id)


async def login_required_optional(
    Authorization: Optional[str] = Security(
        APIKeyHeader(name="Authorization", auto_error=False)
    ),
):
    if not Authorization:
        return None
    try:
        scheme, credentials = Authorization.split()
        if scheme.lower() != "token":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        try:
            decoded_token = base64.b64decode(credentials).decode("ascii")
        except UnicodeDecodeError:
            logger.debug("Unable to decode token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "Error": "Token is expired or invalid",
                    "SubCode": "InvalidToken",
                },
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (ValueError, UnicodeDecodeError, binascii.Error):
        raise AuthenticationError("Invalid auth credentials")
    valid_token, user_id = AuthenticationService.is_valid_token(decoded_token, 604800)
    if not valid_token:
        return None
    return AuthUserDTO(id=user_id)


async def admin_only(
    Authorization: str = Security(APIKeyHeader(name="Authorization")),
    db: Database = Depends(get_db),
):
    if not Authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    try:
        scheme, credentials = Authorization.split()
        if scheme.lower() != "token":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        try:
            decoded_token = base64.b64decode(credentials).decode("ascii")
        except UnicodeDecodeError:
            raise HTTPException(status_code=401, detail="Invalid token")
    except (ValueError, UnicodeDecodeError, binascii.Error):
        raise HTTPException(status_code=401, detail="Invalid auth credentials")

    valid_token, user_id = AuthenticationService.is_valid_token(decoded_token, 604800)
    if not valid_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"Error": "Token is expired or invalid", "SubCode": "InvalidToken"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    query = "SELECT id, username, role FROM users WHERE id = :user_id"
    user = await db.fetch_one(query=query, values={"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")

    return AuthUserDTO(id=user["id"])
