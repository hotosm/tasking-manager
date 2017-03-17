from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, BaseType, IntType
from schematics.types.compound import ListType, ModelType
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


class ProjectInfoDTO(Model):
    """ Contains the localized project info"""
    locale = StringType(required=True)
    name = StringType()
    short_description = StringType(serialized_name='shortDescription')
    description = StringType()
    instructions = StringType()


class ProjectDTO(Model):
    """ Describes JSON model for a tasking manager project """
    project_id = IntType(serialized_name='projectId')
    project_name = StringType(required=True, serialized_name='projectName')
    project_status = StringType(required=True, serialized_name='projectStatus', validators=[is_known_project_status],
                                serialize_when_none=False)
    project_priority = StringType(required=True, serialized_name='projectPriority',
                                  validators=[is_known_project_priority], serialize_when_none=False)
    area_of_interest = BaseType(serialized_name='areaOfInterest')
    tasks = BaseType(serialize_when_none=False)
    default_locale = StringType(serialized_name='defaultLocale')
    project_info = ModelType(ProjectInfoDTO, serialized_name='projectInfo', serialize_when_none=False)
    project_info_locales = ListType(ModelType(ProjectInfoDTO), serialized_name='projectInfoLocales',
                                    serialize_when_none=False)
