from schematics import Model
from schematics.types import StringType, IntType, ListType, ModelType, LongType
from schematics.types.compound import ListType, ModelType, BaseType
from backend.models.dtos.stats_dto import Pagination
from schematics.exceptions import ValidationError



class PartnerDTO(Model):
    """DTO for Partner"""
    id = LongType()
    name = StringType(serialized_name="name")
    primary_hashtag = StringType(serialized_name="primaryHashtag")
    secondary_hashtag = StringType(serialized_name="secondaryHashtag")
    link_x = StringType(serialized_name="linkTwitter")
    link_meta = StringType(serialized_name="linkFacebook")
    link_instagram = StringType(serialized_name="linkInstagram")
    logo_url = StringType(serialized_name="logoUrl")
    website_links = ListType(StringType, serialized_name="websiteLinks")

class ListedPartner(Model):
    """Describes a partner within the Partner List"""
    id = LongType()
    name = StringType(serialized_name="name")
    primary_hashtag = StringType(serialized_name="primaryHashtag")
    logo_url = StringType(serialized_name="pictureUrl")

class PartnerSearchDTO(Model):
    """Paginated list of TM partners"""
    def __init__(self):
        super().__init__()
        self.partners = []

    pagination = ModelType(Pagination)
    partners = ListType(ModelType(ListedPartner))

class PartnerListDTO(Model):
    """DTO used to define available partners"""
    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.partners = []

    partners = ListType(ModelType(PartnerDTO))

class UpdatePartnerDTO(Model):
    """Describes a JSON model to update a team"""
    name = StringType(serialized_name="name")
    link_x = StringType(serialized_name="linkTwitter")
    link_meta = StringType(serialized_name="linkFacebook")
    link_instagram = StringType(serialized_name="linkInstagram")
    logo_url = StringType(serialized_name="logoUrl")
    website_links = ListType(StringType, serialized_name="websiteLinks")
