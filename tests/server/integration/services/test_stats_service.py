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

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.test_project, self.test_user = create_canned_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.test_user.delete()
        self.ctx.pop()

    def test_homepage_stats_returns_results(self):
        if self.skip_tests:
            return

        # Act
        stats = StatsService.get_homepage_stats()

        # Assert
        self.assertGreaterEqual(stats.mappers_online, 0)
        self.assertGreater(stats.tasks_mapped, 0)
        self.assertGreater(stats.total_mappers, 0)

