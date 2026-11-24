from datetime import datetime
from typing import List, Optional

from pydantic import (
    BaseModel,
    Field,
    field_serializer,
    field_validator,
    model_validator,
)

from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.statuses import TaskAssignmentStage

# Upper bound on tasks per assign/unassign request, so one request stays one bounded statement.
MAX_TASKS_PER_REQUEST = 5000


def _utc_iso(value: Optional[datetime]) -> Optional[str]:
    """Dates are stored as naive UTC; mark them as UTC so browsers don't read local time."""
    if value is None:
        return None
    return value.isoformat() + "Z" if value.tzinfo is None else value.isoformat()


def _validate_task_ids(value: List[int]) -> List[int]:
    if not value:
        raise ValueError("taskIds must contain at least one task id")
    if len(value) > MAX_TASKS_PER_REQUEST:
        raise ValueError(f"taskIds cannot contain more than {MAX_TASKS_PER_REQUEST}")
    # Keep the first occurrence order, drop duplicates.
    return list(dict.fromkeys(value))


def _validate_stage(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    value = value.upper()
    if value not in TaskAssignmentStage.__members__:
        raise ValueError(
            f"stage must be one of {', '.join(TaskAssignmentStage.__members__)}"
        )
    return value


class AssignTasksDTO(BaseModel):
    """Request body for assigning tasks to a user or a team"""

    task_ids: List[int] = Field(..., alias="taskIds")
    stage: str = Field(TaskAssignmentStage.MAPPING.name)
    user_id: Optional[int] = Field(None, alias="userId")
    team_id: Optional[int] = Field(None, alias="teamId")
    notify: bool = True

    class Config:
        populate_by_name = True

    @field_validator("task_ids")
    @classmethod
    def check_task_ids(cls, value):
        return _validate_task_ids(value)

    @field_validator("stage")
    @classmethod
    def check_stage(cls, value):
        return _validate_stage(value)

    @model_validator(mode="after")
    def check_one_assignee(self):
        if (self.user_id is None) == (self.team_id is None):
            raise ValueError("Provide exactly one of userId or teamId")
        return self


class UnassignTasksDTO(BaseModel):
    """Request body for removing task assignments"""

    task_ids: List[int] = Field(..., alias="taskIds")
    stage: Optional[str] = None  # None removes both stages

    class Config:
        populate_by_name = True

    @field_validator("task_ids")
    @classmethod
    def check_task_ids(cls, value):
        return _validate_task_ids(value)

    @field_validator("stage")
    @classmethod
    def check_stage(cls, value):
        return _validate_stage(value)


class AssignmentWarningDTO(BaseModel):
    """A non-blocking problem the project manager should know about"""

    sub_code: str = Field(..., serialization_alias="subCode")
    message: str


class AssignTasksResultDTO(BaseModel):
    assigned: int
    warnings: List[AssignmentWarningDTO] = Field(default_factory=list)


class TaskAssignmentDTO(BaseModel):
    """One task's assignment for one stage"""

    task_id: int = Field(..., serialization_alias="taskId")
    stage: str
    assignee_type: str = Field(..., serialization_alias="assigneeType")
    user_id: Optional[int] = Field(None, serialization_alias="userId")
    username: Optional[str] = None
    team_id: Optional[int] = Field(None, serialization_alias="teamId")
    team_name: Optional[str] = Field(None, serialization_alias="teamName")
    assigned_by: Optional[str] = Field(None, serialization_alias="assignedBy")
    assigned_date: Optional[datetime] = Field(None, serialization_alias="assignedDate")

    @field_serializer("assigned_date")
    def serialize_assigned_date(self, value):
        return _utc_iso(value)


class ProjectTaskAssignmentsDTO(BaseModel):
    assignments: List[TaskAssignmentDTO] = Field(default_factory=list)


class AssignedTaskDTO(BaseModel):
    """A task assigned to the current user, directly or through a team"""

    project_id: int = Field(..., serialization_alias="projectId")
    project_name: Optional[str] = Field(None, serialization_alias="projectName")
    task_id: int = Field(..., serialization_alias="taskId")
    task_status: str = Field(..., serialization_alias="taskStatus")
    stage: str
    assignee_type: str = Field(..., serialization_alias="assigneeType")
    team_id: Optional[int] = Field(None, serialization_alias="teamId")
    team_name: Optional[str] = Field(None, serialization_alias="teamName")
    assigned_by: Optional[str] = Field(None, serialization_alias="assignedBy")
    assigned_date: Optional[datetime] = Field(None, serialization_alias="assignedDate")

    @field_serializer("assigned_date")
    def serialize_assigned_date(self, value):
        return _utc_iso(value)


class AssignedTasksDTO(BaseModel):
    tasks: List[AssignedTaskDTO] = Field(default_factory=list)
    pagination: Optional[Pagination] = None
