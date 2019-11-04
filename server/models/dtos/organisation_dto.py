from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import (
    StringType,
    IntType,
    ListType,
    LongType,
    ModelType,
    BooleanType,
)
from server.models.postgis.statuses import OrganisationVisibility


def validate_organisation_visibility(value):
    """ Validates that value is a known Organisation Visibility """
    try:
        OrganisationVisibility[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unkown organisationVisibility: {value} Valid values are {OrganisationVisibility.PUBLIC.name} "
            f"{OrganisationVisibility.PRIVATE.name}, {OrganisationVisibility.SECRET.name}"
        )


class OrganisationDTO(Model):
    """ Describes JSON model for an organisation """

    organisation_id = IntType(serialized_name="organisationId")
    admins = ListType(StringType(), min_size=1, required=True)
    name = StringType(required=True)
    logo = StringType()
    url = StringType()
    visibility = StringType(
        required=True,
        validators=[validate_organisation_visibility],
        serialize_when_none=False,
    )
    is_admin = BooleanType(serialized_name="isAdmin")
    projects = ListType(ListType(StringType))
    teams = ListType(ListType(StringType))
    campaigns = ListType(ListType(StringType))


class ListOrganisationsDTO(Model):
    organisations = ListType(ModelType(OrganisationDTO))


class NewOrganisationDTO(Model):
    """ Describes a JSON model to create a new organisation """

    admins = ListType(LongType(), required=True)
    name = StringType(required=True)
    logo = StringType()
    url = StringType()
    visibility = StringType(
        required=True,
        validators=[validate_organisation_visibility],
        serialize_when_none=False,
    )


class OrganisationProjectsDTO(Model):
    """ Describes a JSON model to create a project team """

    project_name = StringType(serialize_when_none=False)
    project_id = IntType(serialize_when_none=False)
