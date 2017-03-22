from schematics import Model
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType


class LockForValidationDTO(Model):
    """ DTO used to lock multiple tasks for validation """
    project_id = IntType(required=True)
    task_ids = ListType(IntType, required=True, serialized_name='taskIds')


class ValidatedTask(Model):
    """ Describes the model used to update the status of one task after validation """
    task_id = IntType(required=True, serialized_name='taskId')
    status = StringType(required=True)
    comment = StringType()


class UnlockAfterValidationDTO(Model):
    """ DTO used to transmit the status of multiple tasks after validation """
    project_id = IntType(required=True)
    validated_tasks = ListType(ModelType(ValidatedTask), required=True, serialized_name='validatedTasks')
