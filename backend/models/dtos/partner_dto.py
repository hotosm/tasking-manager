from schematics import Model
from schematics.types import StringType, ListType, LongType


class PartnerDTO(Model):
    """DTO for Partner"""

    id = LongType()
    name = StringType(serialized_name="name")
    primary_hashtag = StringType(serialized_name="primary_hashtag")
    secondary_hashtag = StringType(serialized_name="secondary_hashtag")
    link_x = StringType(serialized_name="link_x")
    link_meta = StringType(serialized_name="link_meta")
    link_instagram = StringType(serialized_name="link_instagram")
    logo_url = StringType(serialized_name="logo_url")
    current_projects = StringType(serialized_name="current_projects")
    permalink = StringType(serialized_name="permalink")
    website_links = ListType(StringType, serialized_name="website_links")
