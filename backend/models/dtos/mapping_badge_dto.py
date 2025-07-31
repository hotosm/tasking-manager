import json

from typing import Optional, List
from pydantic import BaseModel, Field, ValidationInfo, field_validator


class MappingBadgeDTO(BaseModel):
    id: int
    name: str
    description: str
    image_path: Optional[str] = Field(default=None, alias="imagePath")
    requirements: Optional[str]
    is_enabled: bool = Field(default=True, alias="isEnabled")
    is_internal: bool = Field(default=False, alias="isInternal")


class MappingBadgePublicDTO(BaseModel):
    id: int
    name: str
    description: str
    image_path: Optional[str] = Field(default=None, alias="imagePath")


def has_valid_requirements(value: str) -> str:
    try:
        v = json.loads(value)

        if len(v.keys()) == 0:
            raise ValueError("needs at least one requirement")
    except json.decoder.JSONDecodeError:
        raise ValueError("invalid json")

    return value


class MappingBadgeCreateDTO(BaseModel):
    name: str
    description: str
    image_path: str = Field(alias="imagePath")
    requirements: str
    is_enabled: bool = Field(default=True, alias="isEnabled")
    is_internal: bool = Field(default=False, alias="isInternal")

    @field_validator("requirements")
    @classmethod
    def has_valid_requirements(cls, value: str, info: ValidationInfo):
        return has_valid_requirements(value)


class MappingBadgeUpdateDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image_path: Optional[str] = Field(default=None, alias="imagePath")
    requirements: Optional[str] = None
    is_enabled: Optional[bool] = Field(default=None, alias="isEnabled")
    is_internal: bool = Field(default=False, alias="isInternal")

    @field_validator("requirements")
    @classmethod
    def has_valid_requirements(cls, value: str, info: ValidationInfo):
        return has_valid_requirements(value)


class MappingBadgeListDTO(BaseModel):
    badges: List[MappingBadgeDTO]


class MappingBadgePublicListDTO(BaseModel):
    badges: List[MappingBadgePublicDTO]
