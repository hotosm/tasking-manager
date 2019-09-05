import geojson
from cachetools import TTLCache, cached
from shapely.geometry import Polygon, box
from server.models.dtos.project_dto import (
    ProjectSearchDTO,
    ProjectSearchResultsDTO,
    ListSearchResultDTO,
    Pagination,
    ProjectSearchBBoxDTO,
)
from server.models.postgis.project import Project, ProjectInfo
from server.models.postgis.statuses import (
    ProjectStatus,
    MappingLevel,
    MappingTypes,
    ProjectPriority,
)
from server.models.postgis.campaign import Campaign
from server.models.postgis.organisation import Organisation
from server.models.postgis.task import TaskHistory
from server.models.postgis.utils import (
    NotFound,
    ST_Intersects,
    ST_MakeEnvelope,
    ST_Transform,
    ST_Area,
)
from server.services.campaign_service import CampaignService
from server import db
from flask import current_app
from geoalchemy2 import shape
from sqlalchemy import func, distinct, desc
import math


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
    def create_search_query():
        query = db.session.query(
            Project.id.label("id"),
            Project.mapper_level,
            Project.priority,
            Project.default_locale,
            Project.centroid.ST_AsGeoJSON().label("centroid"),
            Project.organisation_tag,
            Project.campaign_tag,
            Project.tasks_bad_imagery,
            Project.tasks_mapped,
            Project.tasks_validated,
            Project.status,
            Project.total_tasks,
            Project.last_updated,
            Project.due_date,
            Project.country,
        ).filter(Project.private is not True)

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
        list_dto.organisation_tag = project.organisation_tag
        list_dto.last_updated = project.last_updated
        list_dto.campaign_tag = project.campaign_tag
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
    def search_projects(search_dto: ProjectSearchDTO) -> ProjectSearchResultsDTO:
        """ Searches all projects for matches to the criteria provided by the user """

        all_results, paginated_results = ProjectSearchService._filter_projects(
            search_dto
        )

        if paginated_results.total == 0:
            raise NotFound()

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
        dto = ProjectSearchResultsDTO()
        dto.map_results = feature_collection

        # Get all total contributions for each paginated project.
        contrib_counts = ProjectSearchService.get_total_contributions(
            paginated_results.items
        )
        for project in paginated_results.items:
            # This loop loads the paginated text results
            # TODO would be nice to get this for an array rather than individually would be more efficient
            project_info_dto = ProjectInfo.get_dto_for_locale(
                project.id, search_dto.preferred_locale, project.default_locale
            )
            project_campaigns_dto = CampaignService.get_project_campaigns_as_dto(
                project.id
            )

            list_dto = ListSearchResultDTO()
            list_dto.project_id = project.id
            list_dto.locale = project_info_dto.locale
            list_dto.name = project_info_dto.name
            list_dto.priority = ProjectPriority(project.priority).name
            list_dto.mapper_level = MappingLevel(project.mapper_level).name
            list_dto.short_description = project_info_dto.short_description
            list_dto.organisation = project.organisation
            list_dto.last_updated = project.last_updated
            list_dto.campaign = project_campaigns_dto.campaigns
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
            list_dto.total_contributors = project.total_contributors

            dto.results.append(list_dto)

        zip_items = zip(paginated_results.items, contrib_counts)

        dto.results = [
            ProjectSearchService.create_result_dto(p, search_dto.preferred_locale, t)
            for p, t in zip_items
        ]
        dto.pagination = Pagination(paginated_results)

        return dto

    @staticmethod
    def _filter_projects(search_dto: ProjectSearchDTO):
        """ Filters all projects based on criteria provided by user"""
        query = ProjectSearchService.create_search_query()
        query = query.join(ProjectInfo).filter(
            ProjectInfo.locale.in_([search_dto.preferred_locale, "en"])
        )

        project_status_array = [ProjectStatus.PUBLISHED.value]

        if search_dto.project_statuses:
            for project_status in search_dto.project_statuses:
                project_status_array.append(ProjectStatus[project_status].value)

        if not search_dto.is_project_manager:
            project_status_array = list(
                filter(lambda x: x != ProjectStatus.DRAFT.value, project_status_array)
            )

        query = query.filter(Project.status.in_(project_status_array))

        if search_dto.mapper_level and search_dto.mapper_level.upper() != "ALL":
            query = query.filter(
                Project.mapper_level == MappingLevel[search_dto.mapper_level].value
            )

        if search_dto.organisation:
            query = query.join(Organisation, Project.organisation).filter(
                Organisation.name == search_dto.organisation
            )

        if search_dto.campaign:
            query = query.join(Campaign, Project.campaign).filter(
                Campaign.name == search_dto.campaign
            )

        if search_dto.mapping_types:
            # Construct array of mapping types for query
            mapping_type_array = []
            for mapping_type in search_dto.mapping_types:
                mapping_type_array.append(MappingTypes[mapping_type].value)

            query = query.filter(Project.mapping_types.contains(mapping_type_array))

        if search_dto.text_search:
            # We construct an OR search, so any projects that contain or more of the search terms should be returned
            or_search = search_dto.text_search.replace(" ", " | ")
            query = query.filter(
                ProjectInfo.text_searchable.match(
                    or_search, postgresql_regconfig="english"
                )
            )

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

        query = query.order_by(order_by).group_by(Project.id)
        all_results = query.all()
        paginated_results = query.paginate(search_dto.page, 14, True)

        return all_results, paginated_results

    @staticmethod
    def get_projects_geojson(
        search_bbox_dto: ProjectSearchBBoxDTO
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
