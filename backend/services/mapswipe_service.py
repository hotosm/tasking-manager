import json
from backend.models.dtos.partner_stats_dto import (
    GroupedPartnerStatsDTO,
    FilteredPartnerStatsDTO,
    UserGroupMemberDTO,
)
from cachetools import TTLCache, cached
import requests
from typing import Optional

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
        group_id: str, from_date: str, to_date: str
    ):
        """A private method to build a graphQl query for fetching a user group's stats within a timerange from Mapswipe."""

        operationName = "FilteredUserGroupStats"
        query = """
        query FilteredUserGroupStats($pk: ID!, $fromDate: DateTime!, $toDate: DateTime!) {
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

        print("final group dto", group_dto.total_contributors)
        return group_dto

    # @cached(grouped_partner_stats_cache)
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

    # @cached(filtered_partner_stats_cache)
    def fetch_filtered_partner_stats(
        self, group_id: str, from_date: Optional[str], to_date: Optional[str]
    ) -> FilteredPartnerStatsDTO:
        filtered_group_stats = requests.post(
            MAPSWIPE_API_URL,
            headers={"Content-Type": "application/json"},
            data=json.dumps(
                self.__build_query_filtered_user_group_stats(
                    group_id, from_date, to_date
                )
            ),
        )
        print("filtered_group_stats", filtered_group_stats)

        filtered_parter_stats_dto = FilteredPartnerStatsDTO()
        filtered_parter_stats_dto.provider = "mapswipe"
        filtered_parter_stats_dto.id_inside_provider = group_id

        return filtered_parter_stats_dto
