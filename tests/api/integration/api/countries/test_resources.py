import pytest
import logging

from httpx import AsyncClient

# import the actual async helper you provided
from tests.api.helpers.test_helpers import create_canned_project

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

TEST_COUNTRY = "Test Country"


@pytest.mark.anyio
class TestCountriesRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Create a canned project using the provided async helper.
        The helper returns (test_project, test_user, project_id).
        """
        self.db = db_connection_fixture
        self.endpoint_url = "/api/v2/countries/"

        self.test_project, self.test_user, self.project_id = (
            await create_canned_project(self.db)
        )

    async def test_get_all_country_tags_passes(self, client: AsyncClient):
        """
        1) GET /api/v2/countries/ when there are no country tags -> []
        2) Set the project's country and GET -> [TEST_COUNTRY]
        """
        response1 = await client.get(self.endpoint_url)
        assert response1.status_code == 200
        body1 = response1.json()
        assert "tags" in body1
        assert isinstance(body1["tags"], list)
        assert len(body1["tags"]) == 0
        assert body1["tags"] == []

        assert self.project_id is not None
        await self.db.execute(
            "UPDATE projects SET country = :country WHERE id = :id",
            {"country": [TEST_COUNTRY], "id": self.project_id},
        )

        response2 = await client.get(self.endpoint_url)
        assert response2.status_code == 200
        body2 = response2.json()
        assert "tags" in body2
        assert isinstance(body2["tags"], list)
        assert len(body2["tags"]) == 1
        assert body2["tags"] == [TEST_COUNTRY]
