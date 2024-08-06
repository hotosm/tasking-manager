from unittest.mock import patch

from tests.backend.base import BaseTestCase
from backend.models.postgis.message import Message
from backend.services.users.user_service import (
    UserService,
    MappingLevel,
    User,
    OSMService,
    UserOSMDTO,
)
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    create_canned_project,
    get_canned_user,
    return_canned_user,
)


class TestUserService(BaseTestCase):
    def test_upsert_inserts_project_if_not_exists(self):
        self.test_project, self.test_user = create_canned_project()
        # Arrange
        UserService.upsert_mapped_projects(self.test_user.id, self.test_project.id)

        # Act
        projects = UserService.get_mapped_projects(self.test_user.username, "en")

        # Assert
        mapped_project = projects.mapped_projects[0]
        self.assertEqual(
            mapped_project.project_id, self.test_project.id
        )  # We should find we've mapped the test project

    def test_set_level_adds_level_to_user(self):
        self.test_user = get_canned_user("Thinkwhere TEST")
        if self.test_user is None:
            self.test_user = create_canned_user()

        # Act
        user = UserService.set_user_mapping_level(
            self.test_user.username, MappingLevel.ADVANCED.name
        )

        # Assert
        self.assertEqual(MappingLevel(user.mapping_level), MappingLevel.ADVANCED)

    @patch.object(User, "create")
    def test_user_can_register_with_correct_mapping_level(self, mock_user):
        # Act
        test_user = UserService().register_user(
            12, "Thinkwhere", 300, "some_picture_url", None
        )

        # Assert
        self.assertEqual(test_user.mapping_level, MappingLevel.INTERMEDIATE.value)

    @patch.object(Message, "save")
    @patch.object(User, "save")
    @patch.object(OSMService, "get_osm_details_for_user")
    @patch.object(UserService, "get_user_by_id")
    def test_mapper_level_updates_correctly(
        self, mock_user, mock_osm, mock_save, mock_message
    ):
        # Arrange
        test_user = User()
        test_user.username = "Test User"
        test_user.mapping_level = MappingLevel.BEGINNER.value
        mock_user.return_value = test_user

        test_osm = UserOSMDTO()
        test_osm.changeset_count = 350
        mock_osm.return_value = test_osm

        # Act
        UserService.check_and_update_mapper_level(12)

        # Assert
        self.assertTrue(test_user.mapping_level, MappingLevel.INTERMEDIATE.value)

    def test_update_user_updates_user_details(self):
        # Arrange
        create_canned_user()
        # Act
        UserService.update_user(777777, "Thinkwhere", None)
        # Assert
        user = UserService.get_user_by_id(777777)
        self.assertEqual(user.username, "Thinkwhere")

    def test_register_user_creates_new_user(self):
        # Arrange
        test_user = return_canned_user()
        # Act
        UserService.register_user(test_user.id, test_user.username, 251, None, None)
        # Arrange
        expected_user = UserService.get_user_by_id(777777)
        # Assert
        self.assertEqual(expected_user.username, test_user.username)
        self.assertEqual(expected_user.mapping_level, MappingLevel.INTERMEDIATE.value)
