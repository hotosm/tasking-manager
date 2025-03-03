from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator

from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.statuses import (
    TeamJoinMethod,
    TeamMemberFunctions,
    TeamVisibility,
)


def validate_team_visibility(value: str) -> str:
    """Validates that value is a known Team Visibility."""
    try:
        TeamVisibility[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown teamVisibility: {value}. Valid values are: "
                f"{TeamVisibility.PUBLIC.name}, "
                f"{TeamVisibility.PRIVATE.name}."
            ),
        )
    return value


def validate_team_join_method(value: str):
    """Validates join method value and its visibility."""
    try:
        TeamJoinMethod[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown teamJoinMethod: {value}. "
                f"Valid values are: {TeamJoinMethod.ANY.name}, "
                f"{TeamJoinMethod.BY_INVITE.name}, "
                f"{TeamJoinMethod.BY_REQUEST.name}."
            ),
        )
    return value


def validate_team_member_function(value: str):
    """Validates that value is a known Team Member Function."""
    try:
        TeamMemberFunctions[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown teamMemberFunction: {value}. "
                f"Valid values are: {TeamMemberFunctions.MEMBER.name}, "
                f"{TeamMemberFunctions.MANAGER.name}."
            ),
        )
    return value


class TeamMembersDTO(BaseModel):
    username: str
    function: str
    active: bool
    join_request_notifications: bool = Field(
        default=False, alias="joinRequestNotifications"
    )
    picture_url: Optional[str] = Field(None, alias="pictureUrl")
    joined_date: Optional[datetime] = Field(None, alias="joinedDate")

    @field_validator("function")
    def validate_function(cls, value):
        return validate_team_member_function(value)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


class TeamProjectDTO(BaseModel):
    """Describes a JSON model to create a project team"""

    project_name: str = Field(None)
    project_id: int = Field(None)
    role: str = Field(None)


class ProjectTeamDTO(BaseModel):
    """Describes a JSON model to create a project team"""

    team_id: int = Field(alias="teamId")
    team_name: str = Field(default=None, alias="name")
    role: str = Field()

    class Config:
        populate_by_name = True
        use_enum_values = True


class TeamDetailsDTO(BaseModel):
    """Pydantic model equivalent of the original TeamDetailsDTO"""

    team_id: Optional[int] = Field(None, alias="teamId")
    organisation_id: int
    organisation: str
    organisation_slug: Optional[str] = Field(None, alias="organisationSlug")
    name: str
    logo: Optional[str] = None
    description: Optional[str] = None
    join_method: str = Field(alias="joinMethod")
    visibility: str
    is_org_admin: bool = Field(False)
    is_general_admin: bool = Field(False)
    members: List[TeamMembersDTO] = Field([], alias="members")
    team_projects: List[TeamProjectDTO] = Field([], alias="team_projects")

    @field_validator("join_method")
    def validate_join_method(cls, value):
        return validate_team_join_method(value)

    @field_validator("visibility")
    def validate_visibility(cls, value):
        return validate_team_visibility(value)

    class Config:
        populate_by_name = True


class TeamDTO(BaseModel):
    """Describes JSON model for a team"""

    team_id: Optional[int] = Field(None, alias="teamId")
    organisation_id: int = Field(None, alias="organisationId")
    organisation: str = Field(None, alias="organisation")
    name: str = Field(None, alias="name")
    logo: Optional[str] = None
    description: Optional[str] = None
    join_method: str = Field(None, alias="joinMethod")
    visibility: str = Field(None, alias="visibility")
    members: Optional[List[TeamMembersDTO]] = None
    members_count: Optional[int] = Field(None, alias="membersCount")
    managers_count: Optional[int] = Field(None, alias="managersCount")

    @field_validator("join_method")
    def validate_join_method(cls, value):
        return validate_team_join_method(value)

    @field_validator("visibility")
    def validate_visibility(cls, value):
        return validate_team_visibility(value)

    class Config:
        populate_by_name = True


class TeamsListDTO(BaseModel):
    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.teams = []

    """ Returns List of all teams"""
    teams: List[TeamDTO] = []
    pagination: Optional[Pagination] = None


class ListTeamsDTO(BaseModel):
    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.teams = []

    """ Returns List of all teams"""
    teams: List[ProjectTeamDTO] = []
    pagination: Optional[Pagination] = None


class NewTeamDTO(BaseModel):
    """Describes a JSON model to create a new team"""

    creator: float = Field(None, alias="creator")
    organisation_id: int = Field(..., alias="organisation_id")
    name: str = Field(..., alias="name")
    description: Optional[str] = Field(None, alias="description")
    join_method: str = Field(
        ...,
        alias="joinMethod",
    )
    visibility: str = Field(..., serialize_when_none=False)

    @field_validator("join_method")
    def validate_join_method(cls, value):
        return validate_team_join_method(value)

    @field_validator("visibility")
    def validate_visibility(cls, value):
        return validate_team_visibility(value)

    class Config:
        populate_by_name = True


class UpdateTeamDTO(BaseModel):
    """Describes a JSON model to update a team"""

    creator: Optional[int] = Field(None, alias="creator")
    team_id: Optional[int] = Field(None, alias="team_id")
    organisation: Optional[str] = Field(None, alias="organisation")
    organisation_id: Optional[int] = Field(None, alias="organisation_id")
    name: Optional[str] = Field(None, alias="name")
    logo: Optional[str] = Field(None, alias="logo")
    description: Optional[str] = Field(None, alias="description")
    join_method: Optional[str] = Field(None, alias="joinMethod")
    visibility: Optional[str] = Field(None, serialize_when_none=False)
    members: Optional[List[TeamMembersDTO]] = Field([], serialize_when_none=False)

    @field_validator("join_method")
    def validate_join_method(cls, value):
        return validate_team_join_method(value)

    @field_validator("visibility")
    def validate_visibility(cls, value):
        return validate_team_visibility(value)

    class Config:
        populate_by_name = True


class TeamSearchDTO(BaseModel):
    """Describes a JSON model to search for a team"""

    user_id: Optional[float] = Field(None, alias="userId")
    organisation: Optional[int] = Field(None, alias="organisation")
    team_name: Optional[str] = Field(None, alias="team_name")
    omit_members: Optional[bool] = Field(False, alias="omitMemberList")
    full_members_list: Optional[bool] = Field(True, alias="fullMemberList")
    member: Optional[float] = Field(None, alias="member")
    manager: Optional[float] = Field(None, alias="manager")
    team_role: Optional[str] = Field(None, alias="team_role")
    member_request: Optional[float] = Field(None, alias="member_request")
    paginate: Optional[bool] = Field(False, alias="paginate")
    page: Optional[int] = Field(1, alias="page")
    per_page: Optional[int] = Field(10, alias="perPage")

    class Config:
        populate_by_name = True
