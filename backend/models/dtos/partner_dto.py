# from schematics import Model
# from schematics.types import StringType, ListType, LongType
import json
from typing import Dict, List, Optional

from pydantic import BaseModel, HttpUrl


class PartnerDTO(BaseModel):
    """DTO for Partner"""

    id: Optional[int] = None
    name: str
    primary_hashtag: str
    secondary_hashtag: Optional[str] = None
    link_x: Optional[str] = None
    link_meta: Optional[str] = None
    link_instagram: Optional[str] = None
    logo_url: Optional[HttpUrl] = None  # Ensures it's a valid URL
    current_projects: Optional[str] = None
    permalink: Optional[str] = None
    website_links: Optional[List[Dict]] = None
    mapswipe_group_id: Optional[str] = None

    @classmethod
    def from_record(cls, record):
        record_dict = dict(record)
        if record_dict.get("website_links"):
            record_dict["website_links"] = json.loads(record_dict["website_links"])
        return cls(**record_dict)
