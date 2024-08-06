from schematics import Model
from schematics.types import StringType, IntType, ListType, ModelType
from backend.models.dtos.organisation_dto import OrganisationDTO
from schematics.exceptions import ValidationError


def is_existent(value):
    if value.strip() == "":
        raise ValidationError("Empty campaign name string")
    return value


class NewCampaignDTO(Model):
    """Describes JSON model to create a campaign"""

    name = StringType(serialize_when_none=False, validators=[is_existent])
    logo = StringType(serialize_when_none=False)
    url = StringType(serialize_when_none=False)
    description = StringType(serialize_when_none=False)
    organisations = ListType(IntType, serialize_when_none=False)


class CampaignDTO(Model):
    """Describes JSON model for an existing campaign"""

    id = IntType(serialize_when_none=False)
    name = StringType(serialize_when_none=False)
    logo = StringType(serialize_when_none=False)
    url = StringType(serialize_when_none=False)
    description = StringType(serialize_when_none=False)
    organisations = ListType(ModelType(OrganisationDTO), serialize_when_none=False)


class CampaignProjectDTO(Model):
    """DTO used to define available campaign connected projects"""

    project_id = IntType()
    campaign_id = IntType()


class CampaignOrganisationDTO(Model):
    """DTO used to define available campaign connected projects"""

    organisation_id = IntType()
    campaign_id = IntType()


class CampaignListDTO(Model):
    """DTO used to define available campaigns"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.campaigns = []

    campaigns = ListType(ModelType(CampaignDTO))
