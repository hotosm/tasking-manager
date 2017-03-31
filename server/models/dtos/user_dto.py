from schematics import Model
from schematics.types import StringType, IntType


class UserDTO(Model):
    """ DTO for User """
    username = StringType(required=True)
    role = StringType(required=True)
    mapping_level = StringType(required=True, serialized_name='mappingLevel')


class UserOSMDTO(Model):
    """ DTO containing OSM details for the user """
    account_created = StringType(required=True, serialized_name='accountCreated')
    changeset_count = IntType(required=True, serialized_name='changesetCount')
