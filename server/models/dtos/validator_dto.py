from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType
from server.models.postgis.statuses import TaskStatus


def is_valid_validated_status(value):
    """ Validates that Task Status is in correct range for after validation """
    valid_values = f'{TaskStatus.MAPPED.name}, {TaskStatus.INVALIDATED.name}, {TaskStatus.VALIDATED.name}'

    try:
        validated_status = TaskStatus[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown task status. Valid values are {valid_values}')

    if validated_status not in [TaskStatus.MAPPED, TaskStatus.INVALIDATED, TaskStatus.VALIDATED]:
        raise ValidationError(f'Invalid status.  Valid values are {valid_values}')


class LockForValidationDTO(Model):
    """ DTO used to lock multiple tasks for validation """
    project_id = IntType(required=True)
    task_ids = ListType(IntType, required=True, serialized_name='taskIds')
    user_id = IntType(required=True)


class ValidatedTask(Model):
    """ Describes the model used to update the status of one task after validation """
    task_id = IntType(required=True, serialized_name='taskId')
    status = StringType(required=True, validators=[is_valid_validated_status])
    comment = StringType()


class UnlockAfterValidationDTO(Model):
    """ DTO used to transmit the status of multiple tasks after validation """
    project_id = IntType(required=True)
    validated_tasks = ListType(ModelType(ValidatedTask), required=True, serialized_name='validatedTasks')
    user_id = IntType(required=True)
