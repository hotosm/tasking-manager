from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ValidationError, validator

from backend.models.dtos.mapping_issues_dto import TaskMappingIssueDTO
from backend.models.dtos.task_annotation_dto import TaskAnnotationDTO
from backend.models.postgis.statuses import TaskStatus


def is_valid_mapped_status(value):
    """Validates that Task Status is in correct range for after mapping"""
    valid_values = f"{TaskStatus.MAPPED.name}, {TaskStatus.INVALIDATED.name}, {TaskStatus.BADIMAGERY.name}"

    try:
        mapped_status = TaskStatus[value.upper()]
    except KeyError:
        raise ValidationError(f"Unknown task status. Valid values are {valid_values}")

    if mapped_status == TaskStatus.VALIDATED:
        raise ValidationError(f"Invalid task Status. Valid values are {valid_values}")


class LockTaskDTO(BaseModel):
    """DTO used to lock a task for mapping"""

    user_id: int
    task_id: int
    project_id: int
    preferred_locale: str = "en"

    @validator("preferred_locale", pre=True, always=True)
    def set_default_preferred_locale(cls, v):
        return v or "en"


class MappedTaskDTO(BaseModel):
    """Describes the model used to update the status of one task after mapping"""

    user_id: int
    status: str = Field(required=True, validators=[is_valid_mapped_status])
    comment: Optional[str] = None
    task_id: int
    project_id: int
    preferred_locale: str = "en"


class StopMappingTaskDTO(BaseModel):
    user_id: int
    comment: Optional[str] = None
    task_id: int
    project_id: int
    preferred_locale: str = Field(default="en")


class TaskHistoryDTO(BaseModel):
    """Describes an individual action that was performed on a mapping task"""

    history_id: Optional[int] = Field(alias="historyId", default=None)
    task_id: Optional[int] = Field(alias="taskId", default=None)
    action: Optional[str] = None
    action_text: Optional[str] = Field(alias="actionText", default=None)
    action_date: datetime = Field(alias="actionDate", default=None)
    action_by: Optional[str] = Field(alias="actionBy", default=None)
    picture_url: Optional[str] = Field(alias="pictureUrl", default=None)
    issues: Optional[List[TaskMappingIssueDTO]] = None

    class Config:
        populate_by_name = True

        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


class TaskStatusDTO(BaseModel):
    """Describes a DTO for the current status of the task"""

    task_id: Optional[int] = Field(alias="taskId", default=None)
    task_status: Optional[str] = Field(alias="taskStatus", default=None)
    action_date: Optional[datetime] = Field(alias="actionDate", default=None)
    action_by: Optional[str] = Field(alias="actionBy", default=None)

    class Config:
        populate_by_name = True

        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


class TaskDTO(BaseModel):
    """Describes a Task DTO"""

    task_id: Optional[int] = Field(None, alias="taskId")
    project_id: Optional[int] = Field(None, alias="projectId")
    task_status: Optional[str] = Field(None, alias="taskStatus")
    lock_holder: Optional[str] = Field(
        None, alias="lockHolder", serialize_when_none=False
    )
    task_history: Optional[List[TaskHistoryDTO]] = Field(None, alias="taskHistory")
    task_annotations: Optional[List[TaskAnnotationDTO]] = Field(
        None, alias="taskAnnotation"
    )
    per_task_instructions: Optional[str] = Field(
        None, alias="perTaskInstructions", serialize_when_none=False
    )
    auto_unlock_seconds: Optional[int] = Field(None, alias="autoUnlockSeconds")
    last_updated: Optional[datetime] = Field(
        None, alias="lastUpdated", serialize_when_none=False
    )
    comments_number: Optional[int] = Field(None, alias="numberOfComments")

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


class TaskDTOs(BaseModel):
    """Describes an array of Task DTOs"""

    tasks: Optional[List[TaskDTO]] = None


class TaskCommentDTO(BaseModel):
    """Describes the model used to add a standalone comment to a task outside of mapping/validation"""

    user_id: int = Field(..., alias="userId")
    comment: str
    task_id: int = Field(..., alias="taskId")
    project_id: int = Field(..., alias="projectId")
    preferred_locale: str = Field("en")

    class Config:
        populate_by_name = True


class ExtendLockTimeDTO(BaseModel):
    """DTO used to extend expiry time of tasks"""

    project_id: int
    task_ids: List[int] = Field(alias="taskIds")
    user_id: int

    class Config:
        populate_by_name = True
