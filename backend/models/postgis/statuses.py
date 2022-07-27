from enum import Enum


class ProjectStatus(Enum):
    """ Enum to describes all possible states of a Mapping Project """

    ARCHIVED = 0
    PUBLISHED = 1
    DRAFT = 2


class ProjectPriority(Enum):
    """ Enum to describe all possible project priority levels """

    URGENT = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3


class TaskCreationMode(Enum):
    """ Enum to describe task creation mode """

    GRID = 0
    ARBITRARY = 1


class TaskStatus(Enum):
    """ Enum describing available Task Statuses """

    READY = 0
    LOCKED_FOR_MAPPING = 1
    MAPPED = 2
    LOCKED_FOR_VALIDATION = 3
    VALIDATED = 4
    INVALIDATED = 5
    BADIMAGERY = 6  # Task cannot be mapped because of clouds, fuzzy imagery
    SPLIT = 7  # Task has been split


class MappingLevel(Enum):
    """ The mapping level the mapper has achieved """

    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3


class MappingTypes(Enum):
    """ Enum describing types of mapping a project may specify"""

    ROADS = 1
    BUILDINGS = 2
    WATERWAYS = 3
    LAND_USE = 4
    OTHER = 5


class MappingNotAllowed(Enum):
    """ Enum describing reasons a user cannot map """

    USER_ALREADY_HAS_TASK_LOCKED = 100
    USER_NOT_CORRECT_MAPPING_LEVEL = 101
    USER_NOT_ACCEPTED_LICENSE = 102
    USER_NOT_ON_ALLOWED_LIST = 103
    PROJECT_NOT_PUBLISHED = 104
    USER_NOT_TEAM_MEMBER = 105
    PROJECT_HAS_NO_TEAM = 106
    NOT_A_MAPPING_TEAM = 107


class ValidatingNotAllowed(Enum):
    """ Enum describing reasons a user cannot validate """

    USER_NOT_VALIDATOR = 100
    USER_NOT_ACCEPTED_LICENSE = 101
    USER_NOT_ON_ALLOWED_LIST = 102
    PROJECT_NOT_PUBLISHED = 103
    USER_IS_BEGINNER = 104
    NOT_A_VALIDATION_TEAM = 105
    USER_NOT_TEAM_MEMBER = 106
    PROJECT_HAS_NO_TEAM = 107
    USER_ALREADY_HAS_TASK_LOCKED = 108


class UserGender(Enum):
    """ Describes the gender a user can be assigned"""

    MALE = 1
    FEMALE = 2
    SELF_DESCRIBE = 3
    PREFER_NOT = 4


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """

    READ_ONLY = -1
    MAPPER = 0
    ADMIN = 1


class Editors(Enum):
    """ Enum describing the possible editors for projects """

    ID = 0
    JOSM = 1
    POTLATCH_2 = 2
    FIELD_PAPERS = 3
    CUSTOM = 4
    RAPID = 5


class TeamVisibility(Enum):
    """ Describes the visibility associated with an Team """

    PUBLIC = 0
    PRIVATE = 1


class TeamRoles(Enum):
    """ Describes the role a Team has within a Project """

    READ_ONLY = -1
    MAPPER = 0
    VALIDATOR = 1
    PROJECT_MANAGER = 2


class TeamMemberFunctions(Enum):
    """ Describes the function a member can hold within a team """

    MANAGER = 1
    MEMBER = 2


class MappingPermission(Enum):
    """ Describes a set of permissions for mapping on a project """

    ANY = 0
    LEVEL = 1
    TEAMS = 2
    TEAMS_LEVEL = 3


class ValidationPermission(Enum):
    """ Describes a set of permissions for validating on a project """

    ANY = 0
    LEVEL = 1
    TEAMS = 2
    TEAMS_LEVEL = 3


class OrganisationType(Enum):
    """ Describes an organisation's subscription type """

    FREE = 1
    DISCOUNTED = 2
    FULL_FEE = 3


class EncouragingEmailType(Enum):
    """ Describes the type of encouraging email sent to users """

    PROJECT_PROGRESS = 1  # Send encouraging email to mappers when a project they have contributed to make progress
    PROJECT_COMPLETE = 2  # Send encouraging email to mappers when a project they have contributed to is complete
    BEEN_SOME_TIME = 3  # Send encouraging email to mappers who haven't been active for some time on the site
