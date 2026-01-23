import pytest

from backend.services.stats_service import StatsService
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestStatsService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # Persisted project + user (ensures stats have data)
        self.test_project, self.test_user, self.test_project_id = (
            await create_canned_project(self.db)
        )

    async def test_homepage_stats_returns_results(self):
        # Act
        stats = await StatsService.get_homepage_stats(abbrev=True, db=self.db)

        # Assert
        assert stats.mappers_online >= 0
        assert stats.tasks_mapped > 0
        assert stats.total_mappers > 0
