import pandas as pd
from aiocache import Cache, cached
from cachetools import TTLCache
from databases import Database
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer

from backend.exceptions import NotFound
from backend.models.dtos.project_dto import ProjectSearchResultsDTO
from backend.models.postgis.project import Project
from backend.models.postgis.statuses import ProjectStatus
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

    def matrix_cache_key_builder(func, *args, **kwargs):
        # Remove the last two arguments
        args_without_db = args[:-1]
        return f"{func.__name__}:{args_without_db}:{kwargs}"

    # This function is cached so that the matrix is not calculated every time
    # as it is expensive and not changing often
    @staticmethod
    @cached(cache=Cache.MEMORY, key_builder=matrix_cache_key_builder, ttl=3600)
    async def create_project_matrix(db: Database) -> pd.DataFrame:
        """Creates project matrix required to calculate similarity."""
        # Query to fetch all published projects with their related data
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
        try:
            # Execute the query and fetch results
            result = await db.fetch_all(
                query=query, values={"status": ProjectStatus.PUBLISHED.value}
            )
            # Convert the result into a DataFrame
            df = pd.DataFrame([dict(row) for row in result])
            # Optionally encode categorical data
            df = ProjectRecommendationService.build_encoded_data_frame(df)
            return df

        except Exception as e:
            print(f"An error occurred: {e}")
            return pd.DataFrame()

    @staticmethod
    async def get_similar_projects(
        db: Database,
        project_id: int,
        user_id: str = None,
        preferred_locale: str = "en",
        limit: int = 4,
    ) -> ProjectSearchResultsDTO:
        """Get similar projects based on the given project ID."""

        # Fetch the target project details
        target_project_query = "SELECT * FROM projects WHERE id = :project_id"
        target_project = await db.fetch_one(
            query=target_project_query, values={"project_id": project_id}
        )

        if (
            not target_project
            or target_project["status"] != ProjectStatus.PUBLISHED.value
        ):
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        # Create the project similarity matrix
        projects_df = await ProjectRecommendationService.create_project_matrix(db)
        target_project_df = projects_df[projects_df["id"] == project_id]

        if target_project_df.empty:
            projects_df = await ProjectRecommendationService.create_project_matrix(
                db, target_project=project_id
            )
            target_project_df = projects_df[projects_df["id"] == project_id]

        dto = ProjectSearchResultsDTO()
        dto.pagination = None
        if projects_df.shape[0] < 2:
            return dto

        # Get IDs of similar projects
        similar_projects = ProjectRecommendationService.get_similar_project_ids(
            projects_df, target_project_df
        )
        user = await UserService.get_user_by_id(user_id, db) if user_id else None

        # Create the search query with filters applied based on user role
        search_query, params = await ProjectSearchService.create_search_query(db, user)

        # Filter out fully completed projects
        search_query += """
        AND (p.total_tasks != p.tasks_validated + p.tasks_bad_imagery)
        AND p.id = :project_id
        """

        # Limit the number of similar projects to fetch
        limit = min(limit, len(similar_projects)) if similar_projects else 0
        count = 0
        while len(dto.results) < limit:
            try:
                similar_project_id = similar_projects[count]
            except IndexError:
                break
            project = await db.fetch_one(
                query=search_query, values={**params, "project_id": similar_project_id}
            )
            if project:
                dto.results.append(
                    await ProjectSearchService.create_result_dto(
                        project,
                        preferred_locale,
                        await Project.get_project_total_contributions(
                            project["id"], db
                        ),
                        db,
                    )
                )
            count += 1

        return dto
