import pytest
from unittest.mock import patch, AsyncMock

from backend.models.postgis.statuses import ProjectStatus, UserRole
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService, ProjectServiceError
from backend.services.team_service import TeamService
from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)


@pytest.mark.anyio
class TestProjectService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # persisted project + author
        self.test_project, self.project_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        # create a mapper user (persisted)
        test_mapper = await return_canned_user(
            username="Test Mapper", id=11111, db=self.db
        )
        self.test_mapper = await create_canned_user(self.db, test_mapper)

    async def test_get_project_dto_for_mapper_returns_project_dto(self):
        # Arrange: mark project published

        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        # Act
        project_dto = await ProjectService.get_project_dto_for_mapper(
            self.test_project_id, self.test_mapper.id, db=self.db
        )

        # Assert
        assert project_dto is not None

    async def test_get_project_dto_for_mapper_raises_error_if_draft_project(self):
        # Project is draft by default from canned project creation
        with pytest.raises(ProjectServiceError):
            await ProjectService.get_project_dto_for_mapper(
                self.test_project_id, self.test_mapper.id, db=self.db
            )

    async def test_get_project_dto_for_mapper_returns_none_if_private_project(self):
        # Arrange: publish then mark private

        await self.db.execute(
            "UPDATE projects SET status = :status, private = true WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )

        # Act
        project_dto = await ProjectService.get_project_dto_for_mapper(
            self.test_project_id, self.test_mapper.id, db=self.db
        )

        # Assert
        assert project_dto is None

    async def test_get_project_dto_for_mapper_returns_private_and_draft_project_dto_for_admin(
        self,
    ):
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": int(self.test_mapper.id)},
        )

        await self.db.execute(
            "UPDATE projects SET private = :private WHERE id = :id",
            {"private": True, "id": int(self.test_project_id)},
        )
        # Act
        project_dto = await ProjectService.get_project_dto_for_mapper(
            self.test_project_id, self.test_mapper.id, db=self.db
        )

        # Assert
        assert project_dto is not None

    @patch.object(
        ProjectAdminService,
        "is_user_action_permitted_on_project",
        new_callable=AsyncMock,
    )
    async def test_get_project_dto_for_mapper_returns_private_and_draft_project_dto_for_managers(
        self, mock_is_user_manager
    ):
        # Arrange
        await self.db.execute(
            "UPDATE projects SET private = :private WHERE id = :id",
            {"private": True, "id": int(self.test_project_id)},
        )

        mock_is_user_manager.return_value = True

        # Act
        project_dto = await ProjectService.get_project_dto_for_mapper(
            self.test_project_id, self.test_mapper.id, db=self.db
        )

        # Assert
        assert project_dto is not None

    @patch.object(TeamService, "check_team_membership", new_callable=AsyncMock)
    async def test_get_project_dto_for_mapper_returns_private_project_dto_for_project_team_member(
        self, mock_is_team_member
    ):

        await self.db.execute(
            "UPDATE projects SET status = :status, private = true WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )

        mock_is_team_member.return_value = True

        # Act
        project_dto = await ProjectService.get_project_dto_for_mapper(
            self.test_project_id, self.test_mapper.id, db=self.db
        )

        # Assert
        assert project_dto is not None
