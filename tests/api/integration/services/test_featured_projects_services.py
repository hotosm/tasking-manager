import pytest

from backend.exceptions import NotFound
from backend.services.project_service import ProjectService
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestFeaturedProjectService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create a persisted canned project + user in the test DB
        # create_canned_project should return (project, user, project_id)
        self.test_project, self.test_user, self.test_project_id = (
            await create_canned_project(self.db)
        )

    async def test_featured_projects_service(self):
        # Featured a not created project -> NotFound
        with pytest.raises(NotFound):
            await ProjectService.set_project_as_featured(project_id=100, db=self.db)

        # Feature an existing project.
        await ProjectService.set_project_as_featured(
            project_id=self.test_project_id, db=self.db
        )

        # List all featured projects.
        featured_projects = await ProjectService.get_featured_projects(None, self.db)
        assert len(featured_projects.results) == 1

        # Unfeature project.
        await ProjectService.unset_project_as_featured(
            project_id=self.test_project_id, db=self.db
        )

        # List all featured projects.
        featured_projects = await ProjectService.get_featured_projects(None, self.db)
        assert len(featured_projects.results) == 0
