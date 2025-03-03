from typing import List, Optional

from pydantic import BaseModel


class TagsDTO(BaseModel):
    """DTO used to define available tags"""

    tags: Optional[List[str]] = None
