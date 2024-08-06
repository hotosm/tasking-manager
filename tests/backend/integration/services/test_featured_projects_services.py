from backend.exceptions import NotFound
from backend.services.project_service import ProjectService

from tests.backend.helpers.test_helpers import create_canned_project
from tests.backend.base import BaseTestCase


class TestFeaturedProjectService(BaseTestCase):
    def test_featured_projects_service(self):
        self.test_project, self.test_user = create_canned_project()

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
