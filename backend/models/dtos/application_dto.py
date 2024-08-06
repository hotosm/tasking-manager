from schematics.types import IntType, ListType, ModelType, StringType, UTCDateTimeType
from schematics import Model


class ApplicationDTO(Model):
    """Describes JSON model used for creating grids"""

    id = IntType(required=True, serialized_name="keyId")
    user = IntType(required=True, serialized_name="userId")
    app_key = StringType(required=True, serialized_name="applicationkey")
    created = UTCDateTimeType(required=True, serialized_name="createdDate")


class ApplicationsDTO(Model):
    """Describes an array of Application DTOs"""

    def __init__(self):
        super().__init__()
        self.applications = []

    applications = ListType(ModelType(ApplicationDTO))
