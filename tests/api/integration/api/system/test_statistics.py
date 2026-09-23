import pytest
import logging
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import AsyncClient

from backend.services.ohsome_service import OhsomeService
from backend.models.postgis.task import Task
from tests.api.helpers.test_helpers import (
    return_canned_user,
    create_canned_project,
    create_canned_user,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@pytest.mark.anyio
class TestSystemStatisticsAPI:
    @pytest.fixture(autouse=True)
    def _setup(self):
        self.url = "/api/v2/system/statistics/"

    async def test_returns_home_page_stats(
        self, client: AsyncClient, db_connection_fixture
    ):
        logger.info("Starting test: home page statistics")

        test_user = await return_canned_user(
            db_connection_fixture, "Test User", 2222222
        )
        await create_canned_user(db_connection_fixture, test_user)

        project, _, project_id = await create_canned_project(db_connection_fixture)

        # Lock a task for mapping as mappers online is calculated based on locked tasks
        # Set task 2 to mapped since it's created unmapped
        await Task.lock_task_for_mapping(
            2, project_id, test_user.id, db_connection_fixture
        )

        response = await client.get(self.url)
        assert response.status_code == 200

        data = response.json()

        assert data["mappersOnline"] == 1
        assert data["tasksMapped"] == 2
        assert data["totalMappers"] == 2
        assert data["totalProjects"] == 1


@pytest.mark.anyio
class TestOhsomeStatisticsAPI:
    """The ohsomeNow API needs the HeiGIT token on every request, so the frontend
    reaches it through these proxy endpoints instead of calling it directly."""

    async def test_ohsome_stats_proxies_to_stats_endpoint(self, client: AsyncClient):
        with patch.object(OhsomeService, "fetch", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"result": {"topics": {"road": {"value": 1.0}}}}
            response = await client.get(
                "/api/v2/system/statistics/ohsome/",
                params={"hashtag": "hotosm-project-*", "topics": "building,road"},
            )

        assert response.status_code == 200
        assert response.json() == {"result": {"topics": {"road": {"value": 1.0}}}}
        mock_fetch.assert_awaited_once_with(
            "/stats", {"hashtag": "hotosm-project-*", "topics": "building,road"}
        )

    async def test_ohsome_stats_joins_repeated_topics_params(self, client: AsyncClient):
        # The frontend sends `?topics=building&topics=road`, ohsomeNow wants
        # a single comma-separated value.
        with patch.object(OhsomeService, "fetch", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"result": {}}
            await client.get(
                "/api/v2/system/statistics/ohsome/"
                "?hashtag=hotosm-project-*&topics=building&topics=road&topics=edit"
            )

        assert mock_fetch.call_args.args[1]["topics"] == "building,road,edit"

    async def test_ohsome_stats_forwards_date_range(self, client: AsyncClient):
        with patch.object(OhsomeService, "fetch", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"result": {}}
            await client.get(
                "/api/v2/system/statistics/ohsome/",
                params={
                    "hashtag": "hotosm-project-*",
                    "startdate": "2024-01-01T00:00:00Z",
                    "enddate": "2024-02-01T00:00:00Z",
                },
            )

        assert mock_fetch.call_args.args[1] == {
            "hashtag": "hotosm-project-*",
            "startdate": "2024-01-01T00:00:00Z",
            "enddate": "2024-02-01T00:00:00Z",
        }

    async def test_ohsome_stats_requires_hashtag(self, client: AsyncClient):
        response = await client.get("/api/v2/system/statistics/ohsome/")
        assert response.status_code == 422

    async def test_ohsome_metadata_proxies_to_metadata_endpoint(
        self, client: AsyncClient
    ):
        with patch.object(OhsomeService, "fetch", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"result": {"max_timestamp": "2025-01-01"}}
            response = await client.get("/api/v2/system/statistics/ohsome/metadata/")

        assert response.status_code == 200
        assert response.json()["result"]["max_timestamp"] == "2025-01-01"
        mock_fetch.assert_awaited_once_with("/metadata")

    async def test_ohsome_hashtags_proxies_to_hashtags_endpoint(
        self, client: AsyncClient
    ):
        with patch.object(OhsomeService, "fetch", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"result": {"msf": {"roads": 1.0}}}
            response = await client.get(
                "/api/v2/system/statistics/ohsome/hashtags/",
                params={"hashtags": "msf,hotosm-project-*", "topics": "road"},
            )

        assert response.status_code == 200
        mock_fetch.assert_awaited_once_with(
            "/stats/hashtags/msf,hotosm-project-%2A", {"topics": "road"}
        )

    async def test_ohsome_hashtags_rejects_path_traversal(self, client: AsyncClient):
        response = await client.get(
            "/api/v2/system/statistics/ohsome/hashtags/",
            params={"hashtags": "../../metadata"},
        )
        assert response.status_code == 400

    async def test_ohsome_hashtags_percent_encodes_url_metacharacters(
        self, client: AsyncClient
    ):
        # Unencoded, "?" would start a query string on the upstream URL, "#"
        # would truncate it and a newline would forge log lines.
        with patch.object(OhsomeService, "fetch", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"result": {}}
            await client.get(
                "/api/v2/system/statistics/ohsome/hashtags/",
                params={"hashtags": "msf?a=1#frag\nx"},
            )

        path = mock_fetch.call_args.args[0]
        assert path == "/stats/hashtags/msf%3Fa%3D1%23frag%0Ax"
        for char in ("?", "#", "\n"):
            assert char not in path

    async def test_ohsome_hashtags_keeps_comma_separator_literal(
        self, client: AsyncClient
    ):
        # ohsomeNow uses "," to separate hashtags, so it must not be encoded.
        with patch.object(OhsomeService, "fetch", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"result": {}}
            await client.get(
                "/api/v2/system/statistics/ohsome/hashtags/",
                params={"hashtags": "msf,hotosm-project-*"},
            )

        assert mock_fetch.call_args.args[0] == "/stats/hashtags/msf,hotosm-project-%2A"

    async def test_ohsome_proxy_returns_502_when_ohsome_fails(
        self, client: AsyncClient
    ):
        with patch.object(
            OhsomeService, "request", new_callable=AsyncMock
        ) as mock_request:
            mock_request.return_value = MagicMock(status_code=500, text="boom")
            response = await client.get("/api/v2/system/statistics/ohsome/metadata/")

        assert response.status_code == 502
