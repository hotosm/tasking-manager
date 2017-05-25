from schematics import Model
from schematics.types import StringType
from schematics.types.compound import ListType


class TagsDTO(Model):
    """ DTO used to define available tags """
    tags = ListType(StringType)
