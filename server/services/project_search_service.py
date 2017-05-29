import geojson
from shapely.geometry import Polygon, box
from server.models.dtos.project_dto import ProjectSearchDTO, ProjectSearchResultsDTO, ProjectSearchResultDTO, Pagination, ProjectSearchBBoxDTO
from server.models.postgis.project import Project, AreaOfInterest, ProjectInfo
from server.models.postgis.statuses import ProjectStatus, MappingLevel, MappingTypes, ProjectPriority
from server.models.postgis.utils import NotFound, ST_Intersects, ST_MakeEnvelope, ST_Transform
from server import db
from flask import current_app



class ProjectSearchServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ProjectSearchService:
    @staticmethod
    def search_projects(search_dto: ProjectSearchDTO) -> ProjectSearchResultsDTO:
        """ Searches all projects for matches to the criteria provided by the user """

        filtered_projects = ProjectSearchService._filter_projects(search_dto)

        if filtered_projects.total == 0:
            raise NotFound()

        dto = ProjectSearchResultsDTO()
        for project in filtered_projects.items:
            # TODO would be nice to get this for an array rather than individually would be more efficient
            project_info_dto = ProjectInfo.get_dto_for_locale(project.id, search_dto.preferred_locale,
                                                              project.default_locale)

            result_dto = ProjectSearchResultDTO()
            result_dto.project_id = project.id
            result_dto.locale = project_info_dto.locale
            result_dto.name = project_info_dto.name
            result_dto.priority = ProjectPriority(project.priority).name
            result_dto.mapper_level = MappingLevel(project.mapper_level).name
            result_dto.short_description = project_info_dto.short_description
            result_dto.aoi_centroid = geojson.loads(project.centroid)
            result_dto.organisation_tag = project.organisation_tag
            result_dto.campaign_tag = project.campaign_tag
            result_dto.percent_mapped = round(
                (project.tasks_mapped / (project.total_tasks - project.tasks_bad_imagery)) * 100, 0)
            result_dto.percent_validated = round(
                ((project.tasks_validated + project.tasks_bad_imagery) / project.total_tasks) * 100, 0)

            dto.results.append(result_dto)

        dto.pagination = Pagination(filtered_projects)
        return dto

    @staticmethod
    def _filter_projects(search_dto: ProjectSearchDTO):
        """ Filters all projects based on criteria provided by user"""

        # Base query, that we'll dynamically chain filters to dependent on supplied criteria
        query = db.session.query(Project.id,
                                 Project.mapper_level,
                                 Project.priority,
                                 Project.default_locale,
                                 AreaOfInterest.centroid.ST_AsGeoJSON().label('centroid'),
                                 Project.organisation_tag,
                                 Project.campaign_tag,
                                 Project.tasks_bad_imagery,
                                 Project.tasks_mapped,
                                 Project.tasks_validated,
                                 Project.total_tasks).join(AreaOfInterest).join(ProjectInfo) \
            .filter(Project.status == ProjectStatus.PUBLISHED.value).filter(
            ProjectInfo.locale.in_([search_dto.preferred_locale, 'en'])).filter(Project.private != True)

        if search_dto.mapper_level:
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

        results = query.order_by(Project.priority).paginate(search_dto.page, 4, True)

        return results

    @staticmethod
    def _make_polygon_from_bbox(bbox: list):

        try:
            polygon = box(bbox[0], bbox[1], bbox[2], bbox[3])
        except Exception as e:
            raise ProjectSearchServiceError(f'error making polygon: {e}')

        return polygon

    @staticmethod
    def get_projects_geojson(search_bbox_dto: ProjectSearchBBoxDTO ) -> geojson.FeatureCollection:

        polygon = ProjectSearchService._make_polygon_from_bbox(search_bbox_dto.bbox)

        # TODO: validate the zoom level of the bbox is less than or equal to the max OSM zoom level we are supporting

        intersecting_projects = ProjectSearchService._get_intersecting_projects(polygon)

        # todo raise error if no projects found

        features = []

        for project in intersecting_projects:

            localDTO = ProjectInfo.get_dto_for_locale(project.id, search_bbox_dto.preferred_locale, project.default_locale)

            properties = {
                "id": project.id,
                "status": ProjectStatus(project.status).name,
                "name": localDTO.name
            }
            feature = geojson.Feature(geometry=geojson.loads(project.geometry), properties=properties)
            features.append(feature)

        return geojson.FeatureCollection(features)

    @staticmethod
    def _get_intersecting_projects(search_polygon: Polygon):

        intersecting_projects = db.session.query(Project.id,
                                                 Project.status,
                                                 Project.default_locale,
                                                 AreaOfInterest.geometry.ST_AsGeoJSON().label('geometry')) \
            .join(AreaOfInterest) \
            .join(ProjectInfo) \
            .filter(ProjectInfo.locale == Project.default_locale) \
            .filter(ST_Intersects(AreaOfInterest.geometry,
                                  ST_MakeEnvelope(search_polygon.bounds[0],
                                                  search_polygon.bounds[1],
                                                  search_polygon.bounds[2],
                                                  search_polygon.bounds[3], 4326)))
        return intersecting_projects
