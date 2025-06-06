from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic.functional_validators import field_validator

from backend.models.dtos.organisation_dto import OrganisationDTO


def is_existent(value):
    if value.strip() == "":
        raise ValueError("Empty campaign name string")
    return value


class NewCampaignDTO(BaseModel):
    """Describes JSON model to create a campaign"""

    name: str = Field(serialize_when_none=False)
    logo: Optional[str] = Field(None, serialize_when_none=False)
    url: Optional[str] = Field(None, serialize_when_none=False)
    description: Optional[str] = Field(None, serialize_when_none=False)
    organisations: Optional[List[int]] = Field(None, serialize_when_none=False)

    @field_validator("name", mode="before")
    def validate_type(cls, value):
        if value is None:
            return value
        return is_existent(value)


class CampaignDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    logo: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    organisations: List[OrganisationDTO] = Field(default=None, alias="organisations")

    class Config:
        populate_by_name = True


class CampaignProjectDTO(BaseModel):
    """DTO used to define available campaign connected projects"""

    project_id: int
    campaign_id: int


class CampaignOrganisationDTO(BaseModel):
    """DTO used to define available campaign connected projects"""

    organisation_id: int
    campaign_id: int


class ListCampaignDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None


class CampaignListDTO(BaseModel):
    """DTO used to define available campaigns"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.campaigns = []

    campaigns: Optional[List[ListCampaignDTO]] = None
