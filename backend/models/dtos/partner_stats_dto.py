from schematics import Model
from schematics.types import (
    StringType,
    LongType,
    IntType,
    ListType,
    UTCDateTimeType,
    ModelType,
    FloatType,
    BooleanType,
)


class MemberDTO(Model):
    id: StringType()
    user_id: StringType(serialized_name="userId")
    username: StringType()
    is_active: BooleanType(serialized_name="isActive")
    total_mapping_projects = IntType(serialized_name="totalMappingProjects")
    total_constribution_time: IntType(serialized_name="totalconstributionTime")
    total_constributions: IntType(serialized_name="totalconstributions")


class UserMembershipsDTO(Model):
    count: IntType()
    users: ListType(ModelType(MemberDTO))


class OrganizationContributionsDTO(Model):
    organization_name = StringType(serialized_name="organizationName")
    total_constributions: IntType(serialized_name="totalconstributions")


class UserContributionsDTO(Model):
    total_mapping_projects = IntType(serialized_name="totalMappingProjects")
    total_constribution_time: IntType(serialized_name="totalconstributionTime")
    total_constributions: IntType(serialized_name="totalconstributions")
    username = StringType()
    user_id = StringType(serialized_name="userId")


class GeojsonDTO(Model):
    type = StringType()
    coordinates = ListType(FloatType)


class GeoContributionsDTO(Model):
    geojson = ModelType(GeojsonDTO)
    total_constributions = IntType(serialized_name="totalconstributions")


class ContributionsByDateDTO(Model):
    task_date = StringType(serialized_name="taskDate")
    total_constributions = IntType(serialized_name="totalconstributions")


class ContributionTimeByDateDTO(Model):
    date = StringType(serialized_name="date")
    total_constribution_time: IntType(serialized_name="totalconstributionTime")


class ContributionsByProjectTypeDTO(Model):
    project_type = StringType(serialized_name="projectType")
    project_type_display = StringType(serialized_name="projectTypeDisplay")
    total_constributions = IntType(serialized_name="totalconstributions")


class GroupedPartnerStatsDTO(Model):
    """General statistics of a partner and its members."""

    id: LongType()
    provider: StringType()
    id_inside_provider: StringType(serialized_name="idInsideProvider")
    name_inside_provider: StringType(serialized_name="nameInsideProvider")
    total_members: IntType(serialized_name="totalMembers")

    users = ModelType(UserMembershipsDTO)

    # General stats of partner
    total_contributors: IntType(serialized_name="totalContributors")
    total_constributions: IntType(serialized_name="totalconstributions")
    total_constribution_time: IntType(serialized_name="totalconstributionTime")

    # Recent contributions during the last 1 month
    total_recent_contributors: IntType(serialized_name="totalRecentContributors")
    total_recent_constributions: IntType(serialized_name="totalRecentconstributions")
    total_recent_constribution_time: IntType(
        serialized_name="totalRecentconstributionTime"
    )


class FilteredPartnerStatsDTO(Model):
    """Statistics of a partner contributions filtered by time range."""

    id: LongType()
    provider: StringType()
    id_inside_provider: StringType(serialized_name="idInsideProvider")
    name_inside_provider: StringType(serialized_name="nameInsideProvider")

    from_date = UTCDateTimeType(serialized_name="fromDate")
    to_date = UTCDateTimeType(serialized_name="toDate")
    constributions_by_user = ListType(
        ModelType(UserContributionsDTO), serialized_name="contributionsByUser"
    )
    constributions_by_geo = ListType(
        ModelType(GeoContributionsDTO), serialized_name="contributionsByGeo"
    )
    constributions_by_project_type = ListType(
        ModelType(ContributionsByProjectTypeDTO),
        serialized_name="contributionsByProjectType",
    )
    constributions_by_date = ListType(
        ModelType(ContributionsByDateDTO), serialized_name="contributionsByDate"
    )
    constributions_by_organization_name = ListType(
        ModelType(OrganizationContributionsDTO),
        serialized_name="contributionsByorganizationName",
    )
    constribution_time_by_date = ListType(
        ModelType(ContributionTimeByDateDTO), serialized_name="contributionTimeByDate"
    )
