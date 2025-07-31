import pytest
import logging
from unittest.mock import patch
from httpx import AsyncClient

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@pytest.mark.anyio
class TestSystemHeartbeatAPI:
    @pytest.fixture(autouse=True)
    def _setup(self):
        self.url = "/api/v2/system/heartbeat/"

    async def test_get_system_heartbeat(self, client: AsyncClient):
        logger.info("Starting test: system heartbeat")
        response = await client.get(self.url)
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "Fastapi healthy"
        # ensure release key exists (but we won't assert its value here)
        assert "release" in body
        logger.info("Completed test: system heartbeat")


@pytest.mark.anyio
class TestSystemLanguagesAPI:
    @pytest.fixture(autouse=True)
    def _setup(self):
        self.url = "/api/v2/system/languages/"

    async def test_get_system_languages(self, client: AsyncClient):
        logger.info("Starting test: system languages")
        response = await client.get(self.url)
        assert response.status_code == 200

        keys = list(response.json().keys())
        assert set(keys) == {
            "mapperLevelIntermediate",
            "mapperLevelAdvanced",
            "supportedLanguages",
        }
        logger.info("Completed test: system languages")


@pytest.mark.anyio
class TestSystemContactAdminRestAPI:
    @pytest.fixture(autouse=True)
    def _setup(self):
        self.url = "/api/v2/system/contact-admin/"

    @patch("backend.config.settings.EMAIL_CONTACT_ADDRESS", "test@hotosm.org")
    async def test_post_contact_admin(self, client: AsyncClient):
        logger.info("Starting test: contact-admin success")

        payload = {"name": "test", "email": "test", "content": "test"}
        response = await client.post(self.url, json=payload)
        assert response.status_code == 201

        body = response.json()
        assert body["Success"] == "Email sent"
        logger.info("Completed test: contact-admin success")

    @patch("backend.config.settings.EMAIL_CONTACT_ADDRESS", None)
    async def test_post_contact_admin_raises_error_if_email_contact_address_not_set(
        self, client: AsyncClient
    ):
        logger.info("Starting test: contact-admin missing address")

        payload = {"name": "test", "email": "test@gmail.com", "content": "test"}
        response = await client.post(self.url, json=payload)
        assert response.status_code == 501

        body = response.json()
        assert body["Error"] == (
            "This feature is not implemented due to missing variable "
            "TM_EMAIL_CONTACT_ADDRESS."
        )
        logger.info("Completed test: contact-admin missing address")
