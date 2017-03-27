import unittest
from unittest.mock import patch
from tests.server.helpers.test_helpers import get_canned_osm_user_details
from server.services.authentication_service import AuthenticationService, AuthServiceError, User


class TestAuthenticationService(unittest.TestCase):

    def test_unable_to_find_user_in_osm_response_raises_error(self):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act / Assert
        with self.assertRaises(AuthServiceError):
            AuthenticationService().login_user(osm_response, 'wont-find')

    @patch.object(User, 'get')
    def test_if_user_get_called_with_osm_id(self, mock_user_get):
        # Arrange
        osm_response = get_canned_osm_user_details()

        # Act
        AuthenticationService().login_user(osm_response)

        # Assert
        mock_user_get.assert_called_with(7777777)

    @patch.object(User, 'create_from_osm_user_details')
    @patch.object(User, 'get')
    def test_if_user_create_called_if_user_not_found(self, mock_user_get, mock_user_create):
        # Arrange
        osm_response = get_canned_osm_user_details()
        mock_user_get.return_value = None

        # Act
        AuthenticationService().login_user(osm_response)

        # Assert
        mock_user_create.assert_called_with(7777777, 'Thinkwhere Test', 16)

