from flask import current_app
import math
import geojson
from geoalchemy2 import shape
from sqlalchemy import func, distinct, desc, or_
from shapely.geometry import Polygon, box
from cachetools import TTLCache, cached

from backend import db
from backend.models.dtos.project_dto import (
    ProjectSearchDTO,
    ProjectSearchResultsDTO,
    ListSearchResultDTO,
    Pagination,
    ProjectSearchBBoxDTO,
)
from backend.models.postgis.project import Project, ProjectInfo, ProjectTeams
from backend.models.postgis.statuses import (
    ProjectStatus,
    MappingLevel,
    MappingTypes,
    ProjectPriority,
    UserRole,
    TeamRoles,
)
from backend.models.postgis.campaign import Campaign
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.task import TaskHistory
from backend.models.postgis.utils import (
    NotFound,
    ST_Intersects,
    ST_MakeEnvelope,
    ST_Transform,
    ST_Area,
)
from backend.models.postgis.interests import project_interests
from backend.services.users.user_service import UserService


search_cache = TTLCache(maxsize=128, ttl=300)

# max area allowed for passed in bbox, calculation shown to help future maintenance
# client resolution (mpp)* arbitrary large map size on a large screen in pixels * 50% buffer, all squared
MAX_AREA = math.pow(1250 * 4275 * 1.5, 2)


class ProjectSearchServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class BBoxTooBigError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ProjectSearchService:
    @staticmethod
    def create_search_query(user=None):
        query = (
            db.session.query(
                Project.id.label("id"),
                Project.mapper_level,
                Project.priority,
                Project.default_locale,
                Project.centroid.ST_AsGeoJSON().label("centroid"),
                Project.organisation_id,
                Project.tasks_bad_imagery,
                Project.tasks_mapped,
                Project.tasks_validated,
                Project.status,
                Project.total_tasks,
                Project.last_updated,
                Project.due_date,
                Project.country,
                Organisation.name.label("organisation_name"),
                Organisation.logo.label("organisation_logo"),
            )
            .filter(Project.geometry is not None)
            .outerjoin(Organisation, Organisation.id == Project.organisation_id)
            .group_by(Organisation.id, Project.id)
        )

        # Get public projects only for anonymous user.
        if user is None:
            query = query.filter(Project.private.is_(False))

        if user is not None and user.role != UserRole.ADMIN.value:
            # Get also private projects of teams that the user is member.
            project_ids = [[p.project_id for p in t.team.projects] for t in user.teams]

            # Get projects that belong to user organizations.
            orgs_projects_ids = [[p.id for p in u.projects] for u in user.organisations]

            project_ids.extend(orgs_projects_ids)

            project_ids = tuple(
                set([item for sublist in project_ids for item in sublist])
            )

            query = query.filter(
                or_(Project.private.is_(False), Project.id.in_(project_ids))
            )

        # If the user is admin, no filter.
        return query

    @staticmethod
    def create_result_dto(project, preferred_locale, total_contributors):
        project_info_dto = ProjectInfo.get_dto_for_locale(
            project.id, preferred_locale, project.default_locale
        )
        list_dto = ListSearchResultDTO()
        list_dto.project_id = project.id
        list_dto.locale = project_info_dto.locale
        list_dto.name = project_info_dto.name
        list_dto.priority = ProjectPriority(project.priority).name
        list_dto.mapper_level = MappingLevel(project.mapper_level).name
        list_dto.short_description = project_info_dto.short_description
        list_dto.last_updated = project.last_updated
        list_dto.due_date = project.due_date
        list_dto.percent_mapped = Project.calculate_tasks_percent(
            "mapped",
            project.total_tasks,
            project.tasks_mapped,
            project.tasks_validated,
            project.tasks_bad_imagery,
        )
        list_dto.percent_validated = Project.calculate_tasks_percent(
            "validated",
            project.total_tasks,
            project.tasks_mapped,
            project.tasks_validated,
            project.tasks_bad_imagery,
        )
        list_dto.status = ProjectStatus(project.status).name
        list_dto.active_mappers = Project.get_active_mappers(project.id)
        list_dto.total_contributors = total_contributors
        list_dto.country = project.country
        list_dto.organisation_name = project.organisation_name
        list_dto.organisation_logo = project.organisation_logo
        list_dto.campaigns = Project.get_project_campaigns(project.id)

        return list_dto

    @staticmethod
    def get_total_contributions(paginated_results):
        paginated_projects_ids = [p.id for p in paginated_results]

        # We need to make a join to return projects without contributors.
        project_contributors_count = (
            Project.query.with_entities(
                Project.id, func.count(distinct(TaskHistory.user_id)).label("total")
            )
            .filter(Project.id.in_(paginated_projects_ids))
            .outerjoin(TaskHistory, TaskHistory.project_id == Project.id)
            .group_by(Project.id)
            .all()
        )

        return [p.total for p in project_contributors_count]

    @staticmethod
    @cached(search_cache)
    def search_projects(search_dto: ProjectSearchDTO, user) -> ProjectSearchResultsDTO:
        """ Searches all projects for matches to the criteria provided by the user """
        all_results, paginated_results = ProjectSearchService._filter_projects(
            search_dto, user
        )
        if paginated_results.total == 0:
            raise NotFound()

        dto = ProjectSearchResultsDTO()
        dto.results = [
            ProjectSearchService.create_result_dto(
                p,
                search_dto.preferred_locale,
                Project.get_project_total_contributions(p[0]),
            )
            for p in paginated_results.items
        ]
        dto.pagination = Pagination(paginated_results)
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

    @staticmethod
    def _filter_projects(search_dto: ProjectSearchDTO, user):
        """ Filters all projects based on criteria provided by user"""
        query = ProjectSearchService.create_search_query(user)
        query = query.join(ProjectInfo).filter(
            ProjectInfo.locale.in_([search_dto.preferred_locale, "en"])
        )
        project_status_array = []
        if search_dto.project_statuses:
            for project_status in search_dto.project_statuses:
                project_status_array.append(ProjectStatus[project_status].value)
            query = query.filter(Project.status.in_(project_status_array))
        else:
            if not search_dto.created_by:
                project_status_array = [ProjectStatus.PUBLISHED.value]
                query = query.filter(Project.status.in_(project_status_array))
        if search_dto.interests:
            query = query.join(
                project_interests, project_interests.c.project_id == Project.id
            ).filter(project_interests.c.interest_id.in_(search_dto.interests))
        if search_dto.created_by:
            query = query.filter(Project.author_id == search_dto.created_by)
        if search_dto.mapped_by:
            projects_mapped = UserService.get_projects_mapped(search_dto.mapped_by)
            query = query.filter(Project.id.in_(projects_mapped))
        if search_dto.favorited_by:
            user = UserService.get_user_by_id(search_dto.favorited_by)
            projects_favorited = user.favorites
            query = query.filter(
                Project.id.in_([project.id for project in projects_favorited])
            )
        if search_dto.mapper_level and search_dto.mapper_level.upper() != "ALL":
            query = query.filter(
                Project.mapper_level == MappingLevel[search_dto.mapper_level].value
            )

        if search_dto.organisation_name:
            query = query.filter(Organisation.name == search_dto.organisation_name)

        if search_dto.organisation_id:
            query = query.filter(Organisation.id == search_dto.organisation_id)

        if search_dto.team_id:
            query = query.join(
                ProjectTeams, ProjectTeams.project_id == Project.id
            ).filter(ProjectTeams.team_id == search_dto.team_id)

        if search_dto.campaign:
            query = query.join(Campaign, Project.campaign).group_by(
                Project.id, Campaign.name
            )
            query = query.filter(Campaign.name == search_dto.campaign)

        if search_dto.mapping_types:
            # Construct array of mapping types for query
            mapping_type_array = []
            for mapping_type in search_dto.mapping_types:
                mapping_type_array.append(MappingTypes[mapping_type].value)

            query = query.filter(Project.mapping_types.contains(mapping_type_array))

        if search_dto.text_search:
            # We construct an OR search, so any projects that contain or more of the search terms should be returned
            or_search = " | ".join(
                [x for x in search_dto.text_search.split(" ") if x != ""]
            )
            opts = [
                ProjectInfo.text_searchable.match(
                    or_search, postgresql_regconfig="english"
                ),
                ProjectInfo.name.like(f"%{or_search}%"),
            ]
            try:
                opts.append(Project.id == int(search_dto.text_search))
            except ValueError:
                pass

            query = query.filter(or_(*opts))

        if search_dto.country:
            # Unnest country column array.
            sq = Project.query.with_entities(
                Project.id, func.unnest(Project.country).label("country")
            ).subquery()
            query = query.filter(
                sq.c.country.ilike("%{}%".format(search_dto.country))
            ).filter(Project.id == sq.c.id)

        order_by = search_dto.order_by
        if search_dto.order_by_type == "DESC":
            order_by = desc(search_dto.order_by)

        query = query.order_by(order_by).distinct(search_dto.order_by, Project.id)

        if search_dto.managed_by and user.role != UserRole.ADMIN.value:
            # Get all the projects associated with the user and team.
            orgs_projects_ids = [[p.id for p in u.projects] for u in user.organisations]
            orgs_projects_ids = [
                item for sublist in orgs_projects_ids for item in sublist
            ]

            team_project_ids = [
                [
                    p.project_id
                    for p in u.team.projects
                    if p.role == TeamRoles.PROJECT_MANAGER.value
                ]
                for u in user.teams
            ]
            team_project_ids = [
                item for sublist in team_project_ids for item in sublist
            ]

            orgs_projects_ids.extend(team_project_ids)
            ids = tuple(set(orgs_projects_ids))
            query = query.filter(Project.id.in_(ids))

        all_results = []
        if not search_dto.omit_map_results:
            all_results = query.all()
        paginated_results = query.paginate(search_dto.page, 14, True)

        return all_results, paginated_results

    @staticmethod
    def get_projects_geojson(
        search_bbox_dto: ProjectSearchBBoxDTO,
    ) -> geojson.FeatureCollection:
        """  search for projects meeting criteria provided return as a geojson feature collection"""

        # make a polygon from provided bounding box
        polygon = ProjectSearchService._make_4326_polygon_from_bbox(
            search_bbox_dto.bbox, search_bbox_dto.input_srid
        )

        # validate the bbox area is less than or equal to the max area allowed to prevent
        # abuse of the api or performance issues from large requests
        if not ProjectSearchService.validate_bbox_area(polygon):
            raise BBoxTooBigError("Requested bounding box is too large")

        # get projects intersecting the polygon for created by the author_id
        intersecting_projects = ProjectSearchService._get_intersecting_projects(
            polygon, search_bbox_dto.project_author
        )

        # allow an empty feature collection to be returned if no intersecting features found, since this is primarily
        # for returning data to show on a map
        features = []
        for project in intersecting_projects:
            try:
                localDTO = ProjectInfo.get_dto_for_locale(
                    project.id, search_bbox_dto.preferred_locale, project.default_locale
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
    def _get_intersecting_projects(search_polygon: Polygon, author_id: int):
        """ executes a database query to get the intersecting projects created by the author if provided """

        query = db.session.query(
            Project.id,
            Project.status,
            Project.default_locale,
            Project.geometry.ST_AsGeoJSON().label("geometry"),
        ).filter(
            ST_Intersects(
                Project.geometry,
                ST_MakeEnvelope(
                    search_polygon.bounds[0],
                    search_polygon.bounds[1],
                    search_polygon.bounds[2],
                    search_polygon.bounds[3],
                    4326,
                ),
            )
        )

        if author_id:
            query = query.filter(Project.author_id == author_id)

        return query.all()

    @staticmethod
    def _make_4326_polygon_from_bbox(bbox: list, srid: int) -> Polygon:
        """ make a shapely Polygon in SRID 4326 from bbox and srid"""
        try:
            polygon = box(bbox[0], bbox[1], bbox[2], bbox[3])
            if not srid == 4326:
                geometry = shape.from_shape(polygon, srid)
                geom_4326 = db.engine.execute(ST_Transform(geometry, 4326)).scalar()
                polygon = shape.to_shape(geom_4326)
        except Exception as e:
            raise ProjectSearchServiceError(f"error making polygon: {e}")
        return polygon

    @staticmethod
    def _get_area_sqm(polygon: Polygon) -> float:
        """ get the area of the polygon in square metres """
        return db.engine.execute(
            ST_Area(ST_Transform(shape.from_shape(polygon, 4326), 3857))
        ).scalar()

    @staticmethod
    def validate_bbox_area(polygon: Polygon) -> bool:
        """ check polygon does not exceed maximim allowed area"""
        area = ProjectSearchService._get_area_sqm(polygon)
        return area <= MAX_AREA
