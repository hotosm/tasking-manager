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
