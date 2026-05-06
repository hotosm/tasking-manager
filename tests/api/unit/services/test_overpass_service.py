from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.config import settings
from backend.services.overpass_service import OVERPASS_API_URL, OverpassService


@pytest.mark.anyio
async def test_fetch_osm_features_sets_osm_user_agent():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"elements": []}

    geometry_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [85.3, 27.7],
                [85.31, 27.7],
                [85.31, 27.71],
                [85.3, 27.71],
                [85.3, 27.7],
            ]
        ],
    }

    with patch(
        "backend.services.overpass_service.httpx.AsyncClient.post",
        new_callable=AsyncMock,
    ) as mock_post:
        mock_post.return_value = mock_response

        await OverpassService.fetch_osm_features_for_boundary(
            geometry_geojson, timeout=1
        )

    mock_post.assert_awaited_once()
    request_url = mock_post.call_args.args[0]
    request_headers = mock_post.call_args.kwargs["headers"]

    assert request_url == OVERPASS_API_URL
    assert request_headers["Accept"] == "application/json"
    assert request_headers["Content-Type"] == "application/x-www-form-urlencoded"
    assert request_headers["User-Agent"] == settings.OSM_USER_AGENT
