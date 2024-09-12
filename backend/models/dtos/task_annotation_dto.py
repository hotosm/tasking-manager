from pydantic import BaseModel, Field
from typing import Optional


class TaskAnnotationDTO(BaseModel):
    """Model for a single task annotation"""

    task_id: Optional[int] = Field(None, alias="taskId")
    annotation_type: Optional[str] = Field(None, alias="annotationType")
    annotation_source: Optional[str] = Field(None, alias="annotationSource")
    annotation_markdown: Optional[str] = Field(None, alias="annotationMarkdown")
    properties: Optional[dict] = Field(None, alias="properties")

    class Config:
        populate_by_name = True
