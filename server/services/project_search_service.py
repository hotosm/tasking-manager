import geojson
from cachetools import TTLCache, cached
from shapely.geometry import Polygon, box
from server.models.dtos.project_dto import ProjectSearchDTO, ProjectSearchResultsDTO, ListSearchResultDTO, \
    Pagination, ProjectSearchBBoxDTO
from server.models.postgis.project import Project, ProjectInfo
from server.models.postgis.statuses import ProjectStatus, MappingLevel, MappingTypes, ProjectPriority
from server.models.postgis.utils import NotFound, ST_Intersects, ST_MakeEnvelope, ST_Transform, ST_Area
from server.services.users.user_service import UserService
from server import db
from flask import current_app
from geoalchemy2 import shape
import math


search_cache = TTLCache(maxsize=128, ttl=300)

# max area allowed for passed in bbox, calculation shown to help future maintenace
# client resolution (mpp)* arbitrary large map size on a large screen in pixels * 50% buffer, all squared
MAX_AREA = math.pow(1250*4275*1.5,2)


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
    @cached(search_cache)
    def search_projects(search_dto: ProjectSearchDTO) -> ProjectSearchResultsDTO:
        """ Searches all projects for matches to the criteria provided by the user """

        all_results, paginated_results = ProjectSearchService._filter_projects(search_dto)

        if paginated_results.total == 0:
            raise NotFound()

        features = []
        for project in all_results:
            # This loop creates a geojson feature collection so you can see all active projects on the map
            properties = {
                "projectId": project.id,
                "priority": ProjectPriority(project.priority).name
            }
            centroid = project.centroid
            feature = geojson.Feature(geometry=geojson.loads(project.centroid), properties=properties)
            features.append(feature)
        feature_collection = geojson.FeatureCollection(features)
        dto = ProjectSearchResultsDTO()
        dto.map_results = feature_collection

        for project in paginated_results.items:
            # This loop loads the paginated text results
            # TODO would be nice to get this for an array rather than individually would be more efficient
            project_info_dto = ProjectInfo.get_dto_for_locale(project.id, search_dto.preferred_locale,
                                                              project.default_locale)

            list_dto = ListSearchResultDTO()
            list_dto.project_id = project.id
            list_dto.locale = project_info_dto.locale
            list_dto.name = project_info_dto.name
            list_dto.priority = ProjectPriority(project.priority).name
            list_dto.mapper_level = MappingLevel(project.mapper_level).name
            list_dto.short_description = project_info_dto.short_description
            list_dto.organisation_tag = project.organisation_tag
            list_dto.campaign_tag = project.campaign_tag
            list_dto.percent_mapped = round(
                ((project.tasks_mapped + project.tasks_bad_imagery) / project.total_tasks) * 100, 0)
            list_dto.percent_validated = round(
                (project.tasks_validated / project.total_tasks) * 100, 0)
            list_dto.status = ProjectStatus(project.status).name
            list_dto.active_mappers = Project.get_active_mappers(project.id)

            dto.results.append(list_dto)

        dto.pagination = Pagination(paginated_results)
        return dto

    @staticmethod
    def _filter_projects(search_dto: ProjectSearchDTO):
        """ Filters all projects based on criteria provided by user"""
        query = db.session.query(Project.id,
                                 Project.mapper_level,
                                 Project.priority,
                                 Project.default_locale,
                                 Project.centroid.ST_AsGeoJSON().label('centroid'),
                                 Project.organisation_tag,
                                 Project.campaign_tag,
                                 Project.tasks_bad_imagery,
                                 Project.tasks_mapped,
                                 Project.tasks_validated,
                                 Project.status,
                                 Project.total_tasks).join(ProjectInfo) \
            .filter(ProjectInfo.locale.in_([search_dto.preferred_locale, 'en'])) \
            .filter(Project.private != True)

        if not search_dto.is_project_manager:
            query = query.filter(Project.status == ProjectStatus.PUBLISHED.value)
        else:
            project_status_array = [ProjectStatus.PUBLISHED.value]
            if search_dto.project_statuses:
                for project_status in search_dto.project_statuses:
                    project_status_array.append(ProjectStatus[project_status].value)

            query = query.filter(Project.status.in_(project_status_array))

        if search_dto.mapper_level and search_dto.mapper_level.upper() != 'ALL':
            query = query.filter(Project.mapper_level == MappingLevel[search_dto.mapper_level].value)

        if search_dto.organisation_tag:
            query = query.filter(Project.organisation_tag == search_dto.organisation_tag)

        if search_dto.campaign_tag:
            query = query.filter(Project.campaign_tag == search_dto.campaign_tag)

        if search_dto.mapping_types:
            # Construct array of mapping types for query
            mapping_type_array = []
            for mapping_type in search_dto.mapping_types:
                mapping_type_array.append(MappingTypes[mapping_type].value)

            query = query.filter(Project.mapping_types.contains(mapping_type_array))

        if search_dto.text_search:
            # We construct an OR search, so any projects that contain or more of the search terms should be returned
            or_search = search_dto.text_search.replace(' ', ' | ')
            query = query.filter(ProjectInfo.text_searchable.match(or_search, postgresql_regconfig='english'))

        all_results = query.order_by(Project.priority, Project.id.desc()).all()
        paginated_results = query.order_by(Project.priority, Project.id.desc()).paginate(search_dto.page, 14, True)

        return all_results, paginated_results

    @staticmethod
    def get_projects_geojson(search_bbox_dto: ProjectSearchBBoxDTO) -> geojson.FeatureCollection:
        """  search for projects meeting criteria provided return as a geojson feature collection"""

        # make a polygon from provided bounding box
        polygon = ProjectSearchService._make_4326_polygon_from_bbox(search_bbox_dto.bbox, search_bbox_dto.input_srid)

        # validate the bbox area is less than or equal to the max area allowed to prevent
        # abuse of the api or performance issues from large requests
        if not ProjectSearchService.validate_bbox_area(polygon):
            raise BBoxTooBigError('Requested bounding box is too large')

        # get projects intersecting the polygon for created by the author_id
        intersecting_projects = ProjectSearchService._get_intersecting_projects(polygon, search_bbox_dto.project_author)

        # allow an empty feature collection to be returned if no intersecting features found, since this is primarily
        # for returning data to show on a map
        features = []
        for project in intersecting_projects:
            try:
                localDTO = ProjectInfo.get_dto_for_locale(project.id, search_bbox_dto.preferred_locale,
                                                          project.default_locale)
            except Exception as e:
                pass

            properties = {
                "projectId": project.id,
                "projectStatus": ProjectStatus(project.status).name,
                "projectName": localDTO.name
            }
            feature = geojson.Feature(geometry=geojson.loads(project.geometry), properties=properties)
            features.append(feature)

        return geojson.FeatureCollection(features)

    @staticmethod
    def _get_intersecting_projects(search_polygon: Polygon, author_id: int):
        """ executes a database query to get the intersecting projects created by the author if provided """

        query = db.session.query(Project.id,
                                 Project.status,
                                 Project.default_locale,
                                 Project.geometry.ST_AsGeoJSON().label('geometry')) \
            .filter(ST_Intersects(Project.geometry,
                                  ST_MakeEnvelope(search_polygon.bounds[0],
                                                  search_polygon.bounds[1],
                                                  search_polygon.bounds[2],
                                                  search_polygon.bounds[3], 4326)))

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
            raise ProjectSearchServiceError(f'error making polygon: {e}')
        return polygon

    @staticmethod
    def _get_area_sqm(polygon: Polygon) -> float:
        """ get the area of the polygon in square metres """
        return db.engine.execute(ST_Area(ST_Transform(shape.from_shape(polygon, 4326), 3857))).scalar()

    @staticmethod
    def validate_bbox_area(polygon: Polygon) -> bool:
        """ check polygon does not exceed maximim allowed area"""
        area = ProjectSearchService._get_area_sqm(polygon)
        return area <= MAX_AREA
