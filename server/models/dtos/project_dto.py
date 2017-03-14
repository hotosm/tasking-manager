from schematics import Model
from schematics.types import StringType
from schematics.exceptions import ValidationError
from server.models.project import ProjectStatus


def is_known_project_status(value):
    try:
        ProjectStatus[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown projectStatus: {value} Valid values are {ProjectStatus.DRAFT.name}, '
                              f'{ProjectStatus.PUBLISHED.name}, {ProjectStatus.ARCHIVED.name}')


class ProjectDTO(Model):
    project_name = StringType(required=True, serialized_name='projectName')
    project_status = StringType(required=True, serialized_name='projectStatus', validators=[is_known_project_status])
