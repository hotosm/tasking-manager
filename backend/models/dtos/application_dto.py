from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class ApplicationDTO(BaseModel):
    """Describes JSON model used for creating grids"""

    id: Optional[int] = Field(None, alias="keyId")
    user: Optional[int] = Field(None, alias="userId")
    app_key: Optional[str] = Field(None, alias="applicationkey")
    created: Optional[datetime] = Field(None, alias="createdDate")


class ApplicationsDTO(BaseModel):
    """Describes an array of Application DTOs"""

    applications: List[ApplicationDTO] = Field([], alias="applications")
