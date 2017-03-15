from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, BaseType, IntType
from server.models.statuses import ProjectStatus


def is_known_project_status(value):
    try:
        ProjectStatus[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown projectStatus: {value} Valid values are {ProjectStatus.DRAFT.name}, '
                              f'{ProjectStatus.PUBLISHED.name}, {ProjectStatus.ARCHIVED.name}')


class DraftProjectDTO(Model):
    project_name = StringType(required=True, serialized_name='projectName')
    area_of_interest = BaseType(required=True, serialized_name='areaOfInterest')
    tasks = BaseType(required=True)


class ProjectDTO(Model):
    project_id = IntType()
    project_name = StringType(required=True, serialized_name='projectName')
    project_status = StringType(required=True, serialized_name='projectStatus', validators=[is_known_project_status])
