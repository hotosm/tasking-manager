from schematics import Model
from schematics.types import (
    LongType,
    UTCDateTimeType,
    StringType,
    Enum,
    ValidationError,
)


def is_known_action(value):
    """Validates that the action performed on a Project-Partner link is known"""
    valid_values = f"{ProjectPartnerAction.START.name}, {ProjectPartnerAction.END.name}, {ProjectPartnerAction.UPDATE.name}"

    try:
        action = ProjectPartnerAction[value.upper()]
    except KeyError:
        raise ValidationError(
            f'"{action}" is an unknown Project-Partner link action. Valid action names are {valid_values}'
        )


class ProjectPartnerDTO(Model):
    """DTO for the link between a Partner and a Project"""

    project_id = LongType(required=True, serialized_name="projectId")
    partner_id = LongType(required=True, serialized_name="partnerId")
    started_on = UTCDateTimeType(required=True, serialized_name="startedOn")


class ProjectPartnerHistoryDTO(Model):
    """DTO for Logs of changes to all Project-Partner links"""

    id = LongType(required=True)
    project_id = LongType(required=True, serialized_name="projectId")
    partner_id = LongType(required=True, serialized_name="partnerId")
    started_on_old = UTCDateTimeType(
        serialized_name="startedOnOld", serialize_when_none=False
    )
    ended_on_old = UTCDateTimeType(
        serialized_name="endedOnOld", serialize_when_none=False
    )
    started_on_new = UTCDateTimeType(
        serialized_name="startedOnNew", serialize_when_none=False
    )
    ended_on_new = UTCDateTimeType(
        serialized_name="endedOnNew", serialize_when_none=False
    )

    action = StringType(validators=[is_known_action])
    actionDate = UTCDateTimeType(serialized_name="actionDate")


class ProjectPartnerAction(Enum):
    """Enum describing available actions related to updating Project-Partner links"""

    START = 0
    END = 1
    UPDATE = 2  # Updates the time range of when partner was linked with a project.
