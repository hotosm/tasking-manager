import unittest
import xml.etree.ElementTree as ET
from server.services.authentication_service import AuthenticationService


class TestAuthenticationService(unittest.TestCase):

    def test_valid_xml(self):
        # Arrange
        osm_response = self._get_test_file()

        # Act
        AuthenticationService().login_user(osm_response)



    def _get_test_file(self):
        """ Helper method to find test file, dependent on where tests are being run from """
        file_locations = ['./test_files/osm_user_details.xml',
                          './server/unit/services/test_files/osm_user_details.xml',
                          './tests/server/unit/services/test_files/osm_user_details.xml']

        for location in file_locations:
            try:
                open(location, 'r')
                return ET.parse(location)
            except FileNotFoundError:
                continue

        raise FileNotFoundError('Test file not found')
