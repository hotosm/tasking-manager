from schematics import Model
from schematics.types import StringType, IntType, DateTimeType, BooleanType
from schematics.types.compound import ListType, ModelType


class TaskHistoryDTO(Model):
    action = StringType()
    action_text = StringType(serialized_name='actionText')
    action_date = DateTimeType(serialized_name='actionDate')


class TaskDTO(Model):
    """ Describes a Task DTO """
    task_id = IntType(serialized_name='taskId')
    project_id = IntType(serialized_name='projectId')
    task_status = StringType(serialized_name='taskStatus')
    task_locked = BooleanType(serialized_name='taskLocked')
    task_history = ListType(ModelType(TaskHistoryDTO), serialized_name='taskHistory')
