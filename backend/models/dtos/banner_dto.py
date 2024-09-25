from pydantic import BaseModel, Field
from typing import Optional


class BannerDTO(BaseModel):
    """Describes a JSON model for a banner"""

    message: str = Field(max_length=255)
    visible: Optional[bool] = True
