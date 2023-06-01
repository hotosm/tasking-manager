import requests
from flask import current_app

from backend.models.dtos.user_dto import UserOSMDTO


class OSMServiceError(Exception):
    """Custom Exception to notify callers an error occurred when in the User Service"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class OSMService:
    @staticmethod
    def get_osm_details_for_user(user_id: int) -> UserOSMDTO:
        """
        Gets OSM details for the user from OSM API
        :param user_id: user_id in scope
        :raises OSMServiceError
        """
        osm_user_details_url = (
            f"{current_app.config['OSM_SERVER_URL']}/api/0.6/user/{user_id}.json"
        )
        response = requests.get(osm_user_details_url)

        if response.status_code != 200:
            raise OSMServiceError("Bad response from OSM")

        return OSMService._parse_osm_user_details_response(response.json())

    @staticmethod
    def _parse_osm_user_details_response(
        osm_response: dict, user_element="user"
    ) -> UserOSMDTO:
        """Parses the OSM user details response and extracts user info"""
        osm_user = osm_response.get(user_element, None)

        if osm_user is None:
            raise OSMServiceError("User was not found in OSM response")

        osm_dto = UserOSMDTO()
        osm_dto.account_created = osm_user.get("account_created")
        osm_dto.changeset_count = osm_user.get("changesets").get("count")
        return osm_dto
