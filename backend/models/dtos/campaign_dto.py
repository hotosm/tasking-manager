from backend.models.dtos.organisation_dto import OrganisationDTO

# from schematics.exceptions import ValidationError
from pydantic import BaseModel, Field
from typing import List, Optional


def is_existent(value):
    if value.strip() == "":
        raise ValidationError("Empty campaign name string")
    return value


class NewCampaignDTO(BaseModel):
    """Describes JSON model to create a campaign"""

    name: str = Field(serialize_when_none=False, validators=[is_existent])
    logo: Optional[str] = Field(None, serialize_when_none=False)
    url: Optional[str] = Field(None, serialize_when_none=False)
    description: Optional[str] = Field(None, serialize_when_none=False)
    organisations: Optional[List[int]] = Field(None, serialize_when_none=False)


class CampaignDTO(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    logo: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    organisations: List[OrganisationDTO] = Field(
        default=None, serialization_alias="organisations"
    )


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
