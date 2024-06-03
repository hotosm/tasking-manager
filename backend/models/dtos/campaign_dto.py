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
    logo: str = Field(serialize_when_none=False)
    url: str = Field(serialize_when_none=False)
    description: str = Field(serialize_when_none=False)
    organisations: List[int] = Field(serialize_when_none=False)


# class CampaignDTO(Model):
#     """Describes JSON model for an existing campaign"""

#     id = IntType(serialize_when_none=False)
#     name = StringType(serialize_when_none=False)
#     logo = StringType(serialize_when_none=False)
#     url = StringType(serialize_when_none=False)
#     description = StringType(serialize_when_none=False)
#     organisations = ListType(ModelType(OrganisationDTO), serialize_when_none=False)

class CampaignDTO(BaseModel):
    id: Optional[int] = Field(default=None)
    name: Optional[str] = Field(default=None)
    logo: Optional[str] = Field(default=None)
    url: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    organisations: List[OrganisationDTO] = Field(default=None, alias="organisations")


class CampaignProjectDTO(BaseModel):
    """DTO used to define available campaign connected projects"""

    project_id: int
    campaign_id: int


class CampaignOrganisationDTO(BaseModel):
    """DTO used to define available campaign connected projects"""

    organisation_id: int
    campaign_id: int


class CampaignListDTO(BaseModel):
    """DTO used to define available campaigns"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.campaigns = []

    campaigns: Optional[List[CampaignDTO]] = None
