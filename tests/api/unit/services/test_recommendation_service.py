import pytest
import pandas as pd

from backend.models.postgis.project import ProjectStatus
from backend.services.recommendation_service import ProjectRecommendationService
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestProjectRecommendationService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"

        request.cls.db = db_connection_fixture
        request.cls.service = ProjectRecommendationService()

    async def create_project(self, is_published=True):
        test_project, test_user, project_id = await create_canned_project(self.db)
        if is_published:
            await self.db.execute(
                "UPDATE projects SET status = :status WHERE id = :id",
                {"status": ProjectStatus.PUBLISHED.value, "id": project_id},
            )
        return test_project, project_id

    async def get_all_published_projects(self):
        query = """
            SELECT p.id, p.default_locale, p.difficulty, p.mapping_types, p.country,
                COALESCE(ARRAY_AGG(pi.interest_id), ARRAY[]::INTEGER[]) AS categories
            FROM projects p
            LEFT JOIN (
                SELECT pi.project_id, i.id as interest_id
                FROM project_interests pi
                JOIN interests i ON pi.interest_id = i.id
            ) pi ON p.id = pi.project_id
            WHERE p.status = :status
            GROUP BY p.id
        """
        result = await self.db.fetch_all(
            query=query, values={"status": ProjectStatus.PUBLISHED.value}
        )
        return result

    async def test_get_all_published_projects_returns_published_projects(self):
        project1, project1_id = await self.create_project()
        project2, project2_id = await self.create_project()
        project3, project3_id = await self.create_project(is_published=False)

        projects = await self.get_all_published_projects()

        assert len(projects) == 2
        assert projects[0].id == project1_id
        assert projects[1].id == project2_id

    async def test_get_all_published_projects_returns_empty_list_when_no_published_projects(
        self,
    ):
        await self.create_project(is_published=False)
        projects = await self.get_all_published_projects()
        assert projects == []

    async def test_get_all_published_projects_only_returns_required_fields_for_recommendation(
        self,
    ):
        project, project_id = await self.create_project()
        projects = await self.get_all_published_projects()

        assert len(projects) == 1

        result = projects[0]
        assert result.id == project_id
        assert result.mapping_types == project.mapping_types
        assert result.default_locale == project.default_locale
        assert result.difficulty == project.difficulty
        assert result.country == project.country
        assert len(result) == 6

    async def test_mlb_transform_adds_new_transformed_columns(self):
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": [["building", "waterway"], ["building", "road"]],
            }
        )

        transformed_df = self.service.mlb_transform(
            test_df, "mapping_types", "mapping_types_"
        )

        assert transformed_df.shape == (2, 4)
        assert transformed_df["mapping_types_building"].tolist() == [1, 1]
        assert transformed_df["mapping_types_waterway"].tolist() == [1, 0]
        assert transformed_df["mapping_types_road"].tolist() == [0, 1]

    async def test_mlb_transform_adds_new_transformed_columns_when_column_is_empty(
        self,
    ):
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": [[], []],
            }
        )

        transformed_df = self.service.mlb_transform(
            test_df, "mapping_types", "mapping_types_"
        )

        assert transformed_df.shape == (2, 1)
        assert transformed_df["id"].tolist() == [1, 2]

    async def test_one_hot_encoding_adds_new_transformed_columns(self):
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": ["building", "waterway"],
            }
        )

        transformed_df = self.service.one_hot_encoding(test_df, ["mapping_types"])

        assert transformed_df.shape == (2, 3)
        assert transformed_df["mapping_types_building"].tolist() == [1, 0]
        assert transformed_df["mapping_types_waterway"].tolist() == [0, 1]

    async def test_one_hot_encoding_adds_new_transformed_columns_when_column_is_empty(
        self,
    ):
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": [None, None],
            }
        )

        transformed_df = self.service.one_hot_encoding(test_df, ["mapping_types"])

        assert transformed_df.shape == (2, 1)
        assert transformed_df["id"].tolist() == [1, 2]
