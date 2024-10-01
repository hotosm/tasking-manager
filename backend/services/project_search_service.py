# # from flask import current_app
import math
import geojson
from geoalchemy2 import shape
from sqlalchemy import or_, and_
from shapely.geometry import Polygon, box
from cachetools import TTLCache, cached
from loguru import logger

from backend.exceptions import NotFound
from backend.api.utils import validate_date_input
from backend.models.dtos.project_dto import (
    ProjectSearchDTO,
    ProjectSearchResultsDTO,
    ListSearchResultDTO,
    Pagination,
    ProjectSearchBBoxDTO,
)
from backend.models.postgis.project import Project, ProjectInfo
from backend.models.postgis.statuses import (
    ProjectStatus,
    MappingLevel,
    MappingTypes,
    ProjectPriority,
    UserRole,
    TeamRoles,
    ValidationPermission,
    MappingPermission,
    ProjectDifficulty,
)
from backend.services.users.user_service import UserService
from backend.db import get_session
from databases import Database
from fastapi import HTTPException
from typing import List


session = get_session()


search_cache = TTLCache(maxsize=128, ttl=300)

# max area allowed for passed in bbox, calculation shown to help future maintenance
# client resolution (mpp)* arbitrary large map size on a large screen in pixels * 50% buffer, all squared
MAX_AREA = math.pow(1250 * 4275 * 1.5, 2)


class ProjectSearchServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class BBoxTooBigError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


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
        LEFT JOIN project_info pi ON pi.project_id = p.id
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

        if filters:
            query += " AND " + " AND ".join(filters)

        return query, params

    @staticmethod
    async def create_result_dto(
        project, preferred_locale, total_contributors, db: Database
    ):
        project_info_dto = await ProjectInfo.get_dto_for_locale(
            db, project.id, preferred_locale, project.default_locale
        )
        # project_obj = await Project.get(project.id, db)
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

    # @staticmethod
    # def get_total_contributions(paginated_results):
    #     paginated_projects_ids = [p.id for p in paginated_results]

    #     # We need to make a join to return projects without contributors.
    #     project_contributors_count = (
    #         session.query(Project).with_entities(
    #             Project.id, func.count(distinct(TaskHistory.user_id)).label("total")
    #         )
    #         .filter(Project.id.in_(paginated_projects_ids))
    #         .outerjoin(
    #             TaskHistory,
    #             and_(
    #                 TaskHistory.project_id == Project.id,
    #                 TaskHistory.action != "COMMENT",
    #             ),
    #         )
    #         .group_by(Project.id)
    #         .all()
    #     )

    #     return [p.total for p in project_contributors_count]

    @staticmethod
    async def get_total_contributions(
        project_ids: List[int], db: Database
    ) -> List[int]:
        """Fetch total contributions for given project IDs."""
        print(f"Fetching total contributions for projects: {project_ids}")

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

        # Filters based on search_dto
        if search_dto.preferred_locale:
            filters.append("pi.locale IN (:preferred_locale, 'en')")
            params["preferred_locale"] = search_dto.preferred_locale

        if search_dto.project_statuses:
            statuses = [
                ProjectStatus[status].value for status in search_dto.project_statuses
            ]
            filters.append("p.status IN :statuses")
            params["statuses"] = tuple(statuses)
        else:
            if not search_dto.created_by:
                filters.append("p.status = :published_status")
                params["published_status"] = ProjectStatus.PUBLISHED.value

        if not search_dto.based_on_user_interests:
            if search_dto.interests:
                filters.append(
                    "p.id IN (SELECT project_id FROM project_interests WHERE interest_id IN :interests)"
                )
                params["interests"] = tuple(search_dto.interests)
        else:
            user = await UserService.get_user_by_id(search_dto.based_on_user_interests)
            filters.append(
                "p.id IN (SELECT project_id FROM project_interests WHERE interest_id IN :user_interests)"
            )
            params["user_interests"] = tuple(interest.id for interest in user.interests)

        if search_dto.created_by:
            filters.append("p.author_id = :created_by")
            params["created_by"] = search_dto.created_by

        if search_dto.mapped_by:
            mapped_projects = await UserService.get_projects_mapped(
                search_dto.mapped_by, db
            )
            filters.append("p.id IN :mapped_projects")
            params["mapped_projects"] = tuple(mapped_projects)

        if search_dto.favorited_by:
            favorited_projects = [project.id for project in user.favorites]
            filters.append("p.id IN :favorited_projects")
            params["favorited_projects"] = tuple(favorited_projects)

        if search_dto.difficulty and search_dto.difficulty.upper() != "ALL":
            filters.append("p.difficulty = :difficulty")
            params["difficulty"] = ProjectDifficulty[search_dto.difficulty].value

        if search_dto.action and search_dto.action != "any":
            if search_dto.action == "map":
                filters.append(
                    "p.id IN (SELECT project_id FROM project_actions WHERE action = 'map')"
                )
            elif search_dto.action == "validate":
                filters.append(
                    "p.id IN (SELECT project_id FROM project_actions WHERE action = 'validate')"
                )

        if search_dto.organisation_name:
            filters.append("o.name = :organisation_name")
            params["organisation_name"] = search_dto.organisation_name

        if search_dto.organisation_id:
            filters.append("o.id = :organisation_id")
            params["organisation_id"] = search_dto.organisation_id

        if search_dto.team_id:
            filters.append(
                "p.id IN (SELECT project_id FROM project_teams WHERE team_id = :team_id)"
            )
            params["team_id"] = search_dto.team_id

        if search_dto.campaign:
            filters.append(
                "p.id IN (SELECT project_id FROM campaigns WHERE name = :campaign_name)"
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

        if search_dto.text_search:
            search_text = "".join(
                char for char in search_dto.text_search if char not in "@|&!><\\():"
            )
            or_search = " | ".join([x for x in search_text.split(" ") if x])
            filters.append(
                "pi.text_searchable @@ to_tsquery('english', :text_search) OR pi.name ILIKE :text_search"
            )
            params["text_search"] = or_search

        if search_dto.country:
            filters.append(
                "p.id IN (SELECT id FROM projects, unnest(country) AS country WHERE LOWER(country) = LOWER(:country))"
            )
            params["country"] = search_dto.country

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
            order_by = f"p.{search_dto.order_by}"
            if search_dto.order_by_type == "DESC":
                order_by += " DESC"
            order_by_clause = f" ORDER BY {order_by}"

        # Construct final query
        if filters:
            sql_query = base_query + " AND " + " AND ".join(filters)
        else:
            sql_query = base_query

        # Append the ORDER BY clause
        sql_query += order_by_clause

        # Pagination
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
    def filter_by_user_permission(query, user, permission: str):
        """Filter projects a user can map or validate, based on their permissions."""
        if user and user.role != UserRole.ADMIN.value:
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

            selection = []
            # get ids of projects assigned to the user's teams
            [
                [
                    selection.append(team_project.project_id)
                    for team_project in user_team.team.projects
                    if team_project.project_id not in selection
                    and team_project.role in team_roles
                ]
                for user_team in user.teams
            ]
            if user.mapping_level == MappingLevel.BEGINNER.value:
                # if user is beginner, get only projects with ANY or TEAMS mapping permission
                # in the later case, only those that are associated with user teams
                query = query.filter(
                    or_(
                        and_(
                            Project.id.in_(selection),
                            getattr(Project, permission)
                            == permission_class.TEAMS.value,
                        ),
                        getattr(Project, permission) == permission_class.ANY.value,
                    )
                )
            else:
                # if user is intermediate or advanced, get projects with ANY or LEVEL permission
                # and projects associated with user teams
                query = query.filter(
                    or_(
                        Project.id.in_(selection),
                        getattr(Project, permission).in_(
                            [
                                permission_class.ANY.value,
                                permission_class.LEVEL.value,
                            ]
                        ),
                    )
                )

        return query

    @staticmethod
    def filter_projects_to_map(query, user):
        """Filter projects that needs mapping and can be mapped by the current user."""
        query = query.filter(
            Project.tasks_mapped + Project.tasks_validated
            < Project.total_tasks - Project.tasks_bad_imagery
        )
        return ProjectSearchService.filter_by_user_permission(
            query, user, "mapping_permission"
        )

    @staticmethod
    def filter_projects_to_validate(query, user):
        """Filter projects that needs validation and can be validated by the current user."""
        query = query.filter(
            Project.tasks_validated < Project.total_tasks - Project.tasks_bad_imagery
        )
        return ProjectSearchService.filter_by_user_permission(
            query, user, "validation_permission"
        )

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
            # Convert the polygon to its WKT format

            geometry_wkt = polygon.wkt

            # Prepare the raw SQL query to calculate the area
            query = "SELECT ST_Area(ST_Transform(ST_GeomFromText(:wkt, 4326), 3857)) AS area"
            values = {"wkt": geometry_wkt}

            # Execute the query asynchronously using encode databases
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
