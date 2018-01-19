import os
import unittest
from server import create_app
from server.services.stats_service import StatsService
from tests.server.helpers.test_helpers import create_canned_project


class TestStatsService(unittest.TestCase):

    skip_tests = False
    ctx = None  # Stores the app context for duration of tests

    @classmethod
    def setUpClass(cls):
        env = os.getenv('CI', 'false')

        # Firewall rules mean we can't hit Postgres from CI so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

        cls.app = create_app()
        cls.ctx = cls.app.app_context()
        cls.ctx.push()

    @classmethod
    def tearDownClass(cls):
        if cls.skip_tests:
            return

        cls.ctx.pop()

    def test_homepage_stats_returns_results(self):
        if self.skip_tests:
            return

        # Arrange
        test_project, test_user = create_canned_project()

        # Act
        stats = StatsService.get_homepage_stats()

        # Assert
        self.assertGreater(stats.mappers_online, 0)
        self.assertGreater(stats.tasks_mapped, 0)
        self.assertGreater(stats.total_mappers, 0)

        # Tidy up
        test_project.delete()
        test_user.delete()
