from typing import List, Optional

from pydantic import BaseModel, Field


class InterestDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=1)
    user_selected: Optional[bool] = Field(
        alias="userSelected", default=None, none_if_default=True
    )
    count_projects: Optional[int] = Field(
        serialize=False, alias="countProjects", default=None
    )
    count_users: Optional[int] = Field(
        serialize=False, alias="countUsers", default=None
    )

    class Config:
        populate_by_name = True


class InterestsListDTO(BaseModel):
    """DTO for a list of interests."""

    def __init__(self):
        super().__init__()
        self.interests = []

    interests: Optional[List[InterestDTO]] = None


class InterestRateDTO(BaseModel):
    """DTO for a interest rate."""

    name: str
    rate: float


class InterestRateListDTO(BaseModel):
    """DTO for a list of interests rates."""

    def __init__(self):
        super().__init__()
        self.rates = []

    rates: Optional[List[InterestRateDTO]] = None
