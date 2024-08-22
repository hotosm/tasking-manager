from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.statuses import (
    TeamMemberFunctions,
    TeamVisibility,
    TeamJoinMethod,
)
from pydantic import BaseModel, Field
from typing import List, Optional


def validate_team_visibility(value):
    """Validates that value is a known Team Visibility"""
    try:
        TeamVisibility[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown teamVisibility: {value} Valid values are "
            f"{TeamVisibility.PUBLIC.name}, "
            f"{TeamVisibility.PRIVATE.name}"
        )


def validate_team_join_method(value):
    """Validates join method value and its visibility"""
    try:
        TeamJoinMethod[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown teamJoinMethod: {value} Valid values are "
            f"{TeamJoinMethod.ANY.name}, "
            f"{TeamJoinMethod.BY_INVITE.name}, "
            f"{TeamJoinMethod.BY_REQUEST.name}"
        )


def validate_team_member_function(value):
    """Validates that value is a known Team Member Function"""
    try:
        TeamMemberFunctions[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown teamMemberFunction: {value} Valid values are "
            f"{TeamMemberFunctions.MEMBER.name}, "
            f"{TeamMemberFunctions.MANAGER.name}"
        )

class TeamMembersDTO(BaseModel):
    username: str = Field(required=True)
    function: str = Field(required=True, validators=[validate_team_member_function])
    active: bool
    join_request_notifications: bool = Field(default=False, alias="joinRequestNotifications")
    picture_url: Optional[str] = Field(alias="pictureUrl")


class TeamProjectDTO(BaseModel):
    """Describes a JSON model to create a project team"""

    project_name: str
    project_id: int
    role: str

class ProjectTeamDTO(BaseModel):
    team_id: int = Field(serialization_alias="teamId", required=True)
    team_name: str = Field(serialization_alias="name")
    role: int = Field(required=True)

class TeamDetailsDTO(BaseModel):
    def __init__(self, members: Optional[List[TeamMembersDTO]] = None, team_projects: Optional[List[ProjectTeamDTO]] = None, **kwargs):
        """DTO constructor initialise all arrays to empty"""
        super().__init__(**kwargs)
        self.members = members or []
        self.team_projects = team_projects or []

    team_id: Optional[int] = Field(alias="teamId")
    organisation_id: int
    organisation: str
    organisation_slug: Optional[str] = Field(alias="organisationSlug")
    name: str
    logo: Optional[str]
    description: Optional[str]
    join_method: str = Field(validators=[validate_team_join_method], alias="joinMethod")
    visibility: str = Field(validators=[validate_team_visibility], default="", alias="visibility")
    is_org_admin: bool = False
    is_general_admin: bool = False
    members: List[TeamMembersDTO]
    team_projects: List[ProjectTeamDTO]


class TeamDTO(BaseModel):
    """Describes JSON model for a team"""

    team_id: int = Field(alias="teamId")
    organisation_id: int = Field(required=True, alias="organisationId")
    organisation: str = Field(required=True)
    name: str = Field(required=True)
    logo: str
    description: str
    join_method: str = Field(
        required=True,
        validators=[validate_team_join_method],
        alias="joinMethod",
    )
    visibility: str = Field(
        required=True, validators=[validate_team_visibility], serialize_when_none=False
    )
    members: List[TeamMembersDTO]
    members_count: int = Field(alias="membersCount", required=False)
    managers_count: int = Field(alias="managersCount", required=False)


class TeamsListDTO(BaseModel):
    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.teams = []

    """ Returns List of all teams"""
    teams: List[ProjectTeamDTO] = []
    pagination: Optional[Pagination] = None


class NewTeamDTO(BaseModel):
    """Describes a JSON model to create a new team"""

    creator: float
    organisation_id: int
    name: str
    description: Optional[str]
    join_method: str = Field(
        required=True,
        validators=[validate_team_join_method],
        alias="joinMethod",
    )
    visibility: str = Field(
        required=True, validators=[validate_team_visibility], serialize_when_none=False
    )

class UpdateTeamDTO(BaseModel):
    """Describes a JSON model to update a team"""

    creator: float
    team_id: int
    organisation: str
    organisation_id: int
    name: str
    logo: str
    description: str
    join_method: str = Field(
        validators=[validate_team_join_method], alias="joinMethod"
    )
    visibility: str = Field(
        validators=[validate_team_visibility], serialize_when_none=False
    )
    # members = ListType(ModelType(TeamMembersDTO), serialize_when_none=False)


class TeamSearchDTO(BaseModel):
    """Describes a JSON model to search for a team"""

    user_id: float = Field(alias="userId")
    organisation: int = Field(alias="organisation")
    team_name: str = Field(alias="team_name")
    omit_members: bool = Field(alias="omitMemberList", default=False)
    full_members_list: bool = Field(alias="fullMemberList", default=True)
    member: float = Field(alias="member")
    manager: float = Field(alias="manager")
    team_role: str = Field(alias="team_role")
    member_request: float = Field(alias="member_request")
    paginate: bool = Field(alias="paginate", default=False)
    page: int = Field(alias="page", default=1)
    per_page: int = Field(alias="perPage", default=10)
