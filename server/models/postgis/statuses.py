from enum import Enum


class ProjectStatus(Enum):
    """ Enum to describes all possible states of a Mapping Project """
    # TODO add DELETE state, others??
    ARCHIVED = 0
    PUBLISHED = 1
    DRAFT = 2