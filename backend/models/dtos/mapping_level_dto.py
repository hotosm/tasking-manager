from typing import Optional
from pydantic import BaseModel, Field


class MappingLevelDTO(BaseModel):
    id: int
    name: str
    image_path: Optional[str]
    approvals_required: int = Field(default=0, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    ordering: int
    is_beginner: bool = Field(default=False, alias="isBeginner")
