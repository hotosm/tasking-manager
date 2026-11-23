import pandas as pd

from backend.services.recommendation_service import ProjectRecommendationService


class TestProjectRecommendationService:
    def setup_method(self):
        self.service = ProjectRecommendationService()

    def test_mlb_transform_adds_new_transformed_columns(self):
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
        assert transformed_df["id"].tolist() == [1, 2]

    def test_mlb_transform_adds_new_transformed_columns_when_column_is_empty(self):
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

    def test_one_hot_encoding_adds_new_transformed_columns(self):
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
        assert transformed_df["id"].tolist() == [1, 2]

    def test_one_hot_encoding_adds_new_transformed_columns_when_column_is_empty(
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

    def test_build_encoded_data_frame_returns_encoded_data_frame(self):
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "default_locale": ["en", "ne"],
                "difficulty": [1, 2],
                "country": [["England"], ["Nepal"]],
                "mapping_types": [[1, 2], [2, 3]],
                "categories": [[1, 2], [2, 3]],
            }
        )

        encoded_df = self.service.build_encoded_data_frame(test_df)

        # default_locale, difficulty and country are one-hot encoded (2 values each),
        # mapping_types and categories are multi-hot encoded (3 values each), plus id.
        assert encoded_df.shape == (2, 13)
        assert encoded_df["id"].tolist() == [1, 2]
        assert encoded_df["default_locale_en"].tolist() == [1, 0]
        assert encoded_df["default_locale_ne"].tolist() == [0, 1]
        assert encoded_df["difficulty_1"].tolist() == [1, 0]
        assert encoded_df["difficulty_2"].tolist() == [0, 1]
        assert encoded_df["country_England"].tolist() == [1, 0]
        assert encoded_df["country_Nepal"].tolist() == [0, 1]
        assert encoded_df["mapping_types_1"].tolist() == [1, 0]
        assert encoded_df["mapping_types_2"].tolist() == [1, 1]
        assert encoded_df["mapping_types_3"].tolist() == [0, 1]
        assert encoded_df["categories_1"].tolist() == [1, 0]
        assert encoded_df["categories_2"].tolist() == [1, 1]
        assert encoded_df["categories_3"].tolist() == [0, 1]

    def test_build_encoded_data_frame_treats_missing_values_as_empty(self):
        test_df = pd.DataFrame(
            {
                "id": [1, 2],
                "default_locale": ["en", "en"],
                "difficulty": [1, 1],
                "country": [None, ["Nepal"]],
                "mapping_types": [None, [1]],
                "categories": [[None], [1]],
            }
        )

        encoded_df = self.service.build_encoded_data_frame(test_df)

        assert encoded_df["country_Nepal"].tolist() == [0, 1]
        assert encoded_df["mapping_types_1"].tolist() == [0, 1]
        assert encoded_df["categories_1"].tolist() == [0, 1]

    def test_get_similar_project_ids_returns_similar_project_ids(self):
        test_df = pd.DataFrame(
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
        encoded_df = self.service.build_encoded_data_frame(test_df)

        similar_project_ids = self.service.get_similar_project_ids(
            encoded_df, encoded_df[encoded_df["id"] == 1]
        )

        # Project 2 is identical to project 1, project 3 shares four features,
        # project 5 three and project 4 two. Project 1 itself is excluded.
        assert similar_project_ids == [2, 3, 5, 4]
