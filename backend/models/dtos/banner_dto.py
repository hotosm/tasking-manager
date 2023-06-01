from schematics import Model
from schematics.types import (
    BooleanType,
    StringType,
)


class BannerDTO(Model):
    """Describes a JSON model for a banner"""

    message = StringType(required=True, max_length=255)
    visible = BooleanType()
