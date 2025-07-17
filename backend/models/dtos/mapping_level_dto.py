from typing import Optional, List
from pydantic import BaseModel, Field


class AssociatedBadge(BaseModel):
    id: int
    name: Optional[str] = None


class MappingLevelDTO(BaseModel):
    id: int
    name: str
    approvals_required: int = Field(default=0, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    ordering: int
    is_beginner: bool = Field(default=False, alias="isBeginner")
    required_badges: List[AssociatedBadge] = Field(default=[], alias="requiredBadges")


class MappingLevelCreateDTO(BaseModel):
    name: str
    approvals_required: int = Field(default=0, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    is_beginner: bool = Field(default=False, alias="isBeginner")
    required_badges: List[AssociatedBadge] = Field(default=[], alias="requiredBadges")


class MappingLevelUpdateDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    approvals_required: Optional[int] = Field(default=None, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    is_beginner: Optional[bool] = Field(default=False, alias="isBeginner")
    required_badges: List[AssociatedBadge] = Field(default=[], alias="requiredBadges")


class MappingLevelListDTO(BaseModel):
    levels: List[MappingLevelDTO]
