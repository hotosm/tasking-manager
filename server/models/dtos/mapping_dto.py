from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType, DateTimeType, BooleanType
from schematics.types.compound import ListType, ModelType
from server.models.postgis.statuses import TaskStatus


def is_valid_mapped_status(value):
    """ Validates that Task Status is in correct range for after mapping """
    valid_values = f'{TaskStatus.DONE.name}, {TaskStatus.INVALIDATED.name}, {TaskStatus.BADIMAGERY.name},' \
                   f' {TaskStatus.READY.name}'

    try:
        mapped_status = TaskStatus[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown task status. Valid values are {valid_values}')

    if mapped_status == TaskStatus.VALIDATED:
        raise ValidationError(f'Invalid task Status. Valid values are {valid_values}')


class LockTaskDTO(Model):
    """ DTO used to lock a task for mapping """
    project_id = IntType(required=True)
    task_id = IntType(required=True)
    user_id = IntType(required=True)


class MappedTaskDTO(Model):
    """ Describes the model used to update the status of one task after mapping """
    project_id = IntType(required=True, serialized_name='projectId')
    task_id = IntType(required=True, serialized_name='taskId')
    user_id = IntType(required=True)
    status = StringType(required=True, validators=[is_valid_mapped_status])
    comment = StringType()


class TaskHistoryDTO(Model):
    """ Describes an individual action that was performed on a mapping task"""
    action = StringType()
    action_text = StringType(serialized_name='actionText')
    action_date = DateTimeType(serialized_name='actionDate')
    action_by = StringType(serialized_name='actionBy')


class TaskDTO(Model):
    """ Describes a Task DTO """
    task_id = IntType(serialized_name='taskId')
    project_id = IntType(serialized_name='projectId')
    task_status = StringType(serialized_name='taskStatus')
    task_locked = BooleanType(serialized_name='taskLocked')
    lock_holder = StringType(serialized_name='lockHolder', serialize_when_none=False)
    task_history = ListType(ModelType(TaskHistoryDTO), serialized_name='taskHistory')


class TaskDTOs(Model):
    """ Describes an array of Task DTOs"""
    tasks = ListType(ModelType(TaskDTO))
