import unittest
from server.services.user_service import UserService
from tests.server.helpers.test_helpers import get_canned_simplified_osm_user_details


class TestUserService(unittest.TestCase):

    def test_user_service_can_parse_oms_user_details_xml(self):

        osm_response = get_canned_simplified_osm_user_details()

        UserService._parse_osm_user_details_response(osm_response)
