import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer

from backend.models.postgis.project import Project
from backend.models.postgis.statuses import ProjectStatus
from backend.models.dtos.project_dto import ProjectSearchResultsDTO
from backend.services.project_search_service import ProjectSearchService

project_columns = [
    "id",
    "priority",
    "default_locale",
    "difficulty",
    "mapping_types",
    "organisation_id",
    "country",
    "mapping_permission",
    "validation_permission",
]


class ProjectRecommendationService:
    @staticmethod
    def to_dataframe(records, columns):
        """Convert records fetched from sql execution into dataframe
        :param records: records fetched from sql execution
        :param columns: columns of the dataframe
        :return: dataframe
        """
        batch_rows = list()
        for i, row in enumerate(records, start=0):
            batch_rows.append(row)
        table = pd.DataFrame(batch_rows, columns=columns)
        return table

    @staticmethod
    def get_all_published_projects():
        """Gets all published projects
        :return: list of published projects
        """
        # Only fetch the columns required for recommendation
        #  Should be in order of the columns in the project_columns line 16
        return (
            Project.query.with_entities(
                Project.id,
                Project.priority,
                Project.default_locale,
                Project.difficulty,
                Project.mapping_types,
                Project.organisation_id,
                Project.country,
                Project.mapping_permission,
                Project.validation_permission,
            )
            .filter(Project.status == ProjectStatus.PUBLISHED.value)
            .all()
        )

    @staticmethod
    def mlb_transform(table, column, prefix):
        """Transforms multi label column into multiple columns and retruns the data frame with new columns
        :param table: data frame
        :param columns: columns to transform
        :param prefix: prefix for the new columns
        :return: transformed data frame
        """
        mlb = MultiLabelBinarizer()
        table.join(
            pd.DataFrame(
                mlb.fit_transform(table.pop(column)),
                columns=mlb.classes_,
                index=table.index,
            ).add_prefix(prefix),
        )

    @staticmethod
    def one_hot_encoding(table, columns):
        """One hot encoding
        :param table: data frame
        :param columns: columns to encode
        :return: provided data frame with encoded columns
        """
        for column in columns:
            table = pd.concat(
                [table, pd.get_dummies(table[column], prefix=column)], axis=1
            )
            table = table.drop(column, axis=1)
        return table

    @staticmethod
    def build_encoded_data_frame(table):
        """
        Builds encoded data frame as all the columns are not in the same scale
        and some are multi label columns
        :param table: data frame
        :return: encoded data frame
        """
        one_hot_columns = [
            "country",
            "default_locale",
        ]
        # Since country is saved as array in the database
        table["country"] = table["country"].apply(lambda x: x[0])
        # One hot encoding for the columns
        table = ProjectRecommendationService.one_hot_encoding(table, one_hot_columns)
        # Convert multi label column mapping_types into multiple columns
        ProjectRecommendationService.mlb_transform(
            table, "mapping_types", "mapping_types_"
        )
        return table

    @staticmethod
    def get_top_n_similar_projects(all_projects_df, target_project_df, n=5):
        """Gets top n similar projects
        :param all_projects_df: data frame of all projects
        :param target_project_df: data frame of target project
        :param n: number of similar projects to fetch
        :return: list of similar projects
        """
        # Remove the target project from the all projects data frame
        all_projects_df = all_projects_df[
            all_projects_df["id"] != target_project_df["id"].values[0]
        ]
        # Get the cosine similarity matrix
        similarity_matrix = cosine_similarity(
            all_projects_df.drop("id", axis=1), target_project_df.drop("id", axis=1)
        )
        # Get the indices of top n similar projects
        similar_project_indices = similarity_matrix.argsort().flatten()[-n:]
        # Get the top n similar projects
        similar_projects = all_projects_df.iloc[similar_project_indices][
            "id"
        ].values.tolist()
        return similar_projects

    @staticmethod
    def create_project_matrix():
        """Creates project matrix
        :return: project matrix
        """
        all_projects = ProjectRecommendationService.get_all_published_projects()
        all_projects_df = ProjectRecommendationService.to_dataframe(
            all_projects, project_columns
        )
        all_projects_df = ProjectRecommendationService.build_encoded_data_frame(
            all_projects_df
        )
        return all_projects_df

    @staticmethod
    def get_related_projects(project_id, preferred_locale):
        """Gets related projects
        :param project_id: project id
        :param preferred_locale: preferred locale
        :return: list of related projects
        """
        projects_df = ProjectRecommendationService.create_project_matrix()
        target_project_df = projects_df[projects_df["id"] == project_id]
        related_projects = ProjectRecommendationService.get_top_n_similar_projects(
            projects_df, target_project_df
        )

        dto = ProjectSearchResultsDTO()

        query = ProjectSearchService.create_search_query()
        related_projects = query.filter(Project.id.in_(related_projects)).all()
        dto.results = [
            ProjectSearchService.create_result_dto(
                p,
                preferred_locale,
                Project.get_project_total_contributions(p[0]),
            )
            for p in related_projects
        ]

        return dto
