from typing import Optional, List
from pydantic import BaseModel, Field, ValidationInfo, field_validator


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


def has_badges(value: list) -> list:
    if len(value) == 0:
        raise ValueError("needs at least one badge")

    return value


class MappingLevelCreateDTO(BaseModel):
    name: str
    approvals_required: int = Field(default=0, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    is_beginner: bool = Field(default=False, alias="isBeginner")
    required_badges: List[AssociatedBadge] = Field(default=[], alias="requiredBadges")

    @field_validator("required_badges")
    @classmethod
    def has_badges(cls, value: str, info: ValidationInfo):
        return has_badges(value)


class MappingLevelUpdateDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    approvals_required: Optional[int] = Field(default=None, alias="approvalsRequired")
    color: Optional[str] = Field(default=None)
    is_beginner: Optional[bool] = Field(default=False, alias="isBeginner")
    required_badges: List[AssociatedBadge] = Field(default=[], alias="requiredBadges")

    @field_validator("required_badges")
    @classmethod
    def has_badges(cls, value: str, info: ValidationInfo):
        if info.data["is_beginner"]:
            return value

        return has_badges(value)


class MappingLevelListDTO(BaseModel):
    levels: List[MappingLevelDTO]
