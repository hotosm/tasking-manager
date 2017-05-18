import geojson
from server.models.dtos.project_dto import ProjectSearchDTO, ProjectSearchResultsDTO, ProjectSearchResultDTO, Pagination
from server.models.postgis.project import Project, AreaOfInterest, ProjectInfo
from server.models.postgis.statuses import ProjectStatus, MappingLevel, MappingTypes, ProjectPriority
from server.models.postgis.utils import NotFound
from server import db


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
            result_dto.percent_mapped = round((project.tasks_mapped / (project.total_tasks - project.tasks_bad_imagery)) * 100, 0)
            result_dto.percent_validated = round(((project.tasks_validated + project.tasks_bad_imagery) / project.total_tasks) * 100, 0)

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
                                 Project.total_tasks).join(AreaOfInterest).join(ProjectInfo)\
            .filter(Project.status == ProjectStatus.PUBLISHED.value).filter(ProjectInfo.locale == search_dto.preferred_locale)

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
            query = query.filter(ProjectInfo.text_searchable.match(search_dto.text_search))

        results = query.order_by(Project.priority).paginate(search_dto.page, 4, True)

        return results
