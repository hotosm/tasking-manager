import pytest
from backend.models.dtos.project_dto import ProjectSearchDTO
from backend.models.postgis.statuses import ProjectDifficulty, ProjectStatus
from backend.services.project_search_service import ProjectSearchService
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestProjectService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"

        request.cls.db = db_connection_fixture
        (
            request.cls.test_project,
            request.cls.test_user,
            request.cls.project_id,
        ) = await create_canned_project(db_connection_fixture)

        # Update test project properties
        await db_connection_fixture.execute(
            """
            UPDATE projects SET difficulty = :difficulty, status = :status WHERE id = :id
            """,
            {
                "difficulty": ProjectDifficulty.EASY.value,
                "status": ProjectStatus.PUBLISHED.value,
                "id": self.project_id,
            },
        )

    async def test_project_search_returns_results(self):
        # Arrange
        search_dto = ProjectSearchDTO(
            difficulty="EASY",
            project_statuses=["PUBLISHED"],
            order_by="priority",
            order_by_type="DESC",
            page=1,
        )

        # Act
        project_search_dto = await ProjectSearchService.search_projects(
            search_dto, self.test_user, self.db
        )

        # Assert
        assert project_search_dto is not None
        assert len(project_search_dto.results) > 0
        assert any(p.project_id == self.project_id for p in project_search_dto.results)

    async def test_projects_can_be_searched_without_account_map(self):
        # Arrange
        search_dto = ProjectSearchDTO(
            difficulty="EASY",
            project_statuses=["PUBLISHED"],
            order_by="priority",
            order_by_type="DESC",
            action="validate",
            page=1,
        )

        # Act
        project_search_dto = await ProjectSearchService.search_projects(
            search_dto, None, self.db
        )

        # Assert
        assert project_search_dto is not None
        assert len(project_search_dto.results) > 0
        assert any(p.project_id == self.project_id for p in project_search_dto.results)

    async def test_projects_can_be_searched_without_account_validate(self):
        # Arrange
        search_dto = ProjectSearchDTO(
            difficulty="EASY",
            project_statuses=["PUBLISHED"],
            order_by="priority",
            order_by_type="DESC",
            action="validate",
            page=1,
        )

        # Act
        project_search_dto = await ProjectSearchService.search_projects(
            search_dto, None, self.db
        )

        # Assert
        assert project_search_dto is not None
        assert len(project_search_dto.results) > 0
        assert any(p.project_id == self.project_id for p in project_search_dto.results)
