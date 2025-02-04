from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


def is_known_action(value):
    """Validates that the action performed on a Project-Partner link is known"""
    valid_values = "{} {} {}".format(
        ProjectPartnerAction.CREATE.name,
        ProjectPartnerAction.DELETE.name,
        ProjectPartnerAction.UPDATE.name,
    )

    try:
        action = ProjectPartnerAction[value.upper()]
    except KeyError:
        raise ValidationError(
            f'"{action}" is an unknown Project-Partner link action. Valid action names are {valid_values}'
        )


# class ProjectPartnershipDTO(Model):
#     """DTO for the link between a Partner and a Project"""

#     id = LongType(required=True)
#     project_id = LongType(required=True, serialized_name="projectId")
#     partner_id = LongType(required=True, serialized_name="partnerId")
#     started_on = UTCDateTimeType(required=True, serialized_name="startedOn")
#     ended_on = UTCDateTimeType(serialized_name="endedOn")


class ProjectPartnershipDTO(BaseModel):
    """DTO for the link between a Partner and a Project"""

    id: Optional[int] = None
    project_id: int = Field(..., alias="projectId")
    partner_id: int = Field(..., alias="partnerId")
    started_on: datetime = Field(..., alias="startedOn")
    ended_on: Optional[datetime] = Field(None, alias="endedOn")

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


# class ProjectPartnershipUpdateDTO(Model):
#     """DTO for updating the time range of the link between a Partner and a Project"""

#     started_on = UTCDateTimeType(serialized_name="startedOn")
#     ended_on = UTCDateTimeType(serialized_name="endedOn")


class ProjectPartnershipUpdateDTO(BaseModel):
    """DTO for updating the time range of the link between a Partner and a Project"""

    started_on: Optional[datetime] = Field(None, alias="startedOn")
    ended_on: Optional[datetime] = Field(None, alias="endedOn")

    class Config:
        populate_by_name = True


# class ProjectPartnershipHistoryDTO(Model):
#     """DTO for Logs of changes to all Project-Partner links"""

#     id = LongType(required=True)
#     partnership_id = LongType(required=True, serialized_name="partnershipId")
#     project_id = LongType(required=True, serialized_name="projectId")
#     partner_id = LongType(required=True, serialized_name="partnerId")
#     started_on_old = UTCDateTimeType(
#         serialized_name="startedOnOld", serialize_when_none=False
#     )
#     ended_on_old = UTCDateTimeType(
#         serialized_name="endedOnOld", serialize_when_none=False
#     )
#     started_on_new = UTCDateTimeType(
#         serialized_name="startedOnNew", serialize_when_none=False
#     )
#     ended_on_new = UTCDateTimeType(
#         serialized_name="endedOnNew", serialize_when_none=False
#     )


#     action = StringType(validators=[is_known_action])
#     actionDate = UTCDateTimeType(serialized_name="actionDate")
class ProjectPartnershipHistoryDTO(BaseModel):
    """DTO for Logs of changes to all Project-Partner links"""

    id: int
    partnership_id: int = Field(..., alias="partnershipId")
    project_id: int = Field(..., alias="projectId")
    partner_id: int = Field(..., alias="partnerId")
    started_on_old: Optional[datetime] = Field(None, alias="startedOnOld")
    ended_on_old: Optional[datetime] = Field(None, alias="endedOnOld")
    started_on_new: Optional[datetime] = Field(None, alias="startedOnNew")
    ended_on_new: Optional[datetime] = Field(None, alias="endedOnNew")
    action: str
    action_date: Optional[datetime] = Field(None, alias="actionDate")

    class Config:
        populate_by_name = True


class ProjectPartnerAction(Enum):
    """Enum describing available actions related to updating Project-Partner links"""

    CREATE = 0
    DELETE = 1
    UPDATE = 2
