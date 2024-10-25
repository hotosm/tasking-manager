# # from flask import current_app
import math
from typing import List

import geojson
from cachetools import TTLCache, cached
from databases import Database
from fastapi import HTTPException
from geoalchemy2 import shape
from loguru import logger
from shapely.geometry import Polygon, box

from backend.api.utils import validate_date_input
from backend.db import get_session
from backend.exceptions import NotFound
from backend.models.dtos.project_dto import (
    ListSearchResultDTO,
    Pagination,
    ProjectSearchBBoxDTO,
    ProjectSearchDTO,
    ProjectSearchResultsDTO,
)
from backend.models.postgis.project import Project, ProjectInfo, ProjectTeams
from backend.models.postgis.partner import Partner
from backend.models.postgis.statuses import (
    MappingLevel,
    MappingPermission,
    MappingTypes,
    ProjectDifficulty,
    ProjectPriority,
    ProjectStatus,
    TeamRoles,
    UserRole,
    ValidationPermission,
)
from backend.models.postgis.project_partner import ProjectPartnership
from backend.models.postgis.campaign import Campaign
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.task import TaskHistory
from backend.models.postgis.utils import (
    ST_Intersects,
    ST_MakeEnvelope,
    ST_Transform,
    ST_Area,
)
from backend.models.postgis.interests import project_interests
from backend.services.users.user_service import UserService

session = get_session()

search_cache = TTLCache(maxsize=128, ttl=300)
csv_download_cache = TTLCache(maxsize=16, ttl=600)

# max area allowed for passed in bbox, calculation shown to help future maintenance
# client resolution (mpp)* arbitrary large map size on a large screen in pixels * 50% buffer, all squared
MAX_AREA = math.pow(1250 * 4275 * 1.5, 2)


class ProjectSearchServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        logger.debug(message)


class BBoxTooBigError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        logger.debug(message)


class ProjectSearchService:
    @staticmethod
    async def create_search_query(db, user=None):
        # Base query for fetching project details
        query = """
        SELECT
            p.id AS id,
            p.difficulty,
            p.priority,
            p.default_locale,
            ST_AsGeoJSON(p.centroid) AS centroid,
            p.organisation_id,
            p.tasks_bad_imagery,
            p.tasks_mapped,
            p.tasks_validated,
            p.status,
            p.total_tasks,
            p.last_updated,
            p.due_date,
            p.country,
            o.name AS organisation_name,
            o.logo AS organisation_logo
        FROM projects p
        LEFT JOIN organisations o ON o.id = p.organisation_id
        WHERE p.geometry IS NOT NULL
        """

        filters = []
        params = {}

        if user is None:
            filters.append("p.private = :private")
            params["private"] = False

        if user is not None:
            if user.role != UserRole.ADMIN.value:
                # Fetch project_ids for user's teams
                team_projects_query = """
                SELECT p.id
                FROM projects p
                JOIN project_teams pt ON pt.project_id = p.id
                JOIN teams t ON t.id = pt.team_id
                JOIN team_members tm ON tm.team_id = t.id
                WHERE tm.user_id = :user_id
                """
                team_projects = await db.fetch_all(
                    team_projects_query, {"user_id": user.id}
                )

                # Fetch project_ids for user's organisations
                org_projects_query = """
                SELECT p.id
                FROM projects p
                JOIN organisations o ON o.id = p.organisation_id
                JOIN organisation_managers om ON om.organisation_id = o.id
                WHERE om.user_id = :user_id
                """
                org_projects = await db.fetch_all(
                    org_projects_query, {"user_id": user.id}
                )

                # Combine and deduplicate project IDs
                project_ids = tuple(
                    set(
                        [row["id"] for row in team_projects]
                        + [row["id"] for row in org_projects]
                    )
                )

                if project_ids:
                    filters.append("p.private = :private OR p.id = ANY(:project_ids)")
                    params["private"] = False
                    params["project_ids"] = list(project_ids)

        # if filters:
        #     query += " AND " + " AND ".join(filters)

        if filters:
            query += " AND (" + " AND ".join(filters) + ")"

        return query, params

    @staticmethod
    async def create_result_dto(
        project, preferred_locale, total_contributors, db: Database
    ):
        project_info_dto = await ProjectInfo.get_dto_for_locale(
            db, project.id, preferred_locale, project.default_locale
        )

        list_dto = ListSearchResultDTO()
        list_dto.project_id = project.id
        list_dto.locale = project_info_dto.locale
        list_dto.name = project_info_dto.name
        list_dto.priority = ProjectPriority(project.priority).name
        list_dto.difficulty = ProjectDifficulty(project.difficulty).name
        list_dto.short_description = project_info_dto.short_description
        list_dto.last_updated = project.last_updated
        list_dto.due_date = project.due_date
        list_dto.percent_mapped = Project.calculate_tasks_percent(
            "mapped",
            project.tasks_mapped,
            project.tasks_validated,
            project.total_tasks,
            project.tasks_bad_imagery,
        )
        list_dto.percent_validated = Project.calculate_tasks_percent(
            "validated",
            project.tasks_mapped,
            project.tasks_validated,
            project.total_tasks,
            project.tasks_bad_imagery,
        )
        list_dto.status = ProjectStatus(project.status).name
        list_dto.active_mappers = await Project.get_active_mappers(project.id, db)
        list_dto.total_contributors = total_contributors
        list_dto.country = project.country
        list_dto.organisation_name = project.organisation_name
        list_dto.organisation_logo = project.organisation_logo
        list_dto.campaigns = await Project.get_project_campaigns(project.id, db)
        return list_dto

    @staticmethod
    async def get_total_contributions(
        project_ids: List[int], db: Database
    ) -> List[int]:
        """Fetch total contributions for given project IDs."""
        if not project_ids:
            return []

        query = """
        SELECT
            p.id AS id,
            COUNT(DISTINCT th.user_id) AS total
        FROM projects p
        LEFT JOIN task_history th ON th.project_id = p.id
            AND th.action != 'COMMENT'
        WHERE p.id = ANY(:project_ids)
        GROUP BY p.id
        """

        params = {"project_ids": project_ids}

        result = await db.fetch_all(query, params)

        return [row["total"] for row in result]

    @staticmethod
    @cached(csv_download_cache)
    def search_projects_as_csv(search_dto: ProjectSearchDTO, user) -> str:
        all_results, _ = ProjectSearchService._filter_projects(search_dto, user, True)
        rows = [row._asdict() for row in all_results]
        is_user_admin = user is not None and user.role == UserRole.ADMIN.value

        for row in rows:
            row["priority"] = ProjectPriority(row["priority"]).name
            row["difficulty"] = ProjectDifficulty(row["difficulty"]).name
            row["status"] = ProjectStatus(row["status"]).name
            row["total_area"] = round(row["total_area"], 3)
            row["total_contributors"] = Project.get_project_total_contributions(
                row["id"]
            )

            if is_user_admin:
                partners_names = (
                    ProjectPartnership.query.with_entities(
                        ProjectPartnership.project_id, Partner.name
                    )
                    .join(Partner, ProjectPartnership.partner_id == Partner.id)
                    .filter(ProjectPartnership.project_id == row["id"])
                    .group_by(ProjectPartnership.project_id, Partner.name)
                    .all()
                )
                row["partner_names"] = [pn for (_, pn) in partners_names]

        df = pd.json_normalize(rows)
        columns_to_drop = [
            "default_locale",
            "organisation_id",
            "organisation_logo",
            "tasks_bad_imagery",
            "tasks_mapped",
            "tasks_validated",
            "total_tasks",
            "centroid",
        ]

        colummns_to_rename = {
            "id": "projectId",
            "organisation_name": "organisationName",
            "last_updated": "lastUpdated",
            "due_date": "dueDate",
            "percent_mapped": "percentMapped",
            "percent_validated": "percentValidated",
            "total_area": "totalArea",
            "total_contributors": "totalContributors",
            "partner_names": "partnerNames",
            "project_name": "name",
        }

        df.drop(
            columns=columns_to_drop,
            inplace=True,
            axis=1,
        )
        df.rename(columns=colummns_to_rename, inplace=True)
        return df.to_csv(index=False)

    @staticmethod
    @cached(search_cache)
    async def search_projects(
        search_dto: ProjectSearchDTO, user, db
    ) -> ProjectSearchResultsDTO:
        """Searches all projects for matches to the criteria provided by the user"""
        (
            all_results,
            paginated_results,
            pagination_dto,
        ) = await ProjectSearchService._filter_projects(search_dto, user, db)
        if pagination_dto.total == 0:
            raise NotFound(sub_code="PROJECTS_NOT_FOUND")

        dto = ProjectSearchResultsDTO()
        dto.results = [
            await ProjectSearchService.create_result_dto(
                p,
                search_dto.preferred_locale,
                await Project.get_project_total_contributions(p.id, db),
                db,
            )
            for p in paginated_results
        ]

        dto.pagination = pagination_dto
        if search_dto.omit_map_results:
            return dto

        features = []
        for project in all_results:
            # This loop creates a geojson feature collection so you can see all active projects on the map
            properties = {
                "projectId": project.id,
                "priority": ProjectPriority(project.priority).name,
            }
            # centroid = project.centroid
            feature = geojson.Feature(
                geometry=geojson.loads(project.centroid), properties=properties
            )
            features.append(feature)
        feature_collection = geojson.FeatureCollection(features)
        dto.map_results = feature_collection
        return dto

    async def _filter_projects(search_dto: ProjectSearchDTO, user, db: Database):
        base_query, params = await ProjectSearchService.create_search_query(db, user)
        # Initialize filter list and parameters dictionary
        filters = []

        if search_dto.preferred_locale or search_dto.text_search:
            subquery_filters = []
            if search_dto.preferred_locale:
                subquery_filters.append("locale IN (:preferred_locale, 'en')")
                params["preferred_locale"] = search_dto.preferred_locale

            if search_dto.text_search:
                search_text = "".join(
                    char for char in search_dto.text_search if char not in "@|&!><\\():"
                )
                or_search = " | ".join([x for x in search_text.split(" ") if x])
                subquery_filters.append(
                    "text_searchable @@ to_tsquery('english', :text_search) OR name ILIKE :text_search"
                )
                params["text_search"] = or_search

            filters.append(
                """
                p.id IN (
                    SELECT project_id
                    FROM project_info
                    WHERE {}
                )
                """.format(" AND ".join(subquery_filters))
            )

        if search_dto.project_statuses:
            statuses = [
                ProjectStatus[status].value for status in search_dto.project_statuses
            ]
            filters.append("p.status = ANY(:statuses)")
            params["statuses"] = tuple(statuses)
        else:
            if not search_dto.created_by:
                filters.append("p.status = :published_status")
                params["published_status"] = ProjectStatus.PUBLISHED.value

        if not search_dto.based_on_user_interests:
            if search_dto.interests:
                filters.append(
                    "p.id IN (SELECT project_id FROM project_interests WHERE interest_id = ANY(:interests))"
                )
                params["interests"] = tuple(search_dto.interests)
        else:
            user_interest_query = """
                    SELECT interest_id
                    FROM user_interests
                    WHERE user_id = :user_id
                """
            results = await db.fetch_all(
                query=user_interest_query, values={"user_id": user.id}
            )
            user_interests = (
                [record["interest_id"] for record in results] if results else []
            )
            filters.append(
                "p.id IN (SELECT project_id FROM project_interests WHERE interest_id = ANY(:user_interests))"
            )
            params["user_interests"] = tuple(user_interests)

        if search_dto.created_by:
            filters.append("p.author_id = :created_by")
            params["created_by"] = search_dto.created_by

        if search_dto.mapped_by:
            mapped_projects = await UserService.get_projects_mapped(
                search_dto.mapped_by, db
            )
            filters.append("p.id = ANY(:mapped_projects)")
            params["mapped_projects"] = tuple(mapped_projects)

        if search_dto.favorited_by:
            favorited_projects = []
            if user:
                query = """
                    SELECT project_id
                    FROM project_favorites
                    WHERE user_id = :user_id
                """
                results = await db.fetch_all(query=query, values={"user_id": user.id})
                favorited_projects = [record["project_id"] for record in results]
            filters.append("p.id  = ANY(:favorited_projects)")
            params["favorited_projects"] = tuple(favorited_projects)

        if search_dto.difficulty and search_dto.difficulty.upper() != "ALL":
            filters.append("p.difficulty = :difficulty")
            params["difficulty"] = ProjectDifficulty[search_dto.difficulty].value

        if search_dto.action and search_dto.action != "any":
            if search_dto.action == "map":
                mapping_project_ids = await ProjectSearchService.filter_projects_to_map(
                    user, db
                )
                filters.append("p.id = ANY(:mapping_project_ids)")
                params["mapping_project_ids"] = tuple(mapping_project_ids)

            elif search_dto.action == "validate":
                validation_project_ids = (
                    await ProjectSearchService.filter_projects_to_validate(user, db)
                )
                filters.append("p.id = ANY(:validation_project_ids)")
                params["validation_project_ids"] = tuple(validation_project_ids)

        if search_dto.organisation_name:
            filters.append("o.name = :organisation_name")
            params["organisation_name"] = search_dto.organisation_name

        if search_dto.organisation_id:
            filters.append("o.id = :organisation_id")
            params["organisation_id"] = int(search_dto.organisation_id)

        if search_dto.team_id:
            filters.append(
                "p.id IN (SELECT project_id FROM project_teams WHERE team_id = :team_id)"
            )
            params["team_id"] = int(search_dto.team_id)

        if search_dto.campaign:
            filters.append(
                "p.id IN (SELECT cp.project_id FROM campaign_projects cp "
                "JOIN campaigns c ON c.id = cp.campaign_id WHERE c.name = :campaign_name)"
            )
            params["campaign_name"] = search_dto.campaign

        if search_dto.mapping_types:
            if search_dto.mapping_types_exact:
                filters.append("p.mapping_types @> :mapping_types")
                params["mapping_types"] = tuple(
                    MappingTypes[mapping_type].value
                    for mapping_type in search_dto.mapping_types
                )
            else:
                filters.append("p.mapping_types && :mapping_types")
                params["mapping_types"] = tuple(
                    MappingTypes[mapping_type].value
                    for mapping_type in search_dto.mapping_types
                )

        if search_dto.country:
            filters.append(
                "LOWER(:country) = ANY(ARRAY(SELECT LOWER(c) FROM unnest(p.country) AS c))"
            )
            params["country"] = search_dto.country.lower()

        if search_dto.last_updated_gte:
            filters.append("p.last_updated >= :last_updated_gte")
            params["last_updated_gte"] = validate_date_input(
                search_dto.last_updated_gte
            )

        if search_dto.last_updated_lte:
            filters.append("p.last_updated <= :last_updated_lte")
            params["last_updated_lte"] = validate_date_input(
                search_dto.last_updated_lte
            )

        if search_dto.created_gte:
            filters.append("p.created >= :created_gte")
            params["created_gte"] = validate_date_input(search_dto.created_gte)

        if search_dto.created_lte:
            filters.append("p.created <= :created_lte")
            params["created_lte"] = validate_date_input(search_dto.created_lte)

        if search_dto.managed_by and user.role != UserRole.ADMIN.value:
            # Fetch project IDs for user's organisations
            org_projects_query = """
            SELECT p.id
            FROM projects p
            JOIN organisations o ON o.id = p.organisation_id
            JOIN user_organisations uo ON uo.organisation_id = o.id
            WHERE uo.user_id = :user_id
            """
            orgs_projects_ids = await db.fetch_all(
                org_projects_query, {"user_id": user.id}
            )

            # Fetch project IDs for user's teams
            team_projects_query = """
            SELECT p.id
            FROM projects p
            JOIN teams t ON t.id = p.team_id
            JOIN user_teams ut ON ut.team_id = t.id
            WHERE ut.user_id = :user_id
            AND ut.role = :project_manager_role
            """
            team_project_ids = await db.fetch_all(
                team_projects_query,
                {
                    "user_id": user.id,
                    "project_manager_role": TeamRoles.PROJECT_MANAGER.value,
                },
            )

            # Combine and flatten the project IDs from both queries
            project_ids = tuple(
                set(
                    [row["id"] for row in orgs_projects_ids]
                    + [row["id"] for row in team_project_ids]
                )
            )
            if project_ids:
                filters.append("p.id IN :managed_projects")
                params["managed_projects"] = project_ids

        order_by_clause = ""

        if search_dto.order_by:
            order_by = search_dto.order_by

            if order_by == "percent_mapped":
                percent_mapped_sql = """
                    (p.tasks_mapped + p.tasks_validated) * 100
                    / NULLIF((p.total_tasks - p.tasks_bad_imagery), 0)
                """
                if search_dto.order_by_type == "DESC":
                    order_by_clause = f" ORDER BY {percent_mapped_sql} DESC"
                else:
                    order_by_clause = f" ORDER BY {percent_mapped_sql} ASC"

            elif order_by == "percent_validated":
                percent_validated_sql = """
                    p.tasks_validated * 100
                    / NULLIF((p.total_tasks - p.tasks_bad_imagery), 0)
                """
                if search_dto.order_by_type == "DESC":
                    order_by_clause = f" ORDER BY {percent_validated_sql} DESC"
                else:
                    order_by_clause = f" ORDER BY {percent_validated_sql} ASC"

            else:
                order_by = f"p.{order_by}"
                if search_dto.order_by_type == "DESC":
                    order_by += " DESC"
                order_by_clause = f" ORDER BY {order_by}"

        if filters:
            sql_query = base_query + " AND " + " AND ".join(filters)
        else:
            sql_query = base_query

        sql_query += order_by_clause
        page = search_dto.page
        per_page = 14
        offset = (page - 1) * per_page
        sql_query_paginated = sql_query + f" LIMIT {per_page} OFFSET {offset}"

        # Get total count
        count_query = f"SELECT COUNT(*) FROM ({sql_query}) AS count_subquery"
        total_count = await db.fetch_val(count_query, values=params)
        paginated_results = await db.fetch_all(sql_query_paginated, values=params)
        all_results = await db.fetch_all(sql_query, values=params)
        pagination_dto = Pagination.from_total_count(page, per_page, total_count)
        return all_results, paginated_results, pagination_dto

    @staticmethod
    async def filter_by_user_permission(db: Database, user, permission: str):
        """Add permission filter to the project query based on user permissions."""

        # Set the permission class and team roles based on the type of permission
        if permission == "validation_permission":
            permission_class = ValidationPermission
            team_roles = [
                TeamRoles.VALIDATOR.value,
                TeamRoles.PROJECT_MANAGER.value,
            ]
        else:
            permission_class = MappingPermission
            team_roles = [
                TeamRoles.MAPPER.value,
                TeamRoles.VALIDATOR.value,
                TeamRoles.PROJECT_MANAGER.value,
            ]

        subquery = """
            AND EXISTS (
                SELECT 1
                FROM project_teams pt
                JOIN teams t ON t.id = pt.team_id
                WHERE pt.project_id = p.id
                AND t.id IN (
                    SELECT tm.team_id
                    FROM team_members tm
                    WHERE tm.user_id = :user_id AND tm.active = true
                )
                AND pt.role = ANY(:team_roles)
            )
        """

        if user.mapping_level == MappingLevel.BEGINNER.value:
            subquery += f"""
                AND (p.{permission} IN (:teams_permission, :any_permission))
            """
            params = {
                "user_id": user.id,
                "team_roles": tuple(team_roles),
                "teams_permission": permission_class.TEAMS.value,
                "any_permission": permission_class.ANY.value,
            }
        else:
            subquery += f"""
                AND (p.{permission} IN (:any_permission, :level_permission))
            """
            params = {
                "user_id": user.id,
                "team_roles": tuple(team_roles),
                "any_permission": permission_class.ANY.value,
                "level_permission": permission_class.LEVEL.value,
            }
        return subquery, params

    @staticmethod
    async def filter_projects_to_map(user, db: Database):
        """Filter projects that need mapping and can be mapped by the current user."""
        query = """
            SELECT DISTINCT p.id
            FROM projects p
            WHERE (p.tasks_mapped + p.tasks_validated) < (p.total_tasks - p.tasks_bad_imagery)
        """
        params = {}
        if user and user.role != UserRole.ADMIN.value:
            (
                subquery,
                subquery_params,
            ) = await ProjectSearchService.filter_by_user_permission(
                db, user, "mapping_permission"
            )
            query += subquery
            params.update(subquery_params)

        project_records = await db.fetch_all(query, params)
        return [record["id"] for record in project_records] if project_records else []

    @staticmethod
    async def filter_projects_to_validate(user, db: Database):
        """Filter projects that need validation and can be validated by the current user."""
        # Base query to get unique project IDs that need validation
        query = """
        SELECT DISTINCT p.id
        FROM projects p
        WHERE p.tasks_validated < (p.total_tasks - p.tasks_bad_imagery)
        """

        params = {}
        if user and user.role != UserRole.ADMIN.value:
            (
                subquery,
                subquery_params,
            ) = await ProjectSearchService.filter_by_user_permission(
                db, user, "validation_permission"
            )
            query += subquery
            params.update(subquery_params)

        project_records = await db.fetch_all(query, params)
        return [record["id"] for record in project_records] if project_records else []

    @staticmethod
    async def get_projects_geojson(
        search_bbox_dto: ProjectSearchBBoxDTO, db: Database
    ) -> geojson.FeatureCollection:
        """Search for projects meeting the provided criteria. Returns a GeoJSON feature collection."""
        # make a polygon from provided bounding box
        polygon = await ProjectSearchService._make_4326_polygon_from_bbox(
            search_bbox_dto.bbox, search_bbox_dto.input_srid, db
        )
        # validate the bbox area is less than or equal to the max area allowed to prevent
        # abuse of the api or performance issues from large requests
        if not await ProjectSearchService.validate_bbox_area(polygon, db):
            raise HTTPException(
                status_code=400,
                detail="Organisation has projects or teams, cannot be deleted.",
            )
        # get projects intersecting the polygon for created by the author_id
        intersecting_projects = await ProjectSearchService._get_intersecting_projects(
            polygon, search_bbox_dto.project_author, db
        )
        # allow an empty feature collection to be returned if no intersecting features found, since this is primarily
        # for returning data to show on a map
        features = []
        for project in intersecting_projects:
            try:
                localDTO = await ProjectInfo.get_dto_for_locale(
                    db,
                    project.id,
                    search_bbox_dto.preferred_locale,
                    project.default_locale,
                )
            except Exception:
                pass

            properties = {
                "projectId": project.id,
                "projectStatus": ProjectStatus(project.status).name,
                "projectName": localDTO.name,
            }
            feature = geojson.Feature(
                geometry=geojson.loads(project.geometry), properties=properties
            )
            features.append(feature)

        return geojson.FeatureCollection(features)

    @staticmethod
    async def _get_intersecting_projects(
        search_polygon: Polygon, author_id: int, db: Database
    ):
        """Executes a database query to get the intersecting projects created by the author if provided"""
        try:
            # Convert the search_polygon bounds to a bounding box (WKT)
            bounds = search_polygon.bounds
            envelope_wkt = f"ST_MakeEnvelope({bounds[0]}, {bounds[1]}, {bounds[2]}, {bounds[3]}, 4326)"

            # Base SQL query with parameter placeholders
            query_str = f"""
                SELECT
                    id,
                    status,
                    default_locale,
                    ST_AsGeoJSON(geometry) AS geometry
                FROM
                    projects
                WHERE
                    ST_Intersects(geometry, {envelope_wkt})
            """

            # If an author_id is provided, append the AND condition
            if author_id:
                query_str += " AND author_id = :author_id"

            # Execute the query asynchronously with the parameters
            values = {"author_id": author_id} if author_id else {}
            results = await db.fetch_all(query=query_str, values=values)

            return results

        except Exception as e:
            logger.error(f"Error fetching intersecting projects: {e}")
            raise ProjectSearchServiceError(
                f"Error fetching intersecting projects: {e}"
            )

    @staticmethod
    async def _make_4326_polygon_from_bbox(
        bbox: list, srid: int, db: Database
    ) -> Polygon:
        """Make a shapely Polygon in SRID 4326 from bbox and srid"""
        try:
            polygon = box(bbox[0], bbox[1], bbox[2], bbox[3])

            # If the SRID is not 4326, transform it to 4326
            if srid != 4326:
                geometry = shape.from_shape(polygon, srid)
                # Construct the raw SQL query to transform the geometry
                query = "SELECT ST_Transform(ST_GeomFromText(:wkt, :srid), 4326) AS geom_4326"
                values = {"wkt": geometry.wkt, "srid": srid}

                # Execute the SQL query using the encode databases instance
                result = await db.fetch_one(query=query, values=values)
                geom_4326 = result["geom_4326"]
                polygon = shape.to_shape(geom_4326)

        except Exception as e:
            logger.error(f"InvalidData- error making polygon: {e}")
            raise ProjectSearchServiceError(f"InvalidData- error making polygon: {e}")

        return polygon

    @staticmethod
    async def _get_area_sqm(polygon: Polygon, db: Database) -> float:
        """Get the area of the polygon in square meters."""
        try:
            geometry_wkt = polygon.wkt

            query = "SELECT ST_Area(ST_Transform(ST_GeomFromText(:wkt, 4326), 3857)) AS area"
            values = {"wkt": geometry_wkt}

            result = await db.fetch_one(query=query, values=values)
            return result["area"]

        except Exception as e:
            logger.error(f"Error calculating area: {e}")
            raise ProjectSearchServiceError(f"Error calculating area: {e}")

    @staticmethod
    async def validate_bbox_area(polygon: Polygon, db: Database) -> bool:
        """Check if the polygon does not exceed the maximum allowed area."""
        area = await ProjectSearchService._get_area_sqm(polygon, db)
        return area <= MAX_AREA
