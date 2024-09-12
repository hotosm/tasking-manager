from backend.models.dtos.partner_stats_dto import PartnerStatsDTO
from cachetools import TTLCache, cached
import requests

partner_stats_cache = TTLCache(maxsize=16, ttl=60 * 60 * 24)
MAPSWIPE_API_URL = "https://api.mapswipe.org/graphql/"


class MapswipeService:
    @staticmethod
    def __build_query_user_group_stats(group_id: str):
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
        variables = {"limit": 10, "offset": 0, "pk": group_id}
        return {operationName, query, variables}

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
        return {operationName, query, variables}

    @cached(partner_stats_cache)
    def fetch_stats(
        self, group_id: str, from_date: str, to_date: str
    ) -> PartnerStatsDTO:
        group_stats = requests.post(
            MAPSWIPE_API_URL, self.__build_query_user_group_stats(group_id)
        )
        filtered_group_stats = requests.post(
            MAPSWIPE_API_URL,
            self.__build_query_filtered_user_group_stats(group_id, from_date, to_date),
        )

        # Load fetched stats into the DTO
        parter_stats_dto = PartnerStatsDTO()
