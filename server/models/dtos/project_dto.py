from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, BaseType, IntType, BooleanType, DateType
from schematics.types.compound import ListType, ModelType
from server.models.dtos.user_dto import is_known_mapping_level
from server.models.postgis.statuses import ProjectStatus, ProjectPriority


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


class DraftProjectDTO(Model):
    """ Describes JSON model used for creating draft project """
    project_name = StringType(required=True, serialized_name='projectName')
    area_of_interest = BaseType(required=True, serialized_name='areaOfInterest')
    tasks = BaseType(required=True)
    user_id = IntType(required=True)


class ProjectInfoDTO(Model):
    """ Contains the localized project info"""
    locale = StringType(required=True)
    name = StringType(default='')
    short_description = StringType(serialized_name='shortDescription', default='')
    description = StringType(default='')
    instructions = StringType(default='')


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
    due_date = DateType(serialized_name='dueDate')
    imagery = StringType()


class ProjectSearchDTO(Model):
    """ Describes the criteria users use to filter active projects"""
    preferred_locale = StringType(required=True, default='en')
    mapper_level = StringType(required=True, serialized_name='mapperLevel', validators=[is_known_mapping_level])


class ProjectSearchResultDTO(Model):
    """ Describes one search result"""
    project_id = IntType(required=True, serialized_name='projectId')
    locale = StringType(required=True)
    name = StringType(default='')
    short_description = StringType(serialized_name='shortDescription', default='')
    mapper_level = StringType(required=True, serialized_name='mapperLevel')
    priority = StringType(required=True)
    aoi_centroid = BaseType(serialized_name='aoiCentroid')


class ProjectSearchResultsDTO(Model):
    """ Contains all results for the search criteria """
    results = ListType(ModelType(ProjectSearchResultDTO))


class LockedTasksForUser(Model):
    locked_tasks = ListType(IntType, serialized_name='lockedTasks')
