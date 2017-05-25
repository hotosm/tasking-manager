from schematics import Model
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType


class LicenseDTO(Model):
    """ DTO used to define a mapping license """
    license_id = IntType(serialized_name='licenseId')
    name = StringType(required=True)
    description = StringType(required=True)
    plain_text = StringType(required=True, serialized_name='plainText')


class LicenseListDTO(Model):
    """ DTO for all mapping licenses """
    def __init__(self):
        super().__init__()
        self.licenses = []

    licenses = ListType(ModelType(LicenseDTO))
