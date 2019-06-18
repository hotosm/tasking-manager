from schematics import Model
from schematics.types import StringType, IntType, DictType


class CampaignDTO(Model):
    """ DTO used to define a campaign"""
    id = IntType()
    name = StringType()
    logo = StringType()
    url = StringType()
    description = StringType()

class CampaignProjectDTO(Model):
    """ DTO used to define avaliable campaign connnected projects"""
    project_id = IntType()
    campaign_id = IntType()
    
class CampaignListDTO(Model):
    """ DTO used to define available campaigns """
    campaigns = DictType(StringType)