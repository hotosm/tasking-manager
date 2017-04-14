from schematics import Model
from schematics.types import StringType
from schematics.types.compound import ListType


class TagsDTO(Model):
    """ DTO used to lock a task for mapping """
    tags = ListType(StringType)
