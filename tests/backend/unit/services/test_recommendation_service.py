import pandas as pd
from tests.backend.base import BaseTestCase
from backend.models.postgis.project import ProjectStatus
from backend.services.recommendation_service import ProjectRecommendationService
from tests.backend.helpers.test_helpers import create_canned_project


class TestProjectRecommendationService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.service = ProjectRecommendationService()

    def create_project(self, is_published=True):
        """Create a canned project"""
        project, _ = create_canned_project()
        project.status = (
            ProjectStatus.PUBLISHED.value if is_published else ProjectStatus.DRAFT.value
        )
        project.save()
        return project

    def test_to_dataframe_returns_records_into_dataframe(self):
        """Test that to_dataframe returns records into dataframe"""
        # Arrange
        records = [(1, 2, 3), (4, 5, 6)]
        colunms = ["a", "b", "c"]
        # Act
        df = self.service.to_dataframe(records, colunms)
        # Assert
        self.assertEqual(df.shape, (2, 3))
        self.assertEqual(df["a"].tolist(), [1, 4])
        self.assertEqual(df["b"].tolist(), [2, 5])
        self.assertEqual(df["c"].tolist(), [3, 6])

    def test_to_dataframe_returns_empty_dataframe_when_records_is_empty(self):
        """Test that to_dataframe returns empty dataframe when records is empty"""
        # Arrange
        records = []
        colunms = ["a", "b", "c"]
        # Act
        df = self.service.to_dataframe(records, colunms)
        # Assert
        self.assertEqual(df.shape, (0, 3))
        self.assertEqual(df["a"].tolist(), [])
        self.assertEqual(df["b"].tolist(), [])
        self.assertEqual(df["c"].tolist(), [])

    def test_get_all_published_projects_returns_published_projects(self):
        """Test that get_all_published_projects returns published projects"""
        # Arrange
        test_project_1 = self.create_project()
        test_project_2 = self.create_project()
        # Let's create a draft project to make sure it's not returned
        self.create_project(is_published=False)
        # Act
        projects = self.service.get_all_published_projects()
        # Assert
        self.assertEqual(len(projects), 2)
        self.assertEqual(projects[0].id, test_project_1.id)
        self.assertEqual(projects[1].id, test_project_2.id)

    def test_get_all_published_projects_returns_empty_list_when_no_published_projects(
        self,
    ):
        """Test that get_all_published_projects returns empty list when no published projects"""
        # Arrange
        # Let's create a draft project to make sure it's not returned
        self.create_project(is_published=False)
        # Act
        projects = self.service.get_all_published_projects()
        # Assert
        self.assertEqual(len(projects), 0)
        self.assertEqual(projects, [])

    def test_get_all_published_projects_only_returns_required_fields_for_recommendation(
        self,
    ):
        """Test that get_all_published_projects only returns required fields for recommendation"""
        # Arrange
        test_project = self.create_project()
        # Act
        projects = self.service.get_all_published_projects()
        # Assert
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0].id, test_project.id)
        self.assertEqual(projects[0].mapping_types, test_project.mapping_types)
        self.assertEqual(projects[0].default_locale, test_project.default_locale)
        self.assertEqual(projects[0].difficulty, test_project.difficulty)
        self.assertEqual(projects[0].country, test_project.country)
        self.assertIsInstance(projects[0].interests, list)
        self.assertEqual(len(projects[0]), 6)

    def test_mlb_transform_adds_new_transformed_columns(self):
        """Test that mlb_transform adds new transformed columns"""
        # Arrange
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": [
                    ["building", "waterway"],
                    ["building", "road"],
                ],
            }
        )
        # Act
        transformed_df = self.service.mlb_transform(
            test_df, "mapping_types", "mapping_types_"
        )
        # Assert
        self.assertEqual(transformed_df.shape, (2, 4))
        self.assertEqual(transformed_df["mapping_types_building"].tolist(), [1, 1])
        self.assertEqual(transformed_df["mapping_types_waterway"].tolist(), [1, 0])
        self.assertEqual(transformed_df["mapping_types_road"].tolist(), [0, 1])
        self.assertEqual(transformed_df["id"].tolist(), [1, 2])

    def test_mlb_transform_adds_new_transformed_columns_when_column_is_empty(self):
        """Test that mlb_transform adds new transformed columns when column is empty"""
        # Arrange
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": [
                    [],
                    [],
                ],
            }
        )
        # Act
        transformed_df = self.service.mlb_transform(
            test_df, "mapping_types", "mapping_types_"
        )
        # Assert
        self.assertEqual(transformed_df.shape, (2, 1))
        self.assertEqual(transformed_df["id"].tolist(), [1, 2])

    def test_one_hot_encoding_adds_new_transformed_columns(self):
        """Test that one_hot_encoding adds new transformed columns"""
        # Arrange
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": [
                    "building",
                    "waterway",
                ],
            }
        )
        # Act
        transformed_df = self.service.one_hot_encoding(test_df, ["mapping_types"])
        # Assert
        self.assertEqual(transformed_df.shape, (2, 3))
        self.assertEqual(transformed_df["mapping_types_building"].tolist(), [1, 0])
        self.assertEqual(transformed_df["mapping_types_waterway"].tolist(), [0, 1])
        self.assertEqual(transformed_df["id"].tolist(), [1, 2])

    def test_one_hot_encoding_adds_new_transformed_columns_when_column_is_empty(self):
        """Test that one_hot_encoding adds new transformed columns when column is empty"""
        # Arrange
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "mapping_types": [
                    None,
                    None,
                ],
            }
        )
        # Act
        transformed_df = self.service.one_hot_encoding(test_df, ["mapping_types"])
        # Assert
        self.assertEqual(transformed_df.shape, (2, 1))
        self.assertEqual(transformed_df["id"].tolist(), [1, 2])
