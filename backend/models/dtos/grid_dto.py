from pydantic import BaseModel, Field


class GridDTO(BaseModel):
    """Describes JSON model used for creating grids"""

    area_of_interest: dict = Field(..., alias="areaOfInterest")
    grid: dict = Field(..., alias="grid")
    clip_to_aoi: bool = Field(..., alias="clipToAoi")

    class Config:
        populate_by_name = True


class SplitTaskDTO(BaseModel):
    """DTO used to split a task"""

    user_id: int = Field(alias="userId")
    task_id: int = Field(alias="taskId")
    project_id: int = Field(alias="projectId")
    preferred_locale: str = "en"

    class Config:
        populate_by_name = True
