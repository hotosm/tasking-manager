import logging
from typing import Optional

from fastapi import HTTPException
from httpx import AsyncClient, Response

from backend.config import settings

logger = logging.getLogger(__name__)


def sanitise_for_log(value) -> str:
    """Strip CR/LF so a caller-supplied value cannot forge extra log lines."""
    return str(value).replace("\r", "").replace("\n", "")


class OhsomeService:
    """Client for the ohsomeNow Stats API (https://api.heigit.org/ohsome-now/v1).

    Every ohsomeNow endpoint requires the HeiGIT API token, so all outgoing
    requests are funnelled through here to keep the token in a single place and
    out of the browser.
    """

    DEFAULT_TIMEOUT = 30.0

    @staticmethod
    def url_for(path: str) -> str:
        return f"{settings.OHSOME_STATS_API_URL.rstrip('/')}/{path.lstrip('/')}"

    @staticmethod
    def headers() -> dict:
        # HeiGIT user management expects the raw token, without a `Basic` prefix.
        return {"Authorization": settings.OHSOME_STATS_TOKEN or ""}

    @staticmethod
    async def request(
        path: str,
        params: Optional[dict] = None,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> Response:
        """Perform a GET against ohsomeNow and return the raw response."""
        async with AsyncClient(timeout=timeout) as client:
            return await client.get(
                OhsomeService.url_for(path),
                params=params,
                headers=OhsomeService.headers(),
            )

    @staticmethod
    async def fetch(
        path: str,
        params: Optional[dict] = None,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> dict:
        """Perform a GET against ohsomeNow and return the decoded JSON body.

        Raises HTTPException(502) if ohsomeNow is unreachable or errors out.
        """
        try:
            response = await OhsomeService.request(path, params, timeout)
        except Exception:
            logger.exception(
                "Error reaching ohsomeNow API: path=%s", sanitise_for_log(path)
            )
            raise HTTPException(
                status_code=502, detail="Could not reach the ohsomeNow Stats API"
            )

        if response.status_code != 200:
            logger.error(
                "External-Error in ohsomeNow API: url=%s status_code=%s response=%s",
                sanitise_for_log(response.url),
                response.status_code,
                response.text[:500],
            )
            raise HTTPException(
                status_code=502,
                detail=f"ohsomeNow Stats API returned {response.status_code}",
            )

        return response.json()
