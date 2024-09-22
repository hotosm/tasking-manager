import json
from backend.exceptions import Conflict
from backend.models.dtos.partner_stats_dto import (
    GroupedPartnerStatsDTO,
    FilteredPartnerStatsDTO,
    UserGroupMemberDTO,
    UserContributionsDTO,
    GeojsonDTO,
    GeoContributionsDTO,
    AreaSwipedByProjectTypeDTO,
    ContributionsByDateDTO,
    ContributionTimeByDateDTO,
    ContributionsByProjectTypeDTO,
    OrganizationContributionsDTO,
)
from cachetools import TTLCache, cached
import requests

grouped_partner_stats_cache = TTLCache(maxsize=128, ttl=60 * 60 * 24)
filtered_partner_stats_cache = TTLCache(maxsize=128, ttl=60 * 60 * 24)
MAPSWIPE_API_URL = "https://api.mapswipe.org/graphql/"


class MapswipeService:
    @staticmethod
    def __build_query_user_group_stats(group_id: str, limit: int, offset: int):
        """A private method to build a graphQl query for fetching a user group's stats from Mapswipe."""

        operationName = "UserGroupStats"
        query = """
        query UserGroupStats($pk: ID!, $limit: Int!, $offset: Int!) {
             userGroup(pk: $pk) {
                 id
                 userGroupId
                 name
                 description
                 userMemberships(pagination: {limit: $limit, offset: $offset}) {
                     count
                     items {
                         id
                         userId
                         username
                         isActive
                         totalMappingProjects
                         totalSwipeTime
                         totalSwipes
                         __typename
                     }
                     __typename
                 }
                 __typename
             }
             userGroupStats(userGroupId: $pk) {
                 id
                 stats {
                     totalContributors
                     totalSwipes
                     totalSwipeTime
                     __typename
                 }
                 statsLatest {
                     totalContributors
                     totalSwipeTime
                     totalSwipes
                     __typename
                 }
                 __typename
             }
        }
        """
        variables = {"limit": limit, "offset": offset, "pk": group_id}
        return {"operationName": operationName, "query": query, "variables": variables}

    def __build_query_filtered_user_group_stats(
        self, group_id: str, from_date: str, to_date: str
    ):
        """A private method to build a graphQl query to fetch a mapswipe group's stats within a timerange."""

        operationName = "FilteredUserGroupStats"
        query = """
        query FilteredUserGroupStats($pk: ID!, $fromDate: DateTime!, $toDate: DateTime!) {
            userGroup(pk: $pk) {
                id
            }
            userGroupStats(userGroupId: $pk) {
                id
                filteredStats(dateRange: {fromDate: $fromDate, toDate: $toDate}) {
                    userStats {
                        totalMappingProjects
                        totalSwipeTime
                        totalSwipes
                        username
                        userId
                        __typename
                    }
                    contributionByGeo {
                        geojson
                        totalContribution
                        __typename
                    }
                    areaSwipedByProjectType {
                        totalArea
                        projectTypeDisplay
                        projectType
                        __typename
                    }
                    swipeByDate {
                        taskDate
                        totalSwipes
                        __typename
                    }
                    swipeTimeByDate {
                        date
                        totalSwipeTime
                        __typename
                    }
                    swipeByProjectType {
                        projectType
                        projectTypeDisplay
                        totalSwipes
                        __typename
                    }
                    swipeByOrganizationName {
                        organizationName
                        totalSwipes
                        __typename
                    }
                    __typename
                }
                __typename
            }
        }
        """
        variables = {"fromDate": from_date, "toDate": to_date, "pk": group_id}
        return {"operationName": operationName, "query": query, "variables": variables}

    def setup_group_dto(
        self, partner_id: str, group_id: str, resp_body: str
    ) -> GroupedPartnerStatsDTO:
        group_stats = json.loads(resp_body)["data"]
        group_dto = GroupedPartnerStatsDTO()
        group_dto.id = partner_id
        group_dto.provider = "mapswipe"
        group_dto.id_inside_provider = group_id

        if group_stats["userGroup"] is None:
            raise Conflict(
                "INVALID_MAPSWIPE_GROUP_ID",
                "The mapswipe group ID linked to this partner is invalid. Please contact an admin.",
            )

        group_dto.name_inside_provider = group_stats["userGroup"]["name"]
        group_dto.description_inside_provider = group_stats["userGroup"]["description"]

        group_dto.members_count = group_stats["userGroup"]["userMemberships"]["count"]
        group_dto.members = []
        for user_resp in group_stats["userGroup"]["userMemberships"]["items"]:
            user = UserGroupMemberDTO()
            user.id = user_resp["id"]
            user.is_active = user_resp["isActive"]
            user.user_id = user_resp["userId"]
            user.username = user_resp["username"]
            user.total_contributions = user_resp["totalSwipes"]
            user.total_contribution_time = user_resp["totalSwipeTime"]
            user.total_mapping_projects = user_resp["totalMappingProjects"]
            group_dto.members.append(user)

        group_dto.total_contributors = group_stats["userGroupStats"]["stats"][
            "totalContributors"
        ]
        group_dto.total_contributions = group_stats["userGroupStats"]["stats"][
            "totalSwipes"
        ]
        group_dto.total_contribution_time = group_stats["userGroupStats"]["stats"][
            "totalSwipeTime"
        ]
        group_dto.total_recent_contributors = group_stats["userGroupStats"][
            "statsLatest"
        ]["totalContributors"]
        group_dto.total_recent_contributions = group_stats["userGroupStats"][
            "statsLatest"
        ]["totalSwipes"]
        group_dto.total_recent_contribution_time = group_stats["userGroupStats"][
            "statsLatest"
        ]["totalSwipeTime"]

        return group_dto

    @staticmethod
    def setup_filtered_dto(
        partner_id: str,
        group_id: str,
        from_date: str,
        to_date: str,
        resp_body: str,
    ):
        filtered_stats_dto = FilteredPartnerStatsDTO()
        filtered_stats_dto.id = partner_id
        filtered_stats_dto.provider = "mapswipe"
        filtered_stats_dto.id_inside_provider = group_id
        filtered_stats_dto.from_date = from_date
        filtered_stats_dto.to_date = to_date

        filtered_stats = json.loads(resp_body)["data"]

        if filtered_stats["userGroup"] is None:
            raise Conflict(
                "INVALID_MAPSWIPE_GROUP_ID",
                "The mapswipe group ID linked to this partner is invalid. Please contact an admin.",
            )

        filtered_stats = filtered_stats["userGroupStats"]["filteredStats"]

        stats_by_user = []
        for user_stats in filtered_stats["userStats"]:
            user_contributions = UserContributionsDTO()
            user_contributions.user_id = user_stats["userId"]
            user_contributions.username = user_stats["username"]
            user_contributions.total_contributions = user_stats["totalSwipes"]
            user_contributions.total_contribution_time = user_stats["totalSwipeTime"]
            user_contributions.total_mapping_projects = user_stats[
                "totalMappingProjects"
            ]
            stats_by_user.append(user_contributions)
        filtered_stats_dto.contributions_by_user = stats_by_user

        contributions_by_geo = []
        for geo_stats in filtered_stats["contributionByGeo"]:
            geo_contributions = GeoContributionsDTO()
            geo_contributions.total_contributions = geo_stats["totalContribution"]
            geojson = GeojsonDTO()
            geojson.type = geo_stats["geojson"]["type"]
            geojson.coordinates = geo_stats["geojson"]["coordinates"]
            geo_contributions.geojson = geojson
            contributions_by_geo.append(geo_contributions)
        filtered_stats_dto.contributions_by_geo = contributions_by_geo

        areas_swiped = []
        for area_swiped in filtered_stats["areaSwipedByProjectType"]:
            area_swiped_by_project_type = AreaSwipedByProjectTypeDTO()
            area_swiped_by_project_type.project_type = area_swiped["projectType"]
            area_swiped_by_project_type.project_type_display = area_swiped[
                "projectTypeDisplay"
            ]
            area_swiped_by_project_type.total_area = area_swiped["totalArea"]
            areas_swiped.append(area_swiped_by_project_type)
        filtered_stats_dto.area_swiped_by_project_type = areas_swiped

        dates = []
        for by_date in filtered_stats["swipeByDate"]:
            contributions_by_date = ContributionsByDateDTO()
            contributions_by_date.task_date = by_date["taskDate"]
            contributions_by_date.total_contributions = by_date["totalSwipes"]
            dates.append(contributions_by_date)
        filtered_stats_dto.contributions_by_date = dates

        dates = []
        for by_date in filtered_stats["swipeTimeByDate"]:
            contribution_time_by_date = ContributionTimeByDateDTO()
            contribution_time_by_date.date = by_date["date"]
            contribution_time_by_date.total_contribution_time = by_date[
                "totalSwipeTime"
            ]
            dates.append(contribution_time_by_date)
        filtered_stats_dto.contribution_time_by_date = dates

        project_types = []
        for project_type in filtered_stats["swipeByProjectType"]:
            contributions_by_project_type = ContributionsByProjectTypeDTO()
            contributions_by_project_type.project_type = project_type["projectType"]
            contributions_by_project_type.project_type_display = project_type[
                "projectTypeDisplay"
            ]
            contributions_by_project_type.total_contributions = project_type[
                "totalSwipes"
            ]
            project_types.append(contributions_by_project_type)
        filtered_stats_dto.contributions_by_project_type = project_types

        organizations = []
        for organization in filtered_stats["swipeByOrganizationName"]:
            contributions_by_organization_name = OrganizationContributionsDTO()
            contributions_by_organization_name.organization_name = organization[
                "organizationName"
            ]
            contributions_by_organization_name.total_contributions = organization[
                "totalSwipes"
            ]
            organizations.append(contributions_by_organization_name)
        filtered_stats_dto.contributions_by_organization_name = organizations
        return filtered_stats_dto

    @cached(grouped_partner_stats_cache)
    def fetch_grouped_partner_stats(
        self,
        partner_id: int,
        group_id: str,
        limit: int,
        offset: int,
        downloadAsCSV: bool,
    ) -> GroupedPartnerStatsDTO:
        """Service to fetch user group statistics by each member with pagination"""

        if downloadAsCSV:
            limit = 1_000_000
            offset = 0

        resp_body = requests.post(
            MAPSWIPE_API_URL,
            headers={"Content-Type": "application/json"},
            data=json.dumps(
                self.__build_query_user_group_stats(group_id, limit, offset)
            ),
        ).text

        group_dto = self.setup_group_dto(partner_id, group_id, resp_body)
        return group_dto

    @cached(filtered_partner_stats_cache)
    def fetch_filtered_partner_stats(
        self,
        partner_id: str,
        group_id: str,
        from_date: str,
        to_date: str,
    ) -> FilteredPartnerStatsDTO:
        resp = requests.post(
            MAPSWIPE_API_URL,
            headers={"Content-Type": "application/json"},
            data=json.dumps(
                self.__build_query_filtered_user_group_stats(
                    group_id, from_date, to_date
                )
            ),
        )

        filtered_dto = self.setup_filtered_dto(
            partner_id, group_id, from_date, to_date, resp.text
        )
        return filtered_dto
