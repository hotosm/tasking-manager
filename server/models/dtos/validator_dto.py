from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType
from server.models.postgis.statuses import TaskStatus


def is_valid_validated_status(value):
    """ Validates that Task Status is in correct range for after validation """
    try:
        validated_status = TaskStatus[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown projectStatus. Valid values are {TaskStatus.DONE.name}, '
                              f'{TaskStatus.INVALIDATED.name}, {TaskStatus.VALIDATED.name}')

    if validated_status.name not in [TaskStatus.DONE.name, TaskStatus.INVALIDATED.name, TaskStatus.VALIDATED.name]:
        raise ValidationError(f'Invalid status.  Valid values are {TaskStatus.DONE.name}, '
                              f'{TaskStatus.INVALIDATED.name}, {TaskStatus.VALIDATED.name}')


class LockForValidationDTO(Model):
    """ DTO used to lock multiple tasks for validation """
    project_id = IntType(required=True)
    task_ids = ListType(IntType, required=True, serialized_name='taskIds')


class ValidatedTask(Model):
    """ Describes the model used to update the status of one task after validation """
    task_id = IntType(required=True, serialized_name='taskId')
    status = StringType(required=True, validators=[is_valid_validated_status])
    comment = StringType()


class UnlockAfterValidationDTO(Model):
    """ DTO used to transmit the status of multiple tasks after validation """
    project_id = IntType(required=True)
    validated_tasks = ListType(ModelType(ValidatedTask), required=True, serialized_name='validatedTasks')
