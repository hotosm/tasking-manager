import pytest

from backend.exceptions import NotFound
from backend.services.project_service import ProjectService
from backend.services.users.user_service import UserService
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestFavoriteService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create a persisted canned project + user in the test DB
        # create_canned_project should return (project, user, project_id)
        self.test_project, self.test_user, self.test_project_id = (
            await create_canned_project(self.db)
        )

    async def test_project_favorite_flow(self):
        # Validate that project has not been favorited by user.
        fav = await ProjectService.is_favorited(
            self.test_project_id, self.test_user.id, self.db
        )
        assert not fav

        # Get project favorites from user.
        favorites = await UserService.get_projects_favorited(self.test_user.id, self.db)
        assert len(favorites.favorited_projects) == 0

        # Now favorite a new project.
        await ProjectService.favorite(self.test_project_id, self.test_user.id, self.db)
        fav = await ProjectService.is_favorited(
            self.test_project_id, self.test_user.id, self.db
        )
        assert fav

        # Get project favorites from user.
        favorites = await UserService.get_projects_favorited(self.test_user.id, self.db)
        assert len(favorites.favorited_projects) == 1

        # Now unfavorite it.
        await ProjectService.unfavorite(
            self.test_project_id, self.test_user.id, self.db
        )
        fav = await ProjectService.is_favorited(
            self.test_project_id, self.test_user.id, self.db
        )
        assert not fav

        # Unfavorite a project not been favorited previously -> ValueError
        with pytest.raises(ValueError):
            await ProjectService.unfavorite(
                self.test_project_id, self.test_user.id, self.db
            )

        # Verify that NotFound is raised for a non-existent project id.
        non_existent_project_id = 100
        with pytest.raises(NotFound):
            await ProjectService.is_favorited(
                non_existent_project_id, self.test_user.id, self.db
            )

        with pytest.raises(NotFound):
            await ProjectService.favorite(
                non_existent_project_id, self.test_user.id, self.db
            )

        with pytest.raises(NotFound):
            await ProjectService.unfavorite(
                non_existent_project_id, self.test_user.id, self.db
            )
