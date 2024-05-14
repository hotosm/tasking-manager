import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
from sqlalchemy.orm import joinedload
from sqlalchemy.sql.expression import func
from cachetools import TTLCache, cached

from backend import db
from backend.exceptions import NotFound
from backend.models.postgis.project import Project, Interest, project_interests
from backend.models.postgis.statuses import ProjectStatus
from backend.models.dtos.project_dto import ProjectSearchResultsDTO
from backend.services.project_search_service import ProjectSearchService
from backend.services.users.user_service import UserService

similar_projects_cache = TTLCache(maxsize=1000, ttl=60 * 60 * 24)  # 24 hours

project_columns = [
    "id",
    "default_locale",
    "difficulty",
    "mapping_types",
    "country",
    "categories",
]


class ProjectRecommendationService:
    @staticmethod
    def to_dataframe(records, columns: list):
        """Convert records fetched from sql execution into dataframe
        :param records: records fetched from sql execution
        :param columns: columns of the dataframe
        :return: dataframe
        """
        batch_rows = list()
        for _, row in enumerate(records, start=0):
            batch_rows.append(row)
        table = pd.DataFrame(batch_rows, columns=columns)
        return table

    @staticmethod
    def get_all_published_projects():
        """Gets all published projects
        :return: list of published projects
        """
        #  Create a subquery to fetch the interests of the projects
        subquery = (
            db.session.query(
                project_interests.c.project_id, Interest.id.label("interest_id")
            )
            .join(Interest)
            .subquery()
        )

        # Only fetch the columns required for recommendation
        # Should be in order of the columns defined in the project_columns line 13
        query = Project.query.options(joinedload(Project.interests)).with_entities(
            Project.id,
            Project.default_locale,
            Project.difficulty,
            Project.mapping_types,
            Project.country,
            func.array_agg(subquery.c.interest_id).label("interests"),
        )
        # Outerjoin so that projects without interests are also returned
        query = (
            query.outerjoin(subquery, Project.id == subquery.c.project_id)
            .filter(Project.status == ProjectStatus.PUBLISHED.value)
            .group_by(Project.id)
        )
        result = query.all()
        return result

    @staticmethod
    def mlb_transform(table, column, prefix):
        """Transforms multi label column into multiple columns and retruns the data frame with new columns
        :param table: data frame
        :param columns: columns to transform
        :param prefix: prefix for the new columns
        :return: None as it modifies the data frame in place
        """
        mlb = MultiLabelBinarizer()
        mlb.fit(table[column])
        mlb_table = pd.DataFrame(mlb.transform(table[column]), columns=mlb.classes_)
        mlb_table = mlb_table.add_prefix(prefix)
        table = pd.concat([table, mlb_table], axis=1)
        table = table.drop(column, axis=1)
        return table

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
        Builds encoded data frame as all the columns are not in the same scale/format
        and some are multi label columns
        :param table: data frame
        :return: encoded data frame
        """
        # Columns to be one hot encoded as they are categorical columns
        one_hot_columns = [
            "default_locale",
            "difficulty",
            "country",
        ]

        # Since country is saved as array in the database
        table["country"] = table["country"].apply(lambda x: x[0] if x else None)
        # Since some categories and mapping_types are set as [None] we need to replace it with []
        table["categories"] = table["categories"].apply(
            lambda x: [] if x == [None] else x
        )
        table["mapping_types"] = table["mapping_types"].apply(
            lambda x: [] if x is None else x
        )

        # One hot encoding for the columns
        table = ProjectRecommendationService.one_hot_encoding(table, one_hot_columns)

        # Convert multi label column mapping_types into multiple columns
        table = ProjectRecommendationService.mlb_transform(
            table, "mapping_types", "mapping_types_"
        )
        table = ProjectRecommendationService.mlb_transform(
            table, "categories", "categories_"
        )
        return table

    @staticmethod
    def get_similar_project_ids(all_projects_df, target_project_df):
        """Gets top n similar projects
        :param all_projects_df: data frame of all projects
        :param target_project_df: data frame of target project
        :return: list of similar project_ids
        """
        # Remove the target project from the all projects data frame
        all_projects_df = all_projects_df[
            all_projects_df["id"] != target_project_df["id"].values[0]
        ]

        # Get the cosine similarity matrix
        similarity_matrix = cosine_similarity(
            all_projects_df.drop("id", axis=1), target_project_df.drop("id", axis=1)
        )

        # Get the indices of the projects in the order of similarity
        similar_project_indices = similarity_matrix.flatten().argsort()[::-1]
        # Get the similar project ids in the order of similarity
        similar_projects = all_projects_df.iloc[similar_project_indices][
            "id"
        ].values.tolist()

        return similar_projects

    # This function is cached so that the matrix is not calculated every time
    # as it is expensive and not changing often
    @staticmethod
    @cached(cache=similar_projects_cache)
    def create_project_matrix(target_project=None):
        """Creates project matrix that is required to calculate the similarity
        :param target_project: target project id (not used).
        This is required to reset the cache when a new project is published
        :return: project matrix data frame with encoded columns
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
    def get_similar_projects(
        project_id, user_id=None, preferred_locale="en", limit=4
    ) -> ProjectSearchResultsDTO:
        """Get similar projects based on the given project ID.
        ----------------------------------------
        :param project_id: project id
        :param preferred_locale: preferred locale
        :return: list of similar projects in the order of similarity
        """
        target_project = Project.query.get(project_id)
        # Check if the project exists and is published
        project_is_published = (
            target_project and target_project.status == ProjectStatus.PUBLISHED.value
        )
        if not project_is_published:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        projects_df = ProjectRecommendationService.create_project_matrix()
        target_project_df = projects_df[projects_df["id"] == project_id]
        if target_project_df.empty:
            # If the target project is not in the projects_df then it means it is published
            # but not yet in the cache of create_project_matrix. So we need to update the cache.
            projects_df = ProjectRecommendationService.create_project_matrix(
                target_project=project_id
            )
            target_project_df = projects_df[projects_df["id"] == project_id]

        dto = ProjectSearchResultsDTO()
        # If there is only one project then return empty list as there is no other project to compare
        if projects_df.shape[0] < 2:
            return dto

        similar_projects = ProjectRecommendationService.get_similar_project_ids(
            projects_df, target_project_df
        )

        user = UserService.get_user_by_id(user_id) if user_id else None

        query = ProjectSearchService.create_search_query(user)
        # Only return projects which are not completed
        query = query.filter(
            Project.total_tasks != Project.tasks_validated + Project.tasks_bad_imagery
        )

        # Set the limit to the number of similar projects if it is less than the limit
        limit = min(limit, len(similar_projects)) if similar_projects else 0

        count = 0
        while len(dto.results) < limit:
            # In case the user is not authorized to view the project and similar projects are less than the limit
            # then we need to break the loop and return the results
            try:
                project_id = similar_projects[count]
            except IndexError:
                break
            project = query.filter(Project.id == project_id).all()
            if project:
                dto.results.append(
                    ProjectSearchService.create_result_dto(
                        project[0],
                        preferred_locale,
                        Project.get_project_total_contributions(project[0][0]),
                    )
                )
            count += 1
        return dto
