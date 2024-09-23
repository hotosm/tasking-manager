from pydantic import BaseModel, Field
from typing import List, Optional


class MappingIssueCategoryDTO(BaseModel):
    """DTO used to define a mapping-issue category"""

    category_id: int = Field(None, alias="categoryId")
    name: str = Field(None, alias="name")
    description: str = Field(None, alias="description")
    archived: bool = Field(False, alias="archived")


class MappingIssueCategoriesDTO(BaseModel):
    """DTO for all mapping-issue categories"""

    categories: List[MappingIssueCategoryDTO] = Field([], alias="categories")


class TaskMappingIssueDTO(BaseModel):
    """DTO used to define a single mapping issue recorded with a task invalidation"""

    category_id: Optional[int] = Field(alias="categoryId", default=None)
    name: Optional[str] = None
    count: Optional[int] = None

    class Config:
        populate_by_name = True
