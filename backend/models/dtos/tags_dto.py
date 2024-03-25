from pydantic import BaseModel
from typing import List, Optional


class TagsDTO(BaseModel):
    """DTO used to define available tags"""

    tags: Optional[List[str]] = None
