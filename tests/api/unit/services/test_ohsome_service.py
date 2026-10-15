from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from backend.config import settings
from backend.services.ohsome_service import OhsomeService


def test_url_for_joins_base_and_path_without_double_slash():
    with patch.object(
        settings, "OHSOME_STATS_API_URL", "https://api.heigit.org/ohsome-now/v1/"
    ):
        assert (
            OhsomeService.url_for("/user")
            == "https://api.heigit.org/ohsome-now/v1/user"
        )
        assert (
            OhsomeService.url_for("stats/hashtags/foo")
            == "https://api.heigit.org/ohsome-now/v1/stats/hashtags/foo"
        )


def test_headers_send_raw_token_without_basic_prefix():
    # HeiGIT user management rejects a `Basic `-prefixed token with a 403.
    with patch.object(settings, "OHSOME_STATS_TOKEN", "a-heigit-token"):
        assert OhsomeService.headers() == {"Authorization": "a-heigit-token"}


@pytest.mark.anyio
async def test_request_sends_token_on_every_call():
    mock_response = MagicMock(status_code=200)

    with (
        patch.object(settings, "OHSOME_STATS_TOKEN", "a-heigit-token"),
        patch.object(
            settings, "OHSOME_STATS_API_URL", "https://api.heigit.org/ohsome-now/v1"
        ),
        patch(
            "backend.services.ohsome_service.AsyncClient.get", new_callable=AsyncMock
        ) as mock_get,
    ):
        mock_get.return_value = mock_response
        await OhsomeService.request("/stats", {"hashtag": "hotosm-project-*"})

    mock_get.assert_awaited_once()
    assert mock_get.call_args.args[0] == "https://api.heigit.org/ohsome-now/v1/stats"
    assert mock_get.call_args.kwargs["params"] == {"hashtag": "hotosm-project-*"}
    assert mock_get.call_args.kwargs["headers"]["Authorization"] == "a-heigit-token"


@pytest.mark.anyio
async def test_fetch_returns_decoded_json():
    mock_response = MagicMock(status_code=200)
    mock_response.json.return_value = {"result": {"topics": {"road": {"value": 1.0}}}}

    with patch.object(OhsomeService, "request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response
        assert await OhsomeService.fetch("/stats") == {
            "result": {"topics": {"road": {"value": 1.0}}}
        }


@pytest.mark.anyio
async def test_fetch_raises_502_when_ohsome_errors():
    mock_response = MagicMock(status_code=500, text="Internal Server Error")

    with patch.object(OhsomeService, "request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response
        with pytest.raises(HTTPException) as exc:
            await OhsomeService.fetch("/stats")

    assert exc.value.status_code == 502


@pytest.mark.anyio
async def test_fetch_raises_502_when_ohsome_unreachable():
    with patch.object(OhsomeService, "request", new_callable=AsyncMock) as mock_request:
        mock_request.side_effect = ConnectionError("boom")
        with pytest.raises(HTTPException) as exc:
            await OhsomeService.fetch("/stats")

    assert exc.value.status_code == 502
