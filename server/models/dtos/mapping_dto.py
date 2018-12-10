from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType, DateTimeType, BooleanType
from schematics.types.compound import ListType, ModelType
from server.models.postgis.statuses import TaskStatus


def is_valid_mapped_status(value):
    """ Validates that Task Status is in correct range for after mapping """
    valid_values = f'{TaskStatus.MAPPED.name}, {TaskStatus.INVALIDATED.name}, {TaskStatus.BADIMAGERY.name}'

    try:
        mapped_status = TaskStatus[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown task status. Valid values are {valid_values}')

    if mapped_status == TaskStatus.VALIDATED:
        raise ValidationError(f'Invalid task Status. Valid values are {valid_values}')


class LockTaskDTO(Model):
    """ DTO used to lock a task for mapping """
    user_id = IntType(required=True)
    task_id = IntType(required=True)
    project_id = IntType(required=True)
    preferred_locale = StringType(default='en')


class MappedTaskDTO(Model):
    """ Describes the model used to update the status of one task after mapping """
    user_id = IntType(required=True)
    status = StringType(required=True, validators=[is_valid_mapped_status])
    comment = StringType()
    task_id = IntType(required=True)
    project_id = IntType(required=True)
    preferred_locale = StringType(default='en')


class StopMappingTaskDTO(Model):
    """ Describes the model used to stop mapping and reset the status of one task """
    user_id = IntType(required=True)
    comment = StringType()
    task_id = IntType(required=True)
    project_id = IntType(required=True)
    preferred_locale = StringType(default='en')


class TaskHistoryDTO(Model):
    """ Describes an individual action that was performed on a mapping task"""
    history_id = IntType(serialized_name='historyId')
    task_id = StringType(serialized_name='taskId')
    action = StringType()
    action_text = StringType(serialized_name='actionText')
    action_date = DateTimeType(serialized_name='actionDate')
    action_by = StringType(serialized_name='actionBy')


class TaskDTO(Model):
    """ Describes a Task DTO """
    task_id = IntType(serialized_name='taskId')
    project_id = IntType(serialized_name='projectId')
    task_status = StringType(serialized_name='taskStatus')
    lock_holder = StringType(serialized_name='lockHolder', serialize_when_none=False)
    task_history = ListType(ModelType(TaskHistoryDTO), serialized_name='taskHistory')
    per_task_instructions = StringType(serialized_name='perTaskInstructions', serialize_when_none=False)
    priority = IntType(serialized_name='priority')
    is_undoable = BooleanType(serialized_name='isUndoable', default=False)
    auto_unlock_seconds = IntType(serialized_name='autoUnlockSeconds')


class TaskDTOs(Model):
    """ Describes an array of Task DTOs"""
    tasks = ListType(ModelType(TaskDTO))

class TaskCommentDTO(Model):
    """ Describes the model used to add a standalone comment to a task outside of mapping/validation """
    user_id = IntType(required=True)
    comment = StringType(required=True)
    task_id = IntType(required=True)
    project_id = IntType(required=True)
    preferred_locale = StringType(default='en')
