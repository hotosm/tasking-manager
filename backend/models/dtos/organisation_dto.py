from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import (
    StringType,
    IntType,
    ListType,
    ModelType,
    BooleanType,
    DictType,
)

from backend.models.dtos.stats_dto import OrganizationStatsDTO
from backend.models.postgis.statuses import OrganisationType


def is_known_organisation_type(value):
    """ Validates organisation subscription type string """
    try:
        OrganisationType[value.upper()]
    except (AttributeError, KeyError):
        raise ValidationError(
            f"Unknown organisationType: {value}. Valid values are {OrganisationType.FREE.name}, "
            f"{OrganisationType.DISCOUNTED.name}, {OrganisationType.FULL_FEE.name}"
        )


class OrganisationManagerDTO(Model):
    """ Describes JSON model for a organisation manager """

    username = StringType(required=True)
    picture_url = StringType(serialized_name="pictureUrl")


class OrganisationTeamsDTO(Model):
    """ Describes JSON model for a team. To be used in the Organisations endpoints."""

    team_id = IntType(serialized_name="teamId")
    name = StringType(required=True)
    description = StringType()
    join_method = StringType(required=True, serialized_name="joinMethod")
    visibility = StringType()
    members = ListType(DictType(StringType, serialize_when_none=False))


class OrganisationDTO(Model):
    """ Describes JSON model for an organisation """

    organisation_id = IntType(serialized_name="organisationId")
    managers = ListType(ModelType(OrganisationManagerDTO), min_size=1, required=True)
    name = StringType(required=True)
    slug = StringType()
    logo = StringType()
    description = StringType()
    url = StringType()
    is_manager = BooleanType(serialized_name="isManager")
    projects = ListType(StringType, serialize_when_none=False)
    teams = ListType(ModelType(OrganisationTeamsDTO))
    campaigns = ListType(ListType(StringType))
    stats = ModelType(OrganizationStatsDTO, serialize_when_none=False)
    type = StringType(validators=[is_known_organisation_type])
    subscription_tier = IntType(serialized_name="subscriptionTier")


class ListOrganisationsDTO(Model):
    def __init__(self):
        super().__init__()
        self.organisations = []

    organisations = ListType(ModelType(OrganisationDTO))


class NewOrganisationDTO(Model):
    """ Describes a JSON model to create a new organisation """

    organisation_id = IntType(serialized_name="organisationId", required=False)
    managers = ListType(StringType(), required=True)
    name = StringType(required=True)
    slug = StringType()
    logo = StringType()
    description = StringType()
    url = StringType()
    type = StringType(validators=[is_known_organisation_type])
    subscription_tier = IntType(serialized_name="subscriptionTier")


class UpdateOrganisationDTO(OrganisationDTO):

    organisation_id = IntType(serialized_name="organisationId", required=False)
    managers = ListType(StringType())
    name = StringType()
    slug = StringType()
    logo = StringType()
    description = StringType()
    url = StringType()
    type = StringType(validators=[is_known_organisation_type])
