from schematics import Model
from schematics.types import (
    StringType,
    IntType,
    ListType,
    ModelType,
    BooleanType,
    DictType,
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
    invite_only = BooleanType(default=False, serialized_name="inviteOnly")
    visibility = StringType()
    members = ListType(DictType(StringType, serialize_when_none=False))


class OrganisationDTO(Model):
    """ Describes JSON model for an organisation """

    organisation_id = IntType(serialized_name="organisationId")
    managers = ListType(ModelType(OrganisationManagerDTO), min_size=1, required=True)
    name = StringType(required=True)
    logo = StringType()
    description = StringType()
    url = StringType()
    is_manager = BooleanType(serialized_name="isManager")
    projects = ListType(StringType, serialize_when_none=False)
    teams = ListType(ModelType(OrganisationTeamsDTO))
    campaigns = ListType(ListType(StringType))


class ListOrganisationsDTO(Model):
    organisations = ListType(ModelType(OrganisationDTO))


class NewOrganisationDTO(Model):
    """ Describes a JSON model to create a new organisation """

    organisation_id = IntType(serialized_name="organisationId", required=False)
    managers = ListType(StringType(), required=True)
    name = StringType(required=True)
    logo = StringType()
    description = StringType()
    url = StringType()


class UpdateOrganisationDTO(OrganisationDTO):
    managers = ListType(StringType())
    name = StringType()


class OrganisationProjectsDTO(Model):
    """ Describes a JSON model to create a project team """

    project_name = StringType(serialize_when_none=False)
    project_id = IntType(serialize_when_none=False)
