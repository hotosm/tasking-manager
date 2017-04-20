from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType
from server.models.postgis.statuses import MappingLevel


def is_known_mapping_level(value):
    """ Validates that Project Status is known value """
    try:
        MappingLevel[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown mappingLevel: {value} Valid values are {MappingLevel.BEGINNER.name}, '
                              f'{MappingLevel.INTERMEDIATE.name}, {MappingLevel.ADVANCED.name}')


class UserDTO(Model):
    """ DTO for User """
    username = StringType(required=True)
    role = StringType(required=True)
    mapping_level = StringType(required=True, serialized_name='mappingLevel', validators=[is_known_mapping_level])
    tasks_mapped = IntType(serialized_name='tasksMapped')
    tasks_validated = IntType(serialized_name='tasksValidated')


class UserOSMDTO(Model):
    """ DTO containing OSM details for the user """
    account_created = StringType(required=True, serialized_name='accountCreated')
    changeset_count = IntType(required=True, serialized_name='changesetCount')
