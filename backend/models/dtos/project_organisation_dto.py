from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ProjectOrganisationDTO(BaseModel):
    """DTO for the link between a supporting Organisation and a Project"""

    id: Optional[int] = None
    project_id: int = Field(..., alias="projectId")
    organisation_id: int = Field(..., alias="organisationId")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    # Organisation details are inlined so a caller listing a project's
    # organisations can render them without a request per organisation.
    organisation_name: Optional[str] = Field(None, alias="organisationName")
    organisation_slug: Optional[str] = Field(None, alias="organisationSlug")
    organisation_logo: Optional[str] = Field(None, alias="organisationLogo")

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


class ProjectOrganisationsDTO(BaseModel):
    """DTO for every organisation attached to a project"""

    lead_organisation_id: Optional[int] = Field(None, alias="leadOrganisationId")
    supporting_organisations: List[ProjectOrganisationDTO] = Field(
        default_factory=list, alias="supportingOrganisations"
    )

    class Config:
        populate_by_name = True
