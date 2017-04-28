from enum import Enum


class ProjectStatus(Enum):
    """ Enum to describes all possible states of a Mapping Project """
    # TODO add DELETE state, others??
    ARCHIVED = 0
    PUBLISHED = 1
    DRAFT = 2


class ProjectPriority(Enum):
    """ Enum to describe all possible project priority levels """
    URGENT = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3


class TaskStatus(Enum):
    """ Enum describing available Task Statuses """
    READY = 0
    LOCKED_FOR_MAPPING = 1
    MAPPED = 2
    LOCKED_FOR_VALIDATION = 3
    VALIDATED = 4
    INVALIDATED = 5
    BADIMAGERY = 6  # Task cannot be mapped because of clouds, fuzzy imagery
    # REMOVED = -1 TODO this looks weird can it be removed


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


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """
    MAPPER = 0
    ADMIN = 1
    PROJECT_MANAGER = 2
    VALIDATOR = 4
