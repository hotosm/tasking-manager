import json
import logging

import httpx

from backend.exceptions import Conflict
from backend.models.dtos.partner_stats_dto import (
    AreaSwipedByProjectTypeDTO,
    ContributionsByDateDTO,
    ContributionsByProjectTypeDTO,
    ContributionTimeByDateDTO,
    FilteredPartnerStatsDTO,
    GeoContributionsDTO,
    GeojsonDTO,
    GroupedPartnerStatsDTO,
    OrganizationContributionsDTO,
    UserContributionsDTO,
    UserGroupMemberDTO,
)

from urllib.parse import urlparse
from backend.config import settings

logger = logging.getLogger(__name__)

MAPSWIPE_API_URL = settings.MAPSWIPE_API_URL


class MapswipeService:
    _client: httpx.AsyncClient | None = None

    async def _ensure_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                headers={"User-Agent": "mapswipe-backend-service/1.0"},
                timeout=15,
            )
        return self._client

    def _get_origin(self) -> str:
        parsed = urlparse(MAPSWIPE_API_URL)
        return f"{parsed.scheme}://{parsed.netloc}"

    async def _fetch_csrf_cookie(self, client: httpx.AsyncClient) -> str | None:
        """GET health-check or root to populate cookies. Return CSRF token if found."""
        origin = self._get_origin()
        for path in ("/health-check/", "/"):
            try:
                await client.get(origin + path)
            except httpx.RequestError:
                logger.debug("GET %s failed (ignored)", origin + path)
            for ck in ("MAPSWIPE-PROD-CSRFTOKEN", "csrftoken", "CSRF-TOKEN"):
                val = client.cookies.get(ck)

                if val:
                    logger.debug("Found CSRF cookie %s", ck)
                    return val
        return None

    async def _post_graphql(self, payload: dict) -> dict:
        """
        Async POST GraphQL payload, handle CSRF (Referer/Origin + X-CSRFToken), retry once on 403,
        check HTTP and GraphQL errors, and return parsed JSON dict.
        """
        client = await self._ensure_client()
        origin = self._get_origin()

        # try to obtain CSRF cookie
        csrf_token = await self._fetch_csrf_cookie(client)

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Referer": origin,
            "Origin": origin,
        }
        if csrf_token:
            headers["X-CSRFToken"] = csrf_token

        try:
            resp = await client.post(MAPSWIPE_API_URL, headers=headers, json=payload)
        except httpx.RequestError as exc:
            logger.exception("MapSwipe POST failed: %s", exc)
            raise Conflict(
                "MAPSWIPE_NETWORK_ERROR", f"Failed to reach MapSwipe API: {exc}"
            )

        # retry on 403 after refreshing cookies once
        if resp.status_code == 403:
            logger.warning(
                "MapSwipe responded 403; refreshing cookies and retrying once."
            )
            await self._fetch_csrf_cookie(client)
            # update csrf_token if present
            for ck in ("MAPSWIPE-PROD-CSRFTOKEN", "csrftoken", "CSRF-TOKEN"):
                csrf_token = client.cookies.get(ck)
                if csrf_token:
                    headers["X-CSRFToken"] = csrf_token
                    break
            else:
                headers.pop("X-CSRFToken", None)

            try:
                resp = await client.post(
                    MAPSWIPE_API_URL, headers=headers, json=payload
                )
            except httpx.RequestError as exc:
                logger.exception("MapSwipe POST retry failed: %s", exc)
                raise Conflict(
                    "MAPSWIPE_NETWORK_ERROR",
                    f"Failed to reach MapSwipe API on retry: {exc}",
                )

        # HTTP errors
        if resp.status_code >= 400:
            logger.error(
                "MapSwipe HTTP error %s: %s", resp.status_code, resp.text[:2000]
            )
            raise Conflict("MAPSWIPE_HTTP_ERROR", f"MapSwipe HTTP {resp.status_code}")

        # parse JSON
        try:
            parsed = resp.json()
        except ValueError:
            logger.error("MapSwipe returned non-JSON: %s", resp.text[:2000])
            raise Conflict(
                "MAPSWIPE_INVALID_RESPONSE", "MapSwipe returned non-JSON response"
            )

        # GraphQL-level errors
        if parsed.get("errors"):
            err_msg = parsed["errors"][0].get("message", "GraphQL error")
            logger.error(
                "MapSwipe GraphQL error: %s -- full: %s", err_msg, parsed["errors"]
            )
            raise Conflict(
                "MAPSWIPE_GRAPHQL_ERROR", f"MapSwipe GraphQL error: {err_msg}"
            )

        # guard against null data
        if parsed.get("data") is None:
            logger.error("MapSwipe returned null data: %s", parsed)
            raise Conflict("MAPSWIPE_NO_DATA", "MapSwipe returned null data")

        return parsed

    @staticmethod
    def __build_query_user_group_stats(group_id: str, limit: int, offset: int):
        """A private method to build a graphQl query for fetching a user group's stats from Mapswipe."""

        operation_name = "UserGroupStats"
        query = """
        query UserGroupStats($pk: ID!, $limit: Int!, $offset: Int!) {
          contributorUserGroup(userGroupId: {firebaseId: $pk}) {
            id
            name
            description
            userMemberships(pagination: {limit: $limit, offset: $offset}) {
              totalCount
              results {
                id
                isActive
                totalSwipes
                totalSwipeTime
                totalMappingProjects
                user {
                  id
                  firebaseId
                  username
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          communityUserGroupStats(userGroupId: {firebaseId: $pk}) {
            id
            stats {
              totalContributors
              totalSwipes
              totalSwipeTime
              __typename
            }
            statsLatest {
              totalContributors
              totalSwipes
              totalSwipeTime
              __typename
            }
            __typename
          }
        }
        """
        variables = {"pk": group_id, "limit": limit, "offset": offset}
        return {"operationName": operation_name, "query": query, "variables": variables}

    def __build_query_filtered_user_group_stats(
        self, group_id: str, from_date: str, to_date: str
    ):
        """A private method to build a graphQl query to fetch a mapswipe group's stats within a timerange."""

        operation_name = "FilteredUserGroupStats"
        query = """
        query FilteredUserGroupStats($pk: ID!, $fromDate: Date!, $toDate: Date!) {
          communityUserGroupStats(userGroupId: {firebaseId: $pk}) {
            id
            filteredStats(dateRange: {fromDate: $fromDate, toDate: $toDate}) {
              areaSwipedByProjectType {
                projectTypeDisplay
                totalArea
                projectType
                __typename
              }
              swipeByDate {
                taskDate
                totalSwipes
                __typename
              }
              swipeByOrganizationName {
                totalSwipes
                organizationName
                __typename
              }
              swipeByProjectGeo {
                totalContribution
                geojson
                __typename
              }
              swipeByProjectType {
                totalSwipes
                projectTypeDisplay
                projectType
                __typename
              }
              swipeTimeByDate {
                totalSwipeTime
                date
                __typename
              }
              __typename
            }
            __typename
          }
        }
        """
        variables = {"pk": group_id, "fromDate": from_date, "toDate": to_date}
        return {"operationName": operation_name, "query": query, "variables": variables}

    def setup_group_dto(
        self, partner_id: str, group_id: str, resp_body: str
    ) -> GroupedPartnerStatsDTO:
        group_stats = json.loads(resp_body)["data"]
        group_info = group_stats["contributorUserGroup"]
        stats_info = group_stats["communityUserGroupStats"]

        if group_info is None:
            raise Conflict(
                "INVALID_MAPSWIPE_GROUP_ID",
                "The mapswipe group ID linked to this partner is invalid. Please contact an admin.",
            )

        group_dto = GroupedPartnerStatsDTO(provider="mapswipe")
        group_dto.id = partner_id
        group_dto.id_inside_provider = group_id
        group_dto.name_inside_provider = group_info["name"]
        group_dto.description_inside_provider = group_info["description"]

        memberships = group_info["userMemberships"]
        group_dto.members_count = memberships["totalCount"]
        group_dto.members = []
        for user_resp in memberships["results"]:
            user = UserGroupMemberDTO()
            user.id = user_resp["id"]
            user.is_active = user_resp["isActive"]
            user.user_id = user_resp["user"]["firebaseId"]
            user.username = user_resp["user"]["username"]
            user.total_contributions = user_resp["totalSwipes"]
            user.total_contribution_time = user_resp["totalSwipeTime"]
            user.total_mapping_projects = user_resp["totalMappingProjects"]
            group_dto.members.append(user)

        group_dto.total_contributors = stats_info["stats"]["totalContributors"]
        group_dto.total_contributions = stats_info["stats"]["totalSwipes"]
        group_dto.total_contribution_time = stats_info["stats"]["totalSwipeTime"]
        group_dto.total_recent_contributors = stats_info["statsLatest"][
            "totalContributors"
        ]
        group_dto.total_recent_contributions = stats_info["statsLatest"]["totalSwipes"]
        group_dto.total_recent_contribution_time = stats_info["statsLatest"][
            "totalSwipeTime"
        ]

        return group_dto

    @staticmethod
    def setup_filtered_dto(
        partner_id: str,
        group_id: str,
        from_date: str,
        to_date: str,
        resp_body: str,
    ):
        filtered_stats_dto = FilteredPartnerStatsDTO(provider="mapswipe")
        filtered_stats_dto.id = partner_id
        filtered_stats_dto.id_inside_provider = group_id
        filtered_stats_dto.from_date = from_date
        filtered_stats_dto.to_date = to_date

        filtered_stats = json.loads(resp_body)["data"]
        if (
            filtered_stats is None
            or filtered_stats.get("communityUserGroupStats") is None
        ):
            raise Conflict(
                "INVALID_MAPSWIPE_GROUP_ID",
                "The mapswipe group ID linked to this partner is invalid. Please contact an admin.",
            )

        filtered_stats = filtered_stats["communityUserGroupStats"]["filteredStats"]

        # userStats is not in the updated schema; safely default to empty
        filtered_stats_dto.contributions_by_user = []
        for user_stats in filtered_stats.get("userStats", []):
            user_contributions = UserContributionsDTO()
            user_contributions.user_id = user_stats["userId"]
            user_contributions.username = user_stats["username"]
            user_contributions.total_contributions = user_stats["totalSwipes"]
            user_contributions.total_contribution_time = user_stats["totalSwipeTime"]
            user_contributions.total_mapping_projects = user_stats[
                "totalMappingProjects"
            ]
            filtered_stats_dto.contributions_by_user.append(user_contributions)

        contributions_by_geo = []
        for geo_stats in filtered_stats["swipeByProjectGeo"]:
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

    async def fetch_grouped_partner_stats(
        self,
        partner_id: int,
        group_id: str,
        limit: int,
        offset: int,
        download_as_csv: bool,
    ) -> GroupedPartnerStatsDTO:
        """Service to fetch user group statistics by each member with pagination"""

        if download_as_csv:
            limit = 1_000_000
            offset = 0

        payload = self.__build_query_user_group_stats(group_id, limit, offset)
        parsed = await self._post_graphql(payload)
        group_dto = self.setup_group_dto(partner_id, group_id, json.dumps(parsed))
        return group_dto

    async def fetch_filtered_partner_stats(
        self,
        partner_id: str,
        group_id: str,
        from_date: str,
        to_date: str,
    ) -> FilteredPartnerStatsDTO:
        payload = self.__build_query_filtered_user_group_stats(
            group_id, from_date, to_date
        )
        parsed = await self._post_graphql(payload)
        filtered_dto = self.setup_filtered_dto(
            partner_id, group_id, from_date, to_date, json.dumps(parsed)
        )
        return filtered_dto

    async def aclose(self):
        if self._client:
            await self._client.aclose()
            self._client = None
