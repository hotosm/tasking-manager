from backend.services.users.osm_service import OSMService, OSMServiceError
from tests.backend.base import BaseTestCase


class TestOsmService(BaseTestCase):
    def test_get_osm_details_for_user_raises_error_if_invalid_user_id(self):
        # Act/Assert
        with self.assertRaises(OSMServiceError):
            OSMService.get_osm_details_for_user("1xcf")

    def test_get_osm_details_for_user_returns_user_details_if_valid_user_id(self):
        # Act
        dto = OSMService.get_osm_details_for_user(13526430)
        # Assert
        self.assertEqual(dto.account_created, "2021-06-10T01:27:18Z")

    def test_is_user_deleted(self):
        self.assertTrue(OSMService.is_osm_user_gone(535043))
        self.assertFalse(OSMService.is_osm_user_gone(2078753))

    def test_get_deleted_users(self):
        # These are the first 10 deleted users on 2024-04-16. This should ensure that the test finishes quickly.
        # Otherwise, it can take 6s+ (dependent upon network speed)
        deleted_users = [4, 142, 593, 601, 1769, 2161, 2238, 2782, 2868]
        generator = OSMService.get_deleted_users()
        for deleted_user in generator:
            if deleted_user in deleted_users:
                deleted_users.remove(deleted_user)
            if len(deleted_users) == 0:
                break
        self.assertEquals(0, len(deleted_users))
