from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, BaseType, IntType, BooleanType, DateTimeType, FloatType
from schematics.types.compound import ListType, ModelType
from server.models.dtos.user_dto import is_known_mapping_level
from server.models.dtos.stats_dto import Pagination
from server.models.postgis.statuses import ProjectStatus, ProjectPriority, MappingTypes


def is_known_project_status(value):
    """ Validates that Project Status is known value """
    try:
        ProjectStatus[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown projectStatus: {value} Valid values are {ProjectStatus.DRAFT.name}, '
                              f'{ProjectStatus.PUBLISHED.name}, {ProjectStatus.ARCHIVED.name}')


def is_known_project_priority(value):
    """ Validates Project priority is known value """
    try:
        ProjectPriority[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown projectStatus: {value} Valid values are {ProjectPriority.LOW.name}, '
                              f'{ProjectPriority.MEDIUM.name}, {ProjectPriority.HIGH.name}, '
                              f'{ProjectPriority.URGENT.HIGH}')


def is_known_mapping_type(value):
    """ Validates Mapping Type is known value"""
    if type(value) == list:
        return  # Don't validate the entire list, just the individual values

    try:
        MappingTypes[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown mappingType: {value} Valid values are {MappingTypes.ROADS.name}, '
                              f'{MappingTypes.BUILDINGS.name}, {MappingTypes.WATERWAYS.name}, '
                              f'{MappingTypes.LAND_USE.name}, {MappingTypes.OTHER.name}')


class DraftProjectDTO(Model):
    """ Describes JSON model used for creating draft project """
    cloneFromProjectId = IntType(serialized_name='cloneFromProjectId')
    project_name = StringType(required=True, serialized_name='projectName')
    area_of_interest = BaseType(required=True, serialized_name='areaOfInterest')
    tasks = BaseType(required=False)
    has_arbitrary_tasks = BooleanType(required=True, serialized_name='arbitraryTasks')
    user_id = IntType(required=True)


class ProjectInfoDTO(Model):
    """ Contains the localized project info"""
    locale = StringType(required=True)
    name = StringType(default='')
    short_description = StringType(serialized_name='shortDescription', default='')
    description = StringType(default='')
    instructions = StringType(default='')
    per_task_instructions = StringType(default='', serialized_name='perTaskInstructions')


class ProjectDTO(Model):
    """ Describes JSON model for a tasking manager project """
    project_id = IntType(serialized_name='projectId')
    project_status = StringType(required=True, serialized_name='projectStatus', validators=[is_known_project_status],
                                serialize_when_none=False)
    project_priority = StringType(required=True, serialized_name='projectPriority',
                                  validators=[is_known_project_priority], serialize_when_none=False)
    area_of_interest = BaseType(serialized_name='areaOfInterest')
    tasks = BaseType(serialize_when_none=False)
    default_locale = StringType(required=True, serialized_name='defaultLocale', serialize_when_none=False)
    project_info = ModelType(ProjectInfoDTO, serialized_name='projectInfo', serialize_when_none=False)
    project_info_locales = ListType(ModelType(ProjectInfoDTO), serialized_name='projectInfoLocales',
                                    serialize_when_none=False)
    mapper_level = StringType(required=True, serialized_name='mapperLevel', validators=[is_known_mapping_level])
    enforce_mapper_level = BooleanType(required=True, default=False, serialized_name='enforceMapperLevel')
    enforce_validator_role = BooleanType(required=True, default=False, serialized_name='enforceValidatorRole')
    private = BooleanType(required=True)
    entities_to_map = StringType(serialized_name='entitiesToMap')
    changeset_comment = StringType(serialized_name='changesetComment')
    due_date = DateTimeType(serialized_name='dueDate')
    imagery = StringType()
    josm_preset = StringType(serialized_name='josmPreset', serialize_when_none=False)
    mapping_types = ListType(StringType, serialized_name='mappingTypes', validators=[is_known_mapping_type])
    campaign_tag = StringType(serialized_name='campaignTag')
    organisation_tag = StringType(serialized_name='organisationTag')
    license_id = IntType(serialized_name='licenseId')
    allowed_usernames = ListType(StringType(), serialized_name='allowedUsernames', default=[])
    priority_areas = BaseType(serialized_name='priorityAreas')
    last_updated = DateTimeType(serialized_name='lastUpdated')
    author = StringType()


class ProjectSearchDTO(Model):
    """ Describes the criteria users use to filter active projects"""
    preferred_locale = StringType(required=True, default='en')
    mapper_level = StringType(validators=[is_known_mapping_level])
    mapping_types = ListType(StringType, validators=[is_known_mapping_type])
    organisation_tag = StringType()
    campaign_tag = StringType()
    page = IntType(required=True)
    text_search = StringType()

    def __hash__(self):
        """ Make object hashable so we can cache user searches"""
        hashable_mapping_types = ''
        if self.mapping_types:
            for mapping_type in self.mapping_types:
                hashable_mapping_types = hashable_mapping_types + mapping_type

        return hash((self.preferred_locale, self.mapper_level, hashable_mapping_types, self.organisation_tag,
                     self.campaign_tag, self.page, self.text_search))


class ProjectSearchBBoxDTO(Model):
    bbox = ListType(FloatType, required=True, min_size=4, max_size=4)
    input_srid = IntType(required=True, choices=[4326])
    preferred_locale = StringType(required=True, default='en')
    project_author = IntType(required=False, serialized_name='projectAuthor')


class ListSearchResultDTO(Model):
    """ Describes one search result"""
    project_id = IntType(required=True, serialized_name='projectId')
    locale = StringType(required=True)
    name = StringType(default='')
    short_description = StringType(serialized_name='shortDescription', default='')
    mapper_level = StringType(required=True, serialized_name='mapperLevel')
    priority = StringType(required=True)
    organisation_tag = StringType(serialized_name='organisationTag')
    campaign_tag = StringType(serialized_name='campaignTag')
    percent_mapped = IntType(serialized_name='percentMapped')
    percent_validated = IntType(serialized_name='percentValidated')


class MapSearchResultDTO(Model):
    """ DTO for search results that will draw all matches on the map """
    project_id = IntType(required=True, serialized_name='projectId')
    aoi_centroid = BaseType(serialized_name='aoiCentroid')


class ProjectSearchResultsDTO(Model):
    """ Contains all results for the search criteria """
    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.results = []
        self.map_results = []

    map_results = ListType(ModelType(MapSearchResultDTO), serialized_name='mapResults')
    results = ListType(ModelType(ListSearchResultDTO))
    pagination = ModelType(Pagination)


class LockedTasksForUser(Model):
    """ Describes all tasks locked by an individual user"""
    locked_tasks = ListType(IntType, serialized_name='lockedTasks')


class ProjectComment(Model):
    """ Describes an individual user comment on a project task """
    comment = StringType()
    comment_date = DateTimeType(serialized_name='commentDate')
    user_name = StringType(serialized_name='userName')


class ProjectCommentsDTO(Model):
    """ Contains all comments on a project """
    comments = ListType(ModelType(ProjectComment))


class ProjectSummary(Model):
    """ Model used for PM dashboard """
    project_id = IntType(required=True, serialized_name='projectId')
    name = StringType()
    campaign_tag = StringType(serialized_name='campaignTag')
    percent_mapped = IntType(serialized_name='percentMapped')
    percent_validated = IntType(serialized_name='percentValidated')
    created = DateTimeType()
    last_updated = DateTimeType(serialized_name='lastUpdated')
    aoi_centroid = BaseType(serialized_name='aoiCentroid')


class PMDashboardDTO(Model):
    """ DTO for constructing the PM Dashboard """
    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.draft_projects = []
        self.archived_projects = []
        self.active_projects = []

    draft_projects = ListType(ModelType(ProjectSummary), serialized_name='draftProjects')
    active_projects = ListType(ModelType(ProjectSummary), serialized_name='activeProjects')
    archived_projects = ListType(ModelType(ProjectSummary), serialized_name='archivedProjects')
