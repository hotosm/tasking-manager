import re
from typing import AsyncGenerator, Optional

import requests
from loguru import logger

from backend.config import settings
from backend.models.dtos.user_dto import UserOSMDTO
import httpx


class OSMServiceError(Exception):
    """Custom Exception to notify callers an error occurred when in the User Service"""

    def __init__(self, message):
        logger.debug(message)


class OSMService:
    @staticmethod
    async def is_osm_user_gone(user_id: int) -> bool:
        """
        Async HEAD request to check OSM user status.
        Returns True for 410, False for 200, raise OSMServiceError otherwise.
        """
        osm_user_details_url = f"{settings.OSM_SERVER_URL}/api/0.6/user/{user_id}.json"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.head(osm_user_details_url, follow_redirects=True)
        if resp.status_code == 410:
            return True
        if resp.status_code == 200:
            return False
        # treat other statuses as an error so caller can decide
        raise OSMServiceError(f"Bad response from OSM: {resp.status_code}")

    @staticmethod
    def get_deleted_users() -> Optional[AsyncGenerator[int, None]]:
        """
        Return an async generator yielding deleted user IDs (ascending).
        If not using https://www.openstreetmap.org as OSM_SERVER_URL, return None
        (matching original behaviour).
        """
        if settings.OSM_SERVER_URL != "https://www.openstreetmap.org":
            return None

        async def _gen() -> AsyncGenerator[int, None]:
            url = "https://planet.openstreetmap.org/users_deleted/users_deleted.txt"
            username_re = re.compile(r"^\s*(\d+)\s*$")
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("GET", url) as resp:
                    if resp.status_code != 200:
                        # Fail fast — caller can handle OSMServiceError
                        raise OSMServiceError(
                            f"Failed fetching deleted users: {resp.status_code}"
                        )
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        m = username_re.fullmatch(line)
                        if m:
                            yield int(m.group(1))

        return _gen()

    @staticmethod
    def get_osm_details_for_user(user_id: int) -> UserOSMDTO:
        """
        Gets OSM details for the user from OSM API
        :param user_id: user_id in scope
        :raises OSMServiceError
        """
        osm_user_details_url = f"{settings.OSM_SERVER_URL}/api/0.6/user/{user_id}.json"
        response = requests.get(osm_user_details_url)

        if response.status_code == 410:
            raise OSMServiceError("User no longer exists on OSM")
        if response.status_code != 200:
            raise OSMServiceError("Bad response from OSM")

        return OSMService._parse_osm_user_details_response(response.json())

    @staticmethod
    def _parse_osm_user_details_response(
        osm_response: dict, user_element="user"
    ) -> UserOSMDTO:
        """Parses the OSM user details response and extracts user info"""
        osm_user = osm_response.get(user_element, None)

        if osm_user is None:
            raise OSMServiceError("User was not found in OSM response")

        osm_dto = UserOSMDTO()
        osm_dto.account_created = osm_user.get("account_created")
        osm_dto.changeset_count = osm_user.get("changesets").get("count")
        return osm_dto
