import json
from backend.models.dtos.partner_stats_dto import (
    GroupedPartnerStatsDTO,
    FilteredPartnerStatsDTO,
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

    @cached(grouped_partner_stats_cache)
    def fetch_grouped_partner_stats(
        self, group_id: str, limit: int, offset: int
    ) -> GroupedPartnerStatsDTO:
        group_stats = requests.post(
            MAPSWIPE_API_URL,
            headers={"Content-Type": "application/json"},
            data=json.dumps(
                self.__build_query_user_group_stats(group_id, limit, offset)
            ),
        )
        print("group_stats", group_stats.text)

        grouped_parter_stats_dto = GroupedPartnerStatsDTO()
        grouped_parter_stats_dto.provider = "mapswipe"
        grouped_parter_stats_dto.id_inside_provider = group_id

        return grouped_parter_stats_dto

    @cached(filtered_partner_stats_cache)
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
