from typing import Optional, List
from pydantic import BaseModel, Field


class MappingLevelDTO(BaseModel):
    id: int
    name: str
    image_path: Optional[str] = Field(alias="imagePath")
    approvals_required: int = Field(default=0, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    ordering: int
    is_beginner: bool = Field(default=False, alias="isBeginner")


class MappingLevelCreateDTO(BaseModel):
    name: str
    image_path: Optional[str] = Field(default=None, alias="imagePath")
    approvals_required: int = Field(default=0, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    ordering: int
    is_beginner: bool = Field(default=False, alias="isBeginner")


class MappingLevelUpdateDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    image_path: Optional[str] = Field(default=None, alias="imagePath")
    approvals_required: Optional[int] = Field(default=None, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    ordering: Optional[int] = None
    is_beginner: Optional[bool] = Field(default=False, alias="isBeginner")


class MappingLevelListDTO(BaseModel):
    levels: List[MappingLevelDTO]
