from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType, EmailType
from schematics.types.compound import ListType, ModelType, BaseType
from server.models.dtos.stats_dto import Pagination
from server.models.postgis.statuses import MappingLevel, UserRole


def is_known_mapping_level(value):
    """ Validates that supplied mapping level is known value """
    try:
        MappingLevel[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown mappingLevel: {value} Valid values are {MappingLevel.BEGINNER.name}, '
                              f'{MappingLevel.INTERMEDIATE.name}, {MappingLevel.ADVANCED.name}')


def is_known_role(value):
    """ Validates that supplied user role is known value """
    try:
        UserRole[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown mappingLevel: {value} Valid values are {UserRole.ADMIN.name}, '
                              f'{UserRole.PROJECT_MANAGER.name}, {UserRole.MAPPER.name}, {UserRole.VALIDATOR.name}')


class UserDTO(Model):
    """ DTO for User """
    username = StringType()
    role = StringType()
    mapping_level = StringType(serialized_name='mappingLevel', validators=[is_known_mapping_level])
    tasks_mapped = IntType(serialized_name='tasksMapped')
    tasks_validated = IntType(serialized_name='tasksValidated')
    email_address = EmailType(serialized_name='emailAddress', serialize_when_none=False)
    twitter_id = StringType(serialized_name='twitterId')
    facebook_id = StringType(serialized_name='facebookId')
    linkedin_id = StringType(serialized_name='linkedinId')


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


class UserSearchQuery(Model):
    """ Describes a user search query, that a user may submit to filter the list of users """
    username = StringType()
    role = StringType(validators=[is_known_role])
    mapping_level = StringType(serialized_name='mappingLevel', validators=[is_known_mapping_level])
    page = IntType()


class ListedUser(Model):
    """ Describes a user within the User List """
    username = StringType()
    role = StringType()
    mapping_level = StringType(serialized_name='mappingLevel')


class UserSearchDTO(Model):
    """ Paginated list of TM users """
    def __init__(self):
        super().__init__()
        self.users = []

    pagination = ModelType(Pagination)
    users = ListType(ModelType(ListedUser))


class UserFilterDTO(Model):
    """ DTO to hold all Tasking Manager users """
    def __init__(self):
        super().__init__()
        self.usernames = []

    pagination = ModelType(Pagination)
    usernames = ListType(StringType)
