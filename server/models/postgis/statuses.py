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
    SPLIT = 7


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


class ValidatingNotAllowed(Enum):
    """ Enum describing reasons a user cannot map """
    USER_NOT_VALIDATOR = 100
    USER_NOT_ACCEPTED_LICENSE = 101
    USER_NOT_ON_ALLOWED_LIST = 102
    PROJECT_NOT_PUBLISHED = 103


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """
    READ_ONLY = -1
    MAPPER = 0
    ADMIN = 1
    PROJECT_MANAGER = 2
    VALIDATOR = 4
