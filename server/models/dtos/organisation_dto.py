from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType, ListType, LongType
from server.models.postgis.statuses import OrganisationVisibility


def validate_organisation_visibility(value):
    """ Validates that value is a known Organisation Visibility """
    try:
        OrganisationVisibility[value.upper()]
    except KeyError:
        raise ValidationError(f'Unkown organisationVisibility: {value} Valid values are {OrganisationVisibility.PUBLIC.name} '
                              f'{OrganisationVisibility.PRIVATE.name}, {OrganisationVisibility.SECRET.name}')


class OrganisationDTO(Model):
    """ Describes JSON model for an organisation """
    organisation_id = IntType(serialized_name='organisationId')
    admins = ListType(StringType(), min_size=1, required=True)
    name = StringType(required=True)
    logo = StringType()
    url = StringType()
    visibility = StringType(
        required=True,
        validators=[validate_organisation_visibility],
        serialize_when_none=False
    )


class NewOrganisationDTO(Model):
    """ Describes a JSON model to create a new organisation """
    admins = ListType(LongType(), required=True)
    name = StringType(required=True)
    logo = StringType()
    url = StringType()
    visibility = StringType(
        required=True,
        validators=[validate_organisation_visibility],
        serialize_when_none=False
    )
