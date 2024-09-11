from backend.models.dtos.stats_dto import OrganizationStatsDTO
from backend.models.postgis.statuses import OrganisationType
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from fastapi import HTTPException
from pydantic.functional_validators import field_validator


def is_known_organisation_type(value):
    """Validates organisation subscription type string"""
    try:
        OrganisationType[value.upper()]
    except (AttributeError, KeyError):
        raise HTTPException(
            f"Unknown organisationType: {value}. Valid values are {OrganisationType.FREE.name}, "
            f"{OrganisationType.DISCOUNTED.name}, {OrganisationType.FULL_FEE.name}"
        )


class OrganisationManagerDTO(BaseModel):
    username: Optional[str] = None
    picture_url: Optional[str] = Field(None, serialization_alias="pictureUrl")


class OrganisationTeamsDTO(BaseModel):
    team_id: Optional[int] = Field(None, serialization_alias="teamId")
    name: Optional[str] = None
    description: Optional[str] = None
    join_method: Optional[str] = Field(None, serialization_alias="joinMethod")
    visibility: Optional[str] = None
    members: List[Dict[str, Optional[str]]] = Field(default=[])


class OrganisationDTO(BaseModel):
    organisation_id: Optional[int] = Field(None, serialization_alias="organisationId")
    managers: Optional[List[OrganisationManagerDTO]] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    is_manager: Optional[bool] = Field(None, serialization_alias="isManager")
    projects: Optional[List[str]] = Field(default=[], alias="projects")
    teams: List[OrganisationTeamsDTO] = None
    campaigns: Optional[List[List[str]]] = None
    stats: Optional[OrganizationStatsDTO] = None
    type: Optional[str] = Field(None)
    subscription_tier: Optional[int] = Field(
        None, serialization_alias="subscriptionTier"
    )

    @field_validator("type", mode="before")
    def validate_type(cls, value):
        if value is None:
            return value
        return is_known_organisation_type(value)


class ListOrganisationsDTO(BaseModel):
    def __init__(self):
        super().__init__()
        self.organisations = []

    organisations: Optional[List[OrganisationDTO]] = None


class NewOrganisationDTO(BaseModel):
    """Describes a JSON model to create a new organisation"""

    organisation_id: Optional[int] = Field(None, serialization_alias="organisationId")
    managers: List[str]
    name: str
    slug: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    type: str
    subscription_tier: Optional[int] = Field(
        None, serialization_alias="subscriptionTier"
    )

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, value: Optional[str]) -> Optional[str]:
        """Validates organisation subscription type string"""
        try:
            OrganisationType[value.upper()]
        except (AttributeError, KeyError):
            raise ValueError(
                f"Unknown organisationType: {value}. Valid values are {OrganisationType.FREE.name}, "
                f"{OrganisationType.DISCOUNTED.name}, {OrganisationType.FULL_FEE.name}"
            )
        return value


class UpdateOrganisationDTO(OrganisationDTO):
    organisation_id: Optional[int] = Field(None, serialization_alias="organisationId")
    managers: List[str] = Field(default=[])
    name: Optional[str] = None
    slug: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    type: Optional[str] = None

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, value: Optional[str]) -> Optional[str]:
        """Validates organisation subscription type string"""
        if value is None:
            return value
        try:
            OrganisationType[value.upper()]
        except (AttributeError, KeyError):
            raise ValueError(
                f"Unknown organisationType: {value}. Valid values are {OrganisationType.FREE.name}, "
                f"{OrganisationType.DISCOUNTED.name}, {OrganisationType.FULL_FEE.name}"
            )
        return value
