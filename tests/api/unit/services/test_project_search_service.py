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

    async def test_default_sort_order_places_featured_between_urgent_and_high(self):
        """
        Issue #6704: When no order_by is specified, projects should be sorted as:
        Urgent (priority=0) > Featured > High (priority=1) > Medium (priority=2) > Low.
        """
        # Arrange: create 3 more canned projects so we have 4 total covering each tier
        _, _, urgent_id = await create_canned_project(self.db, name="urgent_proj")
        _, _, featured_id = await create_canned_project(self.db, name="featured_proj")
        _, _, high_id = await create_canned_project(self.db, name="high_proj")
        # The original self.project_id will be our MEDIUM tier project

        # Set priority/featured/status for each project to define the test scenario
        configs = [
            (urgent_id, 0, False),  # URGENT (priority=0)
            (featured_id, 1, True),  # FEATURED (high priority, but featured=TRUE)
            (high_id, 1, False),  # HIGH (priority=1)
            (self.project_id, 2, False),  # MEDIUM (priority=2)
        ]
        for pid, priority, featured in configs:
            await self.db.execute(
                """
                UPDATE projects
                SET priority = :priority, featured = :featured, status = :status
                WHERE id = :id
                """,
                {
                    "priority": priority,
                    "featured": featured,
                    "status": ProjectStatus.PUBLISHED.value,
                    "id": pid,
                },
            )

        # Act: search with no explicit order_by (default sort path)
        search_dto = ProjectSearchDTO(project_statuses=["PUBLISHED"], page=1)
        result = await ProjectSearchService.search_projects(search_dto, None, self.db)

        # Assert: extract the order of just our 4 seeded projects
        seeded = {urgent_id, featured_id, high_id, self.project_id}
        observed = [p.project_id for p in result.results if p.project_id in seeded]
        expected = [urgent_id, featured_id, high_id, self.project_id]
        assert observed == expected, (
            f"Expected default sort Urgent>Featured>High>Medium "
            f"({expected}), but got {observed}"
        )
