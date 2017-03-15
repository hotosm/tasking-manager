from schematics import Model
from schematics.types import StringType, BaseType, IntType, DictType
from server.models.dtos.validators import is_known_project_status


class ProjectDTO(Model):
    project_id = IntType()
    project_name = StringType(required=True, serialized_name='projectName')
    project_status = StringType(serialized_name='projectStatus', validators=[is_known_project_status])
    area_of_interest = BaseType(serialized_name='areaOfInterest')
    tasks = BaseType()
