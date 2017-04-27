from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType, BaseType
from server.models.dtos.stats_dto import Pagination
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


class MappedProject(Model):
    """ Describes a single project a user has mapped """
    project_id = IntType(serialized_name='projectId')
    name = StringType()
    tasks_mapped = IntType(serialized_name='tasksMapped')
    tasks_validated = IntType(serialized_name='tasksValidated')
    status = StringType()
    centroid = BaseType()
    aoi = BaseType()


class UserMappedProjectsDTO(Model):
    """ DTO for projects a user has mapped """
    def __init__(self):
        super().__init__()
        self.mapped_projects = []

    mapped_projects = ListType(ModelType(MappedProject), serialized_name='mappedProjects')


class TMUsersDTO(Model):
    """ DTO to hold all Tasking Manager users """
    def __init__(self):
        super().__init__()
        self.usernames = []

    pagination = ModelType(Pagination)
    usernames = ListType(StringType)
