from schematics import Model
from schematics.types import StringType, IntType, DateTimeType, BooleanType
from schematics.types.compound import ListType, ModelType


class LockForValidationDTO(Model):
    """ Describes the model validator will provide when unlocking tasks"""
    project_id = IntType(required=True)
    task_ids = ListType(IntType, required=True, serialized_name='taskIds')
