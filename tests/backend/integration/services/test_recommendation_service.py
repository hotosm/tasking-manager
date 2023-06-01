import pandas as pd
from unittest.mock import patch

from backend.models.postgis.project import ProjectStatus
from tests.backend.base import BaseTestCase
from backend.services.recommendation_service import ProjectRecommendationService
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    create_canned_interest,
    update_project_with_info,
)


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

    def test_build_encoded_data_frame_returns_encoded_data_frame(self):
        """Test that build_encoded_data_frame returns encoded data frame"""
        # Arrange
        df = pd.DataFrame(
            {
                "id": [1, 2],
                "default_locale": ["en", "ne"],
                "difficulty": [1, 2],
                "country": [["England"], ["Nepal"]],
                "mapping_types": [[1, 2], [2, 3]],
                "categories": [[1, 2], [2, 3]],
            }
        )
        # Since default_locale, difficulty, and country are one-hot encoded with each having 2 unique values,
        # and mapping_types and categories are multi-hot encoded with each having 3 unique values,
        # the resulting data frame should have 13 columns (2 + 2 + 2 + 3 + 3) + 1 -> the id column
        # Act
        df = self.service.build_encoded_data_frame(df)
        # Assert
        self.assertEqual(df.shape, (2, 13))
        self.assertEqual(df["id"].tolist(), [1, 2])
        self.assertEqual(df["default_locale_en"].tolist(), [1, 0])
        self.assertEqual(df["default_locale_ne"].tolist(), [0, 1])
        self.assertEqual(df["difficulty_1"].tolist(), [1, 0])
        self.assertEqual(df["difficulty_2"].tolist(), [0, 1])
        self.assertEqual(df["country_England"].tolist(), [1, 0])
        self.assertEqual(df["country_Nepal"].tolist(), [0, 1])
        self.assertEqual(df["mapping_types_1"].tolist(), [1, 0])
        self.assertEqual(df["mapping_types_2"].tolist(), [1, 1])
        self.assertEqual(df["mapping_types_3"].tolist(), [0, 1])
        self.assertEqual(df["categories_1"].tolist(), [1, 0])
        self.assertEqual(df["categories_2"].tolist(), [1, 1])
        self.assertEqual(df["categories_3"].tolist(), [0, 1])

    def test_get_similar_project_ids_returns_similar_project_ids(self):
        """Test that get_similar_project_ids returns similar project ids"""
        # Arrange
        df = pd.DataFrame(
            {
                "id": [1, 2, 3, 4, 5],
                "default_locale": ["en", "en", "ne", "ne", "ne"],
                "difficulty": [1, 1, 1, 2, 2],
                "country": [
                    ["England"],
                    ["England"],
                    ["Nepal"],
                    ["Nepal"],
                    ["England"],
                ],
                "mapping_types": [[1, 2], [1, 2], [1, 2], [2, 3], [2, 3]],
                "categories": [[1, 2], [1, 2], [2, 3], [2, 3], [2, 3]],
            }
        )
        df = self.service.build_encoded_data_frame(df)
        # Act
        similar_project_ids = self.service.get_similar_project_ids(
            df, df[df["id"] == 1]
        )
        # Assert
        self.assertEqual(
            similar_project_ids[0], 2
        )  # project id 2 is the most similar to project id 1
        self.assertEqual(
            similar_project_ids[1], 3
        )  # project id 1 is the second most similar to project id 1
        self.assertEqual(
            similar_project_ids[2], 5
        )  # project id 5 is the third most similar to project id 1

    @staticmethod
    def set_project_columns(project, **kwargs):
        """Set project columns"""
        for key, value in kwargs.items():
            setattr(project, key, value)
        project.save()

    def test_create_project_matrix_returns_project_matrix(self):
        """Test that create_project_matrix returns project matrix"""
        # Arrange
        test_interest_1 = create_canned_interest("test-interest-1")
        test_interest_2 = create_canned_interest("test-interest-2")

        project_1 = self.create_project()
        project_2 = self.create_project()
        self.create_project(is_published=False)  # project_3
        TestProjectRecommendationService.set_project_columns(
            project_1,
            default_locale="en",
            difficulty=1,
            country=["England"],
            mapping_types=[1, 2],
            interests=[test_interest_1, test_interest_2],
        )
        TestProjectRecommendationService.set_project_columns(
            project_2,
            default_locale="ne",
            difficulty=2,
            country=["Nepal"],
            mapping_types=[2],
            interests=[test_interest_2],
        )
        # Act
        project_matrix = self.service.create_project_matrix(project_1.id)
        # Assert
        # Since default_locale, difficulty, and country are one-hot encoded with each having 2 unique values,
        # and mapping_types and categories are multi-hot encoded with each having 2 unique values,
        # the resulting data frame should have 11 columns (2 + 2 + 2 + 2 + 2) + 1 -> the id column
        self.assertEqual(project_matrix.shape, (2, 11))
        # Since project_3 is not published, it should not be included in the project matrix
        self.assertEqual(project_matrix["id"].tolist(), [project_1.id, project_2.id])
        self.assertEqual(project_matrix["default_locale_en"].tolist(), [1, 0])
        self.assertEqual(project_matrix["default_locale_ne"].tolist(), [0, 1])
        self.assertEqual(project_matrix["difficulty_1"].tolist(), [1, 0])
        self.assertEqual(project_matrix["difficulty_2"].tolist(), [0, 1])
        self.assertEqual(project_matrix["country_England"].tolist(), [1, 0])
        self.assertEqual(project_matrix["country_Nepal"].tolist(), [0, 1])
        self.assertEqual(project_matrix["mapping_types_1"].tolist(), [1, 0])
        self.assertEqual(project_matrix["mapping_types_2"].tolist(), [1, 1])
        self.assertEqual(project_matrix["categories_1"].tolist(), [1, 0])
        self.assertEqual(project_matrix["categories_2"].tolist(), [1, 1])

    @patch.object(ProjectRecommendationService, "get_similar_project_ids")
    def test_get_similar_projects_returns_similar_projects(
        self, mock_get_similar_project_ids
    ):
        """Test that get_similar_projects returns similar projects"""
        # Arrange
        # Create test interests
        test_interest_1 = create_canned_interest("test-interest-1")
        test_interest_2 = create_canned_interest("test-interest-2")
        # Create test projects
        project_1 = self.create_project()
        project_2 = self.create_project()
        project_3 = self.create_project()
        # Create draft project so that it is not included in the similar projects
        self.create_project(is_published=False)

        # Since project_info is required to retrun project summary in the response
        update_project_with_info(project_1)
        update_project_with_info(project_2)
        update_project_with_info(project_3)

        # Set mock return value for get_similar_project_ids
        mock_get_similar_project_ids.return_value = [project_2.id, project_3.id]

        # Set different values for columns to be used in the project matrix for similarity calculation
        TestProjectRecommendationService.set_project_columns(
            project_1,
            default_locale="en",
            difficulty=1,
            country=["England"],
            mapping_types=[1, 2],
            interests=[test_interest_1, test_interest_2],
        )
        TestProjectRecommendationService.set_project_columns(
            project_2,
            default_locale="en",
            difficulty=1,
            country=["Nepal"],
            mapping_types=[2],
            interests=[test_interest_2],
        )
        TestProjectRecommendationService.set_project_columns(
            project_3,
            default_locale="en",
            difficulty=2,
            country=["Nepal"],
            mapping_types=[2],
            interests=[test_interest_2],
        )

        # Act
        similar_projects = self.service.get_similar_projects(project_1.id)
        # Assert
        self.assertEqual(len(similar_projects.results), 2)
        self.assertEqual(
            similar_projects.results[0].project_id, project_2.id
        )  # project_2 is the most similar to project_1
        self.assertEqual(similar_projects.results[1].project_id, project_3.id)
