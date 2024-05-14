from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import (
    BooleanType,
    IntType,
    StringType,
    LongType,
    ListType,
    ModelType,
)

from backend.models.dtos.stats_dto import Pagination
from backend.models.postgis.statuses import (
    TeamMemberFunctions,
    TeamVisibility,
    TeamJoinMethod,
)


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


class TeamMembersDTO(Model):
    """Describe a JSON model for team members"""

    username = StringType(required=True)
    function = StringType(required=True, validators=[validate_team_member_function])
    active = BooleanType()
    join_request_notifications = BooleanType(
        default=False, serialized_name="joinRequestNotifications"
    )
    picture_url = StringType(serialized_name="pictureUrl")


class TeamProjectDTO(Model):
    """Describes a JSON model to create a project team"""

    project_name = StringType(required=True)
    project_id = IntType(required=True)
    role = StringType(required=True)


class ProjectTeamDTO(Model):
    """Describes a JSON model to create a project team"""

    team_id = IntType(required=True, serialized_name="teamId")
    team_name = StringType(serialized_name="name")
    role = StringType(required=True)


class TeamDetailsDTO(Model):
    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.members = []
        self.team_projects = []

    """ Describes JSON model for a team """
    team_id = IntType(serialized_name="teamId")
    organisation_id = IntType(required=True)
    organisation = StringType(required=True)
    organisation_slug = StringType(serialized_name="organisationSlug")
    name = StringType(required=True)
    logo = StringType()
    description = StringType()
    join_method = StringType(
        required=True,
        validators=[validate_team_join_method],
        serialized_name="joinMethod",
    )
    visibility = StringType(
        required=True, validators=[validate_team_visibility], serialize_when_none=False
    )
    is_org_admin = BooleanType(default=False)
    is_general_admin = BooleanType(default=False)
    members = ListType(ModelType(TeamMembersDTO))
    team_projects = ListType(ModelType(ProjectTeamDTO))


class TeamDTO(Model):
    """Describes JSON model for a team"""

    team_id = IntType(serialized_name="teamId")
    organisation_id = IntType(required=True, serialized_name="organisationId")
    organisation = StringType(required=True)
    name = StringType(required=True)
    logo = StringType()
    description = StringType()
    join_method = StringType(
        required=True,
        validators=[validate_team_join_method],
        serialized_name="joinMethod",
    )
    visibility = StringType(
        required=True, validators=[validate_team_visibility], serialize_when_none=False
    )
    members = ListType(ModelType(TeamMembersDTO))
    members_count = IntType(serialized_name="membersCount", required=False)
    managers_count = IntType(serialized_name="managersCount", required=False)


class TeamsListDTO(Model):
    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.teams = []

    """ Returns List of all teams"""
    teams = ListType(ModelType(TeamDTO))
    pagination = ModelType(Pagination)


class NewTeamDTO(Model):
    """Describes a JSON model to create a new team"""

    creator = LongType(required=True)
    organisation_id = IntType(required=True)
    name = StringType(required=True)
    description = StringType()
    join_method = StringType(
        required=True,
        validators=[validate_team_join_method],
        serialized_name="joinMethod",
    )
    visibility = StringType(
        required=True, validators=[validate_team_visibility], serialize_when_none=False
    )


class UpdateTeamDTO(Model):
    """Describes a JSON model to update a team"""

    creator = LongType()
    team_id = IntType()
    organisation = StringType()
    organisation_id = IntType()
    name = StringType()
    logo = StringType()
    description = StringType()
    join_method = StringType(
        validators=[validate_team_join_method], serialized_name="joinMethod"
    )
    visibility = StringType(
        validators=[validate_team_visibility], serialize_when_none=False
    )
    members = ListType(ModelType(TeamMembersDTO), serialize_when_none=False)


class TeamSearchDTO(Model):
    """Describes a JSON model to search for a team"""

    user_id = LongType(serialized_name="userId")
    organisation = IntType(serialized_name="organisation")
    team_name = StringType(serialized_name="team_name")
    omit_members = BooleanType(serialized_name="omitMemberList", default=False)
    full_members_list = BooleanType(serialized_name="fullMemberList", default=True)
    member = LongType(serialized_name="member")
    manager = LongType(serialized_name="manager")
    team_role = StringType(serialized_name="team_role")
    member_request = LongType(serialized_name="member_request")
    paginate = BooleanType(serialized_name="paginate", default=False)
    page = IntType(serialized_name="page", default=1)
    per_page = IntType(serialized_name="perPage", default=10)
