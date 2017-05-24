import os
import unittest

from server import create_app
from server.models.postgis.user import User, UserRole, MappingLevel


class TestUser(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        if self.skip_tests:
            return

    def tearDown(self):
        if self.skip_tests:
            return

        self.ctx.pop()

    def test_as_dto_will_not_return_email_if_not_owner(self):
        if self.skip_tests:
            return

        # Arrange
        test_user = User()
        test_user.role = UserRole.MAPPER.value
        test_user.mapping_level = MappingLevel.BEGINNER.value
        test_user.username = 'mrtest'
        test_user.email_address = 'test@test.com'

        # Act
        user_dto = test_user.as_dto('mastertest')

        # Assert
        self.assertFalse(user_dto.email_address)

    def test_as_dto_will_not_return_email_if_owner(self):
        if self.skip_tests:
            return

        # Arrange
        test_user = User()
        test_user.role = UserRole.MAPPER.value
        test_user.mapping_level = MappingLevel.BEGINNER.value
        test_user.username = 'mrtest'
        test_user.email_address = 'test@test.com'

        # Act
        user_dto = test_user.as_dto('mrtest')

        # Assert
        self.assertTrue(user_dto.email_address)
