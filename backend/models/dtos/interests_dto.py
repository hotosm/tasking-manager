from pydantic import BaseModel, Field
from typing import Optional, List

# class InterestDTO(Model):
#     """DTO for a interest."""

#     id = IntType()
#     name = StringType(required=True, min_length=1)
#     user_selected = BooleanType(
#         serialized_name="userSelected", serialize_when_none=False
#     )
#     count_projects = IntType(serialize_when_none=False, serialized_name="countProjects")
#     count_users = IntType(serialize_when_none=False, serialized_name="countUsers")

class InterestDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=1)
    user_selected: Optional[bool] = Field(serialization_alias="userSelected", default=None, none_if_default=True)
    count_projects: Optional[int] = Field(serialize=False, serialization_alias="countProjects", default=None)
    count_users: Optional[int] = Field(serialize=False, serialization_alias="countUsers", default=None)


class ListInterestDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=1)



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
        self.interests = []

    rates: List[InterestRateDTO]
