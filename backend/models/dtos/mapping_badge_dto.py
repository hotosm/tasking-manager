from typing import Optional
from pydantic import BaseModel, Field


class MappingBadgeDTO(BaseModel):
    id: int
    name: str
    description: str
    image_path: Optional[str]
    requirements: Optional[str]
    is_enabled: bool = Field(default=True, alias="isEnabled")


class MappingBadgeCreateDTO(BaseModel):
    name: str
    description: str
    image_path: Optional[str]
    requirements: Optional[str]
    is_enabled: bool = Field(default=True, alias="isEnabled")
