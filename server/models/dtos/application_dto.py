from schematics.types import IntType, ListType, ModelType, StringType, DateTimeType
from schematics import Model
from server.models.postgis.utils import utc_format


class ApplicationDTO(Model):
    """ Describes JSON model used for creating grids """

    id = IntType(required=True, serialized_name="keyId")
    user = IntType(required=True, serialized_name="userId")
    app_key = StringType(required=True, serialized_name="applicationkey")
    created = DateTimeType(
        required=True, serialized_name="createdDate", serialized_format=utc_format()
    )


class ApplicationsDTO(Model):
    """ Describes an array of Application DTOs"""

    def __init__(self):
        super().__init__()
        self.applications = []

    applications = ListType(ModelType(ApplicationDTO))
