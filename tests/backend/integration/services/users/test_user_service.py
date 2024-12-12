from unittest.mock import patch

from tests.backend.base import BaseTestCase
from backend.models.postgis.message import Message
from backend.models.postgis.statuses import UserRole, UserGender
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

    @staticmethod
    def add_user_identifying_information(user: User) -> User:
        user.username = "Test User"
        user.email_address = "test@example.com"
        user.twitter_id = "@Test"
        user.facebook_id = "@FBTest"
        user.linkedin_id = "@LinkedIn"
        user.slack_id = "@Slack"
        user.skype_id = "@Skype"
        user.irc_id = "IRC"
        user.name = "Some name here"
        user.city = "Some city"
        user.country = "Some country"
        user.picture_url = "https://test.com/path/to/picture.png"
        user.gender = UserGender.MALE.value
        user.self_description_gender = "I am male"
        user.default_editor = "ID"
        user.save()
        return user

    def check_user_details_deleted(self, user: User, deleted: bool):
        if deleted:
            check = self.assertIsNone
            self.assertNotEquals(UserRole.ADMIN.value, user.role)
            self.assertEqual(f"user_{user.id}", user.username)
        else:
            self.assertNotEquals(f"user_{user.id}", user.username)
            check = self.assertIsNotNone
        check(user.email_address)
        check(user.twitter_id)
        check(user.facebook_id)
        check(user.linkedin_id)
        check(user.slack_id)
        check(user.skype_id)
        check(user.irc_id)
        check(user.name)
        check(user.city)
        check(user.country)
        check(user.picture_url)
        check(user.gender)
        check(user.self_description_gender)
        self.assertEqual([], user.accepted_licenses)
        self.assertEqual([], user.interests)

    def test_delete_user_same_user(self):
        test_user = self.add_user_identifying_information(create_canned_user())
        UserService.delete_user_by_id(test_user.id, test_user.id)
        self.check_user_details_deleted(User().get_by_id(test_user.id), deleted=True)

    def test_delete_user_different_user(self):
        test_user = self.add_user_identifying_information(create_canned_user())
        other_user = return_canned_user("someone", test_user.id + 1)
        other_user.create()
        UserService.delete_user_by_id(test_user.id, other_user.id)
        self.check_user_details_deleted(User().get_by_id(test_user.id), deleted=False)

    def test_delete_user_different_admin_user(self):
        test_user = self.add_user_identifying_information(create_canned_user())
        other_user = return_canned_user("someone", test_user.id + 1)
        other_user.set_user_role(UserRole.ADMIN)
        other_user.create()
        UserService.delete_user_by_id(test_user.id, other_user.id)
        self.check_user_details_deleted(User().get_by_id(test_user.id), deleted=True)
