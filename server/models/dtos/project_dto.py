from schematics import Model
from schematics.types import StringType, BaseType, IntType, BooleanType
from schematics.exceptions import ValidationError
from server.models.dtos.validators import is_known_project_status


class ProjectDTO(Model):
    project_id = IntType()
    for_create = BooleanType(default=False)  # True if we're creating a project, false if we updating existing project
    project_name = StringType(required=True, serialized_name='projectName')
    project_status = StringType(serialized_name='projectStatus', validators=[is_known_project_status])
    area_of_interest = BaseType(serialized_name='areaOfInterest')
    tasks = BaseType()

    def validate_for_create(self, data, value):
        """ Helper method to ensure appropriate properties set on Project PUT api"""
        if not data['for_create']:
            return

        if None in [data['area_of_interest'], data['tasks']]:
            raise ValidationError('Empty required field detected')

        return value
