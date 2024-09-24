from backend.models.postgis.statuses import TaskStatus
from backend.models.dtos.stats_dto import Pagination
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ExtendedStringType(str):
    converters = []

    def __init__(self, **kwargs):
        """
        This takes in all the inputs as String Type, but takes in an extra
        input called converters.

        Converters must be a list of functions, and each of those functions
        must take in exactly 1 value , and return the transformed input.
        The order of the converters is important, as the input will be
        transformed in the order of the converters.
        """
        if "converters" in kwargs:
            self.converters = kwargs["converters"]
            del kwargs["converters"]
        super().__init__(**kwargs)

    def convert(self, value, context=None):
        value = super().convert(value, context)
        for func in self.converters:
            value = func(value)
        return (
            value  # will have a value after going through all the conversions in order
        )


def is_valid_validated_status(value):
    """Validates that Task Status is in correct range for after validation"""
    valid_values = f"{TaskStatus.MAPPED.name}, {TaskStatus.INVALIDATED.name}, {TaskStatus.VALIDATED.name}"

    try:
        validated_status = TaskStatus[value.upper()]
    except KeyError:
        raise ValidationError(f"Unknown task status. Valid values are {valid_values}")

    if validated_status not in [
        TaskStatus.MAPPED,
        TaskStatus.INVALIDATED,
        TaskStatus.VALIDATED,
    ]:
        raise ValidationError(f"Invalid status.  Valid values are {valid_values}")


def is_valid_revert_status(value):
    """Validates that Task Status is in correct range for revert while reverting tasks for a user"""
    valid_values = f"{TaskStatus.BADIMAGERY.name}, {TaskStatus.VALIDATED.name}"

    try:
        validated_status = TaskStatus[value.upper()]
    except KeyError:
        raise ValidationError(f"Unknown task status. Valid values are {valid_values}")

    if validated_status not in [
        TaskStatus.VALIDATED,
        TaskStatus.BADIMAGERY,
    ]:
        raise ValidationError(f"Invalid status.  Valid values are {valid_values}")


class LockForValidationDTO(BaseModel):
    """DTO used to lock multiple tasks for validation"""

    project_id: int
    task_ids: List[int] = Field(None, alias="taskIds")
    user_id: int
    preferred_locale: str = "en"

    class Config:
        populate_by_name = True


class ValidationMappingIssue(BaseModel):
    """Describes one or more occurrences of an identified mapping problem during validation"""

    mapping_issue_category_id: int = Field(None, alias="mappingIssueCategoryId")
    issue: str
    count: int

    class Config:
        populate_by_name = True


class ValidatedTask(BaseModel):
    """Describes the model used to update the status of one task after validation"""

    task_id: int = Field(None, alias="taskId")
    status: str = Field(None, validators=[is_valid_validated_status])
    comment: Optional[str] = None
    issues: Optional[List[ValidationMappingIssue]] = Field(
        None, alias="validationIssues"
    )

    class Config:
        populate_by_name = True


class ResetValidatingTask(BaseModel):
    """Describes the model used to stop validating and reset the status of one task"""

    task_id: int = Field(None, alias="taskId")
    comment: str = Field()
    issues: List[ValidationMappingIssue] = Field(None, alias="validationIssues")

    class Config:
        populate_by_name = True


class UnlockAfterValidationDTO(BaseModel):
    """DTO used to transmit the status of multiple tasks after validation"""

    project_id: int
    validated_tasks: List[ValidatedTask] = Field(None, alias="validatedTasks")
    user_id: int
    preferred_locale: str = Field(default="en")

    class Config:
        populate_by_name = True


class StopValidationDTO(BaseModel):
    """DTO used to transmit the the request to stop validating multiple tasks"""

    project_id: int
    reset_tasks: List[ResetValidatingTask] = Field(None, alias="resetTasks")
    user_id: int
    preferred_locale: str = Field(default="en")

    class Config:
        populate_by_name = True


class MappedTasksByUser(BaseModel):
    """Describes number of tasks user has mapped on a project"""

    username: str = Field(None)
    mapped_task_count: int = Field(None, alias="mappedTaskCount")
    tasks_mapped: List[int] = Field(None, alias="tasksMapped")
    last_seen: datetime = Field(None, alias="lastSeen")
    mapping_level: str = Field(None, alias="mappingLevel")
    date_registered: datetime = Field(alias="dateRegistered")
    last_validation_date: datetime = Field(alias="lastValidationDate")

    class Config:
        populate_by_name = True


class InvalidatedTask(BaseModel):
    """Describes invalidated tasks with which user is involved"""

    task_id: int = Field(None, alias="taskId")
    project_id: int = Field(None, alias="projectId")
    project_name: str = Field(alias="projectName")
    history_id: int = Field(alias="historyId")
    closed: bool
    updated_date: datetime = Field(alias="updatedDate")

    class Config:
        populate_by_name = True


class InvalidatedTasks(BaseModel):
    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.invalidated_tasks = []

    invalidated_tasks: List[InvalidatedTask] = Field(alias="invalidatedTasks")
    pagination: Pagination

    class Config:
        populate_by_name = True


class MappedTasks(BaseModel):
    """Describes all tasks currently mapped on a project"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.mapped_tasks = []

    mapped_tasks: List[MappedTasksByUser] = Field(alias="mappedTasks")

    class Config:
        populate_by_name = True


class RevertUserTasksDTO(BaseModel):
    """DTO used to revert all tasks to a given status"""

    preferred_locale: str = "en"
    project_id: int
    user_id: int
    action_by: int
    action: str
    # action: ExtendedStringType = Field(
    #     validators=[is_valid_revert_status], converters=[str.upper]
    # )

    class Config:
        populate_by_name = True
