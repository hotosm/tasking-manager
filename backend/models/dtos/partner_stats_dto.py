import pandas as pd
from schematics import Model
from schematics.types import (
    StringType,
    LongType,
    IntType,
    ListType,
    ModelType,
    FloatType,
    BooleanType,
)


class UserGroupMemberDTO(Model):
    id = StringType()
    user_id = StringType(serialized_name="userId")
    username = StringType()
    is_active = BooleanType(serialized_name="isActive")
    total_mapping_projects = IntType(serialized_name="totalMappingProjects")
    total_contribution_time = IntType(serialized_name="totalcontributionTime")
    total_contributions = IntType(serialized_name="totalcontributions")


class OrganizationContributionsDTO(Model):
    organization_name = StringType(serialized_name="organizationName")
    total_contributions = IntType(serialized_name="totalcontributions")


class UserContributionsDTO(Model):
    total_mapping_projects = IntType(serialized_name="totalMappingProjects")
    total_contribution_time = IntType(serialized_name="totalcontributionTime")
    total_contributions = IntType(serialized_name="totalcontributions")
    username = StringType()
    user_id = StringType(serialized_name="userId")


class GeojsonDTO(Model):
    type = StringType()
    coordinates = ListType(FloatType)


class GeoContributionsDTO(Model):
    geojson = ModelType(GeojsonDTO)
    total_contributions = IntType(serialized_name="totalcontributions")


class ContributionsByDateDTO(Model):
    task_date = StringType(serialized_name="taskDate")
    total_contributions = IntType(serialized_name="totalcontributions")


class ContributionTimeByDateDTO(Model):
    date = StringType(serialized_name="date")
    total_contribution_time = IntType(serialized_name="totalcontributionTime")


class ContributionsByProjectTypeDTO(Model):
    project_type = StringType(serialized_name="projectType")
    project_type_display = StringType(serialized_name="projectTypeDisplay")
    total_contributions = IntType(serialized_name="totalcontributions")


class AreaSwipedByProjectTypeDTO(Model):
    total_area = FloatType(serialized_name="totalArea")
    project_type = StringType(serialized_name="projectType")
    project_type_display = StringType(serialized_name="projectTypeDisplay")


class GroupedPartnerStatsDTO(Model):
    """General statistics of a partner and its members."""

    id = LongType()
    provider = StringType()
    id_inside_provider = StringType(serialized_name="idInsideProvider")
    name_inside_provider = StringType(serialized_name="nameInsideProvider")
    description_inside_provider = StringType(
        serialized_name="descriptionInsideProvider"
    )
    members_count = IntType(serialized_name="membersCount")
    members = ListType(ModelType(UserGroupMemberDTO))

    # General stats of partner
    total_contributors = IntType(serialized_name="totalContributors")
    total_contributions = IntType(serialized_name="totalcontributions")
    total_contribution_time = IntType(serialized_name="totalcontributionTime")

    # Recent contributions during the last 1 month
    total_recent_contributors = IntType(serialized_name="totalRecentContributors")
    total_recent_contributions = IntType(serialized_name="totalRecentcontributions")
    total_recent_contribution_time = IntType(
        serialized_name="totalRecentcontributionTime"
    )

    def to_csv(self):
        df = pd.json_normalize(self.to_primitive()["members"])

        df.drop(
            columns=["id"],
            inplace=True,
            axis=1,
        )
        df.rename(
            columns={
                "totalcontributionTime": "totalSwipeTimeInSeconds",
                "totalcontributions": "totalSwipes",
            },
            inplace=True,
        )

        return df.to_csv(index=False)


class FilteredPartnerStatsDTO(Model):
    """Statistics of a partner contributions filtered by time range."""

    id = LongType()
    provider = StringType()
    id_inside_provider = StringType(serialized_name="idInsideProvider")

    from_date = StringType(serialized_name="fromDate")
    to_date = StringType(serialized_name="toDate")
    contributions_by_user = ListType(
        ModelType(UserContributionsDTO), serialized_name="contributionsByUser"
    )
    contributions_by_geo = ListType(
        ModelType(GeoContributionsDTO), serialized_name="contributionsByGeo"
    )
    area_swiped_by_project_type = ListType(
        ModelType(AreaSwipedByProjectTypeDTO), serialized_name="areaSwipedByProjectType"
    )

    contributions_by_project_type = ListType(
        ModelType(ContributionsByProjectTypeDTO),
        serialized_name="contributionsByProjectType",
    )
    contributions_by_date = ListType(
        ModelType(ContributionsByDateDTO), serialized_name="contributionsByDate"
    )
    contributions_by_organization_name = ListType(
        ModelType(OrganizationContributionsDTO),
        serialized_name="contributionsByorganizationName",
    )
    contribution_time_by_date = ListType(
        ModelType(ContributionTimeByDateDTO), serialized_name="contributionTimeByDate"
    )
