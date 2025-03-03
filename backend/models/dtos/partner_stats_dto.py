from typing import List, Optional

import pandas as pd
from pydantic import BaseModel, Field


class UserGroupMemberDTO(BaseModel):
    """Describes a JSON model for a user group member."""

    id: Optional[str] = None
    user_id: Optional[str] = Field(None, alias="userId")
    username: Optional[str] = None
    is_active: Optional[bool] = Field(None, alias="isActive")
    total_mapping_projects: Optional[int] = Field(None, alias="totalMappingProjects")
    total_contribution_time: Optional[int] = Field(None, alias="totalcontributionTime")
    total_contributions: Optional[int] = Field(None, alias="totalcontributions")

    class Config:
        populate_by_name = True


class OrganizationContributionsDTO(BaseModel):
    """Describes a JSON model for organization contributions."""

    organization_name: Optional[str] = Field(None, alias="organizationName")
    total_contributions: Optional[int] = Field(None, alias="totalcontributions")

    class Config:
        populate_by_name = True


class UserContributionsDTO(BaseModel):
    """Describes a JSON model for user contributions."""

    total_mapping_projects: Optional[int] = Field(None, alias="totalMappingProjects")
    total_contribution_time: Optional[int] = Field(None, alias="totalcontributionTime")
    total_contributions: Optional[int] = Field(None, alias="totalcontributions")
    username: Optional[str] = None
    user_id: Optional[str] = Field(None, alias="userId")

    class Config:
        populate_by_name = True


class GeojsonDTO(BaseModel):
    type: Optional[str] = None
    coordinates: Optional[List[float]] = None


class GeoContributionsDTO(BaseModel):
    geojson: Optional[GeojsonDTO] = None
    total_contributions: Optional[int] = Field(None, alias="totalcontributions")

    class Config:
        populate_by_name = True


class ContributionsByDateDTO(BaseModel):
    task_date: str = Field(None, alias="taskDate")
    total_contributions: int = Field(None, alias="totalcontributions")


class ContributionTimeByDateDTO(BaseModel):
    date: str = Field(None, alias="date")
    total_contribution_time: int = Field(None, alias="totalcontributionTime")

    class Config:
        populate_by_name = True


class ContributionsByProjectTypeDTO(BaseModel):
    project_type: str = Field(None, alias="projectType")
    project_type_display: str = Field(None, alias="projectTypeDisplay")
    total_contributions: int = Field(None, alias="totalcontributions")

    class Config:
        populate_by_name = True


class AreaSwipedByProjectTypeDTO(BaseModel):
    total_area: Optional[float] = Field(None, alias="totalArea")
    project_type: str = Field(None, alias="projectType")
    project_type_display: str = Field(None, alias="projectTypeDisplay")

    class Config:
        populate_by_name = True


class GroupedPartnerStatsDTO(BaseModel):
    """General statistics of a partner and its members."""

    id: Optional[int] = None
    provider: str
    id_inside_provider: Optional[str] = Field(None, alias="idInsideProvider")
    name_inside_provider: Optional[str] = Field(None, alias="nameInsideProvider")
    description_inside_provider: Optional[str] = Field(None, alias="descriptionInsideProvider")
    members_count: Optional[int] = Field(None, alias="membersCount")
    members: List[UserGroupMemberDTO] = None

    # General stats of partner
    total_contributors: Optional[int] = Field(None, alias="totalContributors")
    total_contributions: Optional[int] = Field(None, alias="totalcontributions")
    total_contribution_time: Optional[int] = Field(None, alias="totalcontributionTime")

    # Recent contributions during the last 1 month
    total_recent_contributors: Optional[int] = Field(None, alias="totalRecentContributors")
    total_recent_contributions: Optional[int] = Field(None, alias="totalRecentcontributions")
    total_recent_contribution_time: Optional[int] = Field(None, alias="totalRecentcontributionTime")

    def to_csv(self):
        df = pd.json_normalize(self.dict(by_alias=True)["members"])

        df.drop(
            columns=["id"],
            inplace=True,
            axis=1,
        )
        df.rename(
            columns={
                "totalcontributionTime": "totalSwipeTimeInSeconds",
                "totalcontributions": "totalSwipes",
            },
            inplace=True,
        )

        return df.to_csv(index=False)

    class Config:
        populate_by_name = True


class FilteredPartnerStatsDTO(BaseModel):
    """Statistics of a partner contributions filtered by time range."""

    id: Optional[int] = None
    provider: str
    id_inside_provider: Optional[str] = Field(None, alias="idInsideProvider")

    from_date: Optional[str] = Field(None, alias="fromDate")
    to_date: Optional[str] = Field(None, alias="toDate")
    contributions_by_user: List[UserContributionsDTO] = Field([], alias="contributionsByUser")
    contributions_by_geo: List[GeoContributionsDTO] = Field([], alias="contributionsByGeo")
    area_swiped_by_project_type: List[AreaSwipedByProjectTypeDTO] = Field([], alias="areaSwipedByProjectType")
    contributions_by_project_type: List[ContributionsByProjectTypeDTO] = Field([], alias="contributionsByProjectType")
    contributions_by_date: List[ContributionsByDateDTO] = Field([], alias="contributionsByDate")
    contributions_by_organization_name: List[OrganizationContributionsDTO] = Field(
        [], alias="contributionsByorganizationName"
    )
    contribution_time_by_date: List[ContributionTimeByDateDTO] = Field([], alias="contributionTimeByDate")

    class Config:
        populate_by_name = True
