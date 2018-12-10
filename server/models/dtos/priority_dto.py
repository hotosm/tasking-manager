from schematics import Model
from schematics.types import BaseType, StringType, IntType, DateTimeType
from schematics.types.compound import ListType, ModelType
from geoalchemy2.types import Geography


class PriorityDTO(Model):
    """ DTO used to define a priority dataset """
    priority_id = IntType(serialized_name='priorityId')
    name = StringType(required=True)
    filesize = IntType()
    uploaded_by = IntType(serialized_name='uploadedBy')
    uploaded_on = DateTimeType(serialized_name='uploadedOn')
    geometry = Geography()


class PriorityListDTO(Model):
    """ DTO for all priority datasets """
    def __init__(self):
        super().__init__()
        self.priorities = []

    priorities = ListType(ModelType(PriorityDTO))
