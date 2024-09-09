from pydantic import BaseModel, Field
from typing import List, Optional


class MappingIssueCategoryDTO(BaseModel):
    """DTO used to define a mapping-issue category"""

    category_id: int = Field(alias="categoryId")
    name: str
    description: str
    archived: bool


class MappingIssueCategoriesDTO(BaseModel):
    """DTO for all mapping-issue categories"""

    def __init__(self):
        super().__init__()
        self.categories = []

    categories: List[MappingIssueCategoryDTO]


class TaskMappingIssueDTO(BaseModel):
    """DTO used to define a single mapping issue recorded with a task invalidation"""

    category_id: Optional[int] = Field(alias="categoryId", default=None)
    name: Optional[str] = None
    count: Optional[int] = None
