import os
import unittest
from server import create_app
from server.services.project_service import ProjectService
from server.models.postgis.utils import NotFound
from tests.server.helpers.test_helpers import create_canned_project


class TestFeaturedProjectService(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv("CI", "false")

        # Firewall rules mean we can't hit Postgres from CI so we have to skip them in the CI build
        if env == "true":
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

    def test_featured_projects_service(self):
        if self.skip_tests:
            return

        # Featured a not created project.
        with self.assertRaises(NotFound):
            ProjectService.set_project_as_featured(project_id=100)

        # Feature an already created project.
        ProjectService.set_project_as_featured(project_id=self.test_project.id)

        # List all featured projects.
        featured_projects = ProjectService.get_featured_projects(None)
        self.assertEqual(len(featured_projects.results), 1)

        # Unfeature project.
        ProjectService.unset_project_as_featured(project_id=self.test_project.id)
        # List all featured projects.
        featured_projects = ProjectService.get_featured_projects(None)
        self.assertEqual(len(featured_projects.results), 0)
