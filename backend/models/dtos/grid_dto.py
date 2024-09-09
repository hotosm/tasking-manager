from pydantic import BaseModel, Field


class GridDTO(BaseModel):
    """Describes JSON model used for creating grids"""

    area_of_interest: str = Field(..., alias="areaOfInterest")
    grid: str = Field(..., alias="grid")
    clip_to_aoi: bool = Field(..., alias="clipToAoi")


class SplitTaskDTO(BaseModel):
    """DTO used to split a task"""

    user_id: int = Field(..., alias="userId")
    task_id: int = Field(..., alias="taskId")
    project_id: int = Field(..., alias="projectId")
    preferred_locale: str = "en"
