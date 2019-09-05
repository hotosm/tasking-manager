from schematics import Model
from schematics.types import StringType, IntType, ListType, ModelType
from server.models.dtos.organisation_dto import OrganisationDTO


class CampaignDTO(Model):
    """ DTO used to define a campaign"""

    id = IntType(serialize_when_none=False)
    name = StringType(serialize_when_none=False)
    logo = StringType(serialize_when_none=False)
    url = StringType(serialize_when_none=False)
    description = StringType(serialize_when_none=False)
    organisations = ListType(ModelType(OrganisationDTO), serialize_when_none=False)


class CampaignProjectDTO(Model):
    """ DTO used to define avaliable campaign connnected projects"""

    project_id = IntType()
    campaign_id = IntType()


class CampaignOrganisationDTO(Model):
    """ DTO used to define avaliable campaign connnected projects"""

    organisation_id = IntType()
    campaign_id = IntType()


class CampaignListDTO(Model):
    """ DTO used to define available campaigns """

    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.campaigns = []

    campaigns = ListType(ModelType(CampaignDTO))
