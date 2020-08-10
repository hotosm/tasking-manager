from backend.services.stats_service import StatsService
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project


class TestStatsService(BaseTestCase):
    def setUp(self):
        super().setUp()

        self.test_project, self.test_user = create_canned_project()

    def test_homepage_stats_returns_results(self):
        # Act
        stats = StatsService.get_homepage_stats()

        # Assert
        self.assertGreaterEqual(stats.mappers_online, 0)
        self.assertGreater(stats.tasks_mapped, 0)
        self.assertGreater(stats.total_mappers, 0)
