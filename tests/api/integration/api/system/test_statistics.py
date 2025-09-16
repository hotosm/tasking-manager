import pytest
import logging

from httpx import AsyncClient
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

        test_user = return_canned_user("Test User", 2222222)
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
