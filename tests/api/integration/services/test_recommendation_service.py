from unittest.mock import patch

import pytest

from backend.models.postgis.statuses import ProjectStatus
from backend.services.recommendation_service import ProjectRecommendationService
from tests.api.helpers.test_helpers import create_canned_interest, create_canned_project


@pytest.mark.anyio
class TestProjectRecommendationService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        # create_project_matrix is cached under a key that ignores the db
        # argument, so clear it to keep matrices from leaking between tests.
        matrix_cache = ProjectRecommendationService.create_project_matrix.cache
        await matrix_cache.clear()
        yield
        await matrix_cache.clear()

    async def create_project(
        self,
        status=ProjectStatus.PUBLISHED,
        default_locale="en",
        difficulty=1,
        country=None,
        mapping_types=None,
        interest_ids=(),
    ) -> int:
        """Create a canned project with the columns used for recommendations"""
        _, _, project_id = await create_canned_project(self.db)
        await self.db.execute(
            """
            UPDATE projects
            SET status = :status, default_locale = :default_locale,
                difficulty = :difficulty, country = :country,
                mapping_types = :mapping_types
            WHERE id = :id
            """,
            {
                "status": status.value,
                "default_locale": default_locale,
                "difficulty": difficulty,
                "country": country,
                "mapping_types": mapping_types,
                "id": project_id,
            },
        )
        for interest_id in interest_ids:
            await self.db.execute(
                """
                INSERT INTO project_interests (project_id, interest_id)
                VALUES (:project_id, :interest_id)
                """,
                {"project_id": project_id, "interest_id": interest_id},
            )
        return project_id

    async def test_create_project_matrix_returns_project_matrix(self):
        interest_1 = await create_canned_interest(self.db, 1001, "interest-1")
        interest_2 = await create_canned_interest(self.db, 1002, "interest-2")
        project_1 = await self.create_project(
            default_locale="en",
            difficulty=1,
            country=["England"],
            mapping_types=[1, 2],
            interest_ids=[interest_1.id, interest_2.id],
        )
        project_2 = await self.create_project(
            default_locale="ne",
            difficulty=2,
            country=["Nepal"],
            mapping_types=[2],
            interest_ids=[interest_2.id],
        )
        await self.create_project(status=ProjectStatus.DRAFT)

        project_matrix = await ProjectRecommendationService.create_project_matrix(
            self.db
        )

        project_matrix = project_matrix.sort_values("id").reset_index(drop=True)
        # The draft project is not part of the matrix
        assert project_matrix["id"].tolist() == [project_1, project_2]
        # default_locale, difficulty and country are one-hot encoded (2 values each),
        # mapping_types and categories are multi-hot encoded (2 values each).
        expected_columns = {
            "default_locale_en": [1, 0],
            "default_locale_ne": [0, 1],
            "difficulty_1": [1, 0],
            "difficulty_2": [0, 1],
            "country_England": [1, 0],
            "country_Nepal": [0, 1],
            "mapping_types_1": [1, 0],
            "mapping_types_2": [1, 1],
            f"categories_{interest_1.id}": [1, 0],
            f"categories_{interest_2.id}": [1, 1],
        }
        # Only the recommendation features (and the id) are used
        assert sorted(project_matrix.columns) == sorted(["id", *expected_columns])
        assert (
            project_matrix[list(expected_columns)].astype(int).to_dict("list")
            == expected_columns
        )

    async def test_create_project_matrix_returns_empty_matrix_when_no_published_projects(
        self,
    ):
        await self.create_project(status=ProjectStatus.DRAFT)

        project_matrix = await ProjectRecommendationService.create_project_matrix(
            self.db
        )

        assert project_matrix.empty

    @patch.object(ProjectRecommendationService, "get_similar_project_ids")
    async def test_get_similar_projects_returns_similar_projects(
        self, mock_get_similar_project_ids
    ):
        project_1 = await self.create_project()
        project_2 = await self.create_project()
        project_3 = await self.create_project()
        # Rank project_3 above project_2 so the result order can only come
        # from the similarity ranking, not from project ids.
        mock_get_similar_project_ids.return_value = [project_3, project_2]

        similar_projects = await ProjectRecommendationService.get_similar_projects(
            self.db, project_1
        )

        assert [result.project_id for result in similar_projects.results] == [
            project_3,
            project_2,
        ]
