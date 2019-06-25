from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import BooleanType, IntType, StringType, LongType, BaseType
from server.models.postgis.statuses import TeamMemberFunctions, TeamVisibility


def validate_team_visibility(value):
    """ Validates that value is a known Team Visibility """
    try:
        TeamVisibility[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown teamVisibility: {value} Valid values are '
                              f'{TeamVisibility.PUBLIC.name}, '
                              f'{TeamVisibility.PRIVATE.name}, '
                              f'{TeamVisibility.SECRET.name}'
                              )


def validate_team_member_function(value):
    """ Validates that value is a known Team Member Function """
    try:
        TeamMemberFunctions[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown teamMemberFunction: {value} Valid values are '
                              f'{TeamMemberFunctions.EDITOR.name}, '
                              f'{TeamMemberFunctions.MANAGER.name}'
                              )


class TeamDTO(Model):
    """ Describes JSON model for a team """
    team_id = IntType(serialized_name='teamId')
    organisation = StringType(required=True)
    members = BaseType(required=True)
    name = StringType(required=True)
    logo = StringType()
    description = StringType()
    invite_only = BooleanType(default=False, serialized_name='inviteOnly', required=True)
    visibility = StringType(
        required=True,
        validators=[validate_team_visibility],
        serialize_when_none=False
    )


class NewTeamDTO(Model):
    """ Describes a JSON model to create a new team """
    creator = LongType(required=True)
    organisation = StringType(required=True)
    name = StringType(required=True)
    logo = StringType()
    description = StringType()
    invite_only = BooleanType(default=False, serialized_name='inviteOnly', required=True)
    visibility = StringType(
        required=True,
        validators=[validate_team_visibility],
        serialize_when_none=False
    )
