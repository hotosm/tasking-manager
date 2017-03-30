from schematics import Model
from schematics.types import StringType


class UserDTO(Model):
    """ DTO for User """
    username = StringType(required=True)
    role = StringType(required=True)
    mapping_level = StringType(required=True, serialized_name='mappingLevel')
