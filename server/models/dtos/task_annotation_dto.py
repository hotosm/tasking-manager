from schematics import Model
from schematics.types import StringType, IntType
from schematics.types.compound import DictType

class TaskAnnotationDTO(Model):
    """ Model for a single task annotation """
    task_id = IntType(required=True, serialized_name='taskId')
    annotation_type = StringType(required=True, serialized_name='annotationType')
    annotation_source = StringType(serialized_name='annotationSource')
    properties = DictType(StringType, serialized_name='properties')
