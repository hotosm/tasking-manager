import pytest
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@pytest.mark.anyio
class TestSystemHealth:
    async def test_heartbeat(self, client):
        logger.info("Starting test: heartbeat without release version data.")
        response = await client.get("/api/v2/system/heartbeat/")
        logger.info("Response status code: %s", response.status_code)
        assert response.status_code == 200
        data = response.json()
        logger.info("Response JSON: %s", data)
        assert data["status"] == "Fastapi healthy"
        logger.info("Completed test: heartbeat without release version data.")
