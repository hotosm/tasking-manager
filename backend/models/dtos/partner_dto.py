from schematics import Model
from schematics.types import StringType, ListType, ModelType, LongType
from schematics.types.compound import ListType, ModelType
from backend.models.dtos.stats_dto import Pagination


class PartnerDTO(Model):
    """DTO for Partner"""
    id = LongType()
    name = StringType(serialized_name="name")
    primary_hashtag = StringType(serialized_name="primary_hashtag")
    secondary_hashtag = StringType(serialized_name="secondary_hashtag")
    link_x = StringType(serialized_name="link_x")
    link_meta = StringType(serialized_name="link_meta")
    link_instagram = StringType(serialized_name="link_instagram")
    logo_url = StringType(serialized_name="logou_url")
    current_projects = StringType(serialized_name="current_projects")
    website_links = ListType(StringType, serialized_name="website_links")

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
    """Describes a JSON model to update a partner"""
    name = StringType(serialized_name="name")
    primary_hashtag = StringType(serialized_name="primary_hashtag")
    secondary_hashtag = StringType(serialized_name="secondary_hashtag")
    link_x = StringType(serialized_name="link_x")
    link_meta = StringType(serialized_name="link_meta")
    link_instagram = StringType(serialized_name="link_instagram")
    logo_url = StringType(serialized_name="logo_url")
    current_projects = StringType(serialized_name="current_projects")
    website_links = ListType(StringType, serialized_name="website_links")
