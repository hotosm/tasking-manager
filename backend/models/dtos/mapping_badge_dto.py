from typing import Optional, List
from pydantic import BaseModel, Field


class MappingBadgeDTO(BaseModel):
    id: int
    name: str
    description: str
    image_path: Optional[str] = Field(default=None, alias="imagePath")
    requirements: Optional[str]
    is_enabled: bool = Field(default=True, alias="isEnabled")


class MappingBadgeCreateDTO(BaseModel):
    name: str
    description: str
    image_path: str = Field(alias="imagePath")
    requirements: str
    is_enabled: bool = Field(default=True, alias="isEnabled")


class MappingBadgeUpdateDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image_path: Optional[str] = Field(default=None, alias="imagePath")
    requirements: Optional[str] = None
    is_enabled: Optional[bool] = Field(default=None, alias="isEnabled")


class MappingBadgeListDTO(BaseModel):
    badges: List[MappingBadgeDTO]
