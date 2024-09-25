from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.statuses import (
    TeamMemberFunctions,
    TeamVisibility,
    TeamJoinMethod,
)
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from fastapi import HTTPException


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
        default=False, serialization_alias="joinRequestNotifications"
    )
    picture_url: Optional[str] = Field(None, serialization_alias="pictureUrl")

    @field_validator("function")
    def validate_function(cls, value):
        return validate_team_member_function(value)


class TeamProjectDTO(BaseModel):
    """Describes a JSON model to create a project team"""

    project_name: str = Field(None)
    project_id: int = Field(None)
    role: str = Field(None)


class ProjectTeamDTO(BaseModel):
    team_id: int = Field(serialization_alias="teamId", required=True)
    team_name: str = Field(serialization_alias="name")
    role: int = Field(required=True)


class TeamDetailsDTO(BaseModel):
    """Pydantic model equivalent of the original TeamDetailsDTO"""

    team_id: Optional[int] = Field(None, serialization_alias="teamId")
    organisation_id: int
    organisation: str
    organisation_slug: Optional[str] = Field(
        None, serialization_alias="organisationSlug"
    )
    name: str
    logo: Optional[str] = None
    description: Optional[str] = None
    join_method: str = Field(serialization_alias="joinMethod")
    visibility: str
    is_org_admin: bool = Field(False)
    is_general_admin: bool = Field(False)
    members: List[TeamMembersDTO] = Field([], alias="team_members")
    team_projects: List[TeamProjectDTO] = Field([], alias="team_projects")

    @field_validator("join_method")
    def validate_join_method(cls, value):
        return validate_team_join_method(value)

    @field_validator("visibility")
    def validate_visibility(cls, value):
        return validate_team_visibility(value)


class TeamDTO(BaseModel):
    """Describes JSON model for a team"""

    team_id: Optional[int] = Field(None, serialization_alias="teamId")
    organisation_id: int = Field(None, serialization_alias="organisation_id")
    organisation: str = Field(None, serialization_alias="organisation")
    name: str = Field(None, serialization_alias="name")
    logo: Optional[str] = None
    description: Optional[str] = None
    join_method: str = Field(None, serialization_alias="joinMethod")
    visibility: str = Field(None, serialization_alias="visibility")
    members: Optional[List[TeamMembersDTO]] = None
    members_count: Optional[int] = Field(None, serialization_alias="membersCount")
    managers_count: Optional[int] = Field(None, serialization_alias="managersCount")

    @field_validator("join_method")
    def validate_join_method(cls, value):
        return validate_team_join_method(value)

    @field_validator("visibility")
    def validate_visibility(cls, value):
        return validate_team_visibility(value)


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


class UpdateTeamDTO(BaseModel):
    """Describes a JSON model to update a team"""

    creator: float = Field(None, alias="creator")
    team_id: int = Field(None, alias="team_id")
    organisation: str = Field(None, alias="organisation")
    organisation_id: int = Field(None, alias="organisation_id")
    name: str = Field(None, alias="name")
    logo: str = Field(None, alias="logo")
    description: str = Field(None, alias="description")
    join_method: str = Field(None, alias="joinMethod")
    visibility: str = Field(None, serialize_when_none=False)
    members: List[TeamMembersDTO] = Field([], serialize_when_none=False)

    @field_validator("join_method")
    def validate_join_method(cls, value):
        return validate_team_join_method(value)

    @field_validator("visibility")
    def validate_visibility(cls, value):
        return validate_team_visibility(value)


class TeamSearchDTO(BaseModel):
    """Describes a JSON model to search for a team"""

    user_id: Optional[float] = Field(None, serialization_alias="userId")
    organisation: Optional[int] = Field(None, serialization_alias="organisation")
    team_name: Optional[str] = Field(None, serialization_alias="team_name")
    omit_members: Optional[bool] = Field(False, serialization_alias="omitMemberList")
    full_members_list: Optional[bool] = Field(
        True, serialization_alias="fullMemberList"
    )
    member: Optional[float] = Field(None, serialization_alias="member")
    manager: Optional[float] = Field(None, serialization_alias="manager")
    team_role: Optional[str] = Field(None, serialization_alias="team_role")
    member_request: Optional[float] = Field(
        None, aliserialization_aliasas="member_request"
    )
    paginate: Optional[bool] = Field(False, serialization_alias="paginate")
    page: Optional[int] = Field(1, serialization_alias="page")
    per_page: Optional[int] = Field(10, serialization_alias="perPage")
