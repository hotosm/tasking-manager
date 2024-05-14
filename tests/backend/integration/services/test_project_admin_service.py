from unittest.mock import patch, MagicMock
import json
from flask import current_app

from backend.models.postgis.project import Project, User, NotFound, ProjectPriority
from backend.models.postgis.statuses import UserRole, ProjectDifficulty
from backend.services.messaging.message_service import MessageService
from backend.services.team_service import TeamService
from tests.backend.base import BaseTestCase
from backend.models.dtos.organisation_dto import ListOrganisationsDTO
from backend.services.project_admin_service import (
    ProjectAdminService,
    ProjectAdminServiceError,
    InvalidGeoJson,
)
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectDTO,
    ProjectInfoDTO,
    ProjectStatus,
)
from backend.services.organisation_service import OrganisationService
from backend.services.users.user_service import UserService
from tests.backend.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_project,
    return_canned_draft_project_json,
    return_canned_user,
    create_canned_organisation,
    create_canned_user,
)


class TestProjectAdminService(BaseTestCase):
    @patch.object(UserService, "get_user_by_id")
    @patch.object(UserService, "is_user_an_admin")
    @patch.object(OrganisationService, "get_organisations_managed_by_user_as_dto")
    def test_create_draft_project_raises_error_if_user_not_admin_or_org_manager(
        self, mock_user_orgs, mock_admin_test, mock_user_get
    ):
        # Arrange
        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        draft_project_dto.user_id = 77777
        mock_admin_test.return_value = False
        org_dto = ListOrganisationsDTO()
        org_dto.organisations = []
        mock_user_orgs.return_value = org_dto
        mock_user_get.return_value = return_canned_user()

        # Act/Assert
        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService.create_draft_project(draft_project_dto)

    @patch.object(UserService, "is_user_an_admin")
    @patch.object(OrganisationService, "get_organisations_managed_by_user_as_dto")
    def test_create_draft_project_creates_project_if_user_is_admin(
        self, mock_user_orgs, mock_admin_test
    ):
        # Arrange
        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        draft_project_dto.user_id = 777777
        mock_admin_test.return_value = True
        org_dto = ListOrganisationsDTO()
        org_dto.organisations = []
        mock_user_orgs.return_value = org_dto
        create_canned_user()  # Create user with id "777777"
        create_canned_organisation()  # Create org with id "23" which is specified on draft project dto

        # Act/Assert
        ProjectAdminService.create_draft_project(draft_project_dto)

    @patch.object(UserService, "is_user_an_admin")
    @patch.object(OrganisationService, "get_organisations_managed_by_user_as_dto")
    def test_create_draft_project_creates_project_if_user_is_org_manager(
        self, mock_user_orgs, mock_admin_test
    ):
        # Arrange
        create_canned_user()  # Create user with id "777777"
        create_canned_organisation()  # Create org with id "23" which is specified on draft project dto
        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        draft_project_dto.user_id = 777777
        mock_admin_test.return_value = False
        org_dto = ListOrganisationsDTO()
        org_dto.organisations = [23]
        mock_user_orgs.return_value = org_dto

        # Act/Assert
        ProjectAdminService.create_draft_project(draft_project_dto)

    @patch.object(Project, "clone")
    @patch.object(UserService, "get_user_by_id")
    @patch.object(UserService, "is_user_an_admin")
    def test_create_draft_project_calls_project_clone_if_clone_from_project_id_found(
        self, mock_admin_test, mock_user_get, mock_project_clone
    ):
        # Arrange
        create_canned_user()  # Create user with id "777777"
        create_canned_organisation()  # Create org with id "23" which is specified on draft project dto
        test_project = create_canned_project()[
            0
        ]  # Create test project which so that we have a project to clone

        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        draft_project_dto.user_id = 777777
        draft_project_dto.cloneFromProjectId = test_project.id
        mock_admin_test.return_value = True
        # Act
        ProjectAdminService.create_draft_project(draft_project_dto)
        # Assert
        mock_project_clone.assert_called_with(
            draft_project_dto.cloneFromProjectId, draft_project_dto.user_id
        )

    @patch.object(UserService, "get_user_by_id")
    @patch.object(UserService, "is_user_an_admin")
    def test_create_draft_project_raises_error_if_org_not_found(
        self, mock_admin_test, mock_user_get
    ):
        # Arrange
        mock_user_get.return_value = return_canned_user()
        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        draft_project_dto.user_id = 777777
        mock_admin_test.return_value = True
        # Act/Assert
        with self.assertRaises(NotFound):
            ProjectAdminService.create_draft_project(draft_project_dto)

    def test_cant_add_tasks_if_geojson_not_feature_collection(self):
        # Arrange
        invalid_feature = (
            '{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],'
            '[-4.0237, 56.0904]]]], "type": "MultiPolygon"}'
        )

        # Act
        with self.assertRaises(InvalidGeoJson):
            ProjectAdminService._attach_tasks_to_project(MagicMock(), invalid_feature)

    def test_valid_geo_json_attaches_task_to_project(self):
        # Arrange
        valid_feature_collection = json.loads(
            '{"features": [{"geometry": {"coordinates": [[[[-4.0237, 56.0904],'
            '[-3.9111, 56.1715], [-3.8122, 56.098], [-4.0237, 56.0904]]]], "type":'
            '"MultiPolygon"}, "properties": {"x": 2402, "y": 1736, "zoom": 12, "isSquare": true}, "type":'
            '"Feature"}], "type": "FeatureCollection"}'
        )

        test_project = Project()

        # Act
        ProjectAdminService._attach_tasks_to_project(
            test_project, valid_feature_collection
        )

        # Assert
        self.assertEqual(
            1,
            test_project.tasks.count(),
            "One task should have been attached to project",
        )

    @patch.object(UserService, "is_user_the_project_author")
    @patch.object(UserService, "is_user_an_admin")
    def test_is_user_action_permitted_on_project_returns_true_for_admin(
        self, mock_is_user_admin, mock_is_user_author
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        mock_is_user_admin.return_value = True
        mock_is_user_author.return_value = False
        # Act
        permitted = ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project.id
        )
        # Assert
        self.assertTrue(permitted)

    def test_is_user_action_permitted_on_project_returns_true_for_author(self):
        # Arrange
        test_project, test_user = create_canned_project()
        # Act
        permitted = ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project.id
        )
        # Assert
        self.assertTrue(permitted)

    @patch.object(UserService, "is_user_the_project_author")
    @patch.object(UserService, "is_user_an_admin")
    def test_is_user_action_permitted_on_project_returns_true_for_org_manager(
        self, mock_is_user_admin, mock_is_user_author
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        test_org = create_canned_organisation()
        test_project.organisation_id = test_org.id
        test_org.managers = [test_user]
        mock_is_user_admin.return_value = False
        mock_is_user_author.return_value = False
        # Act
        permitted = ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project.id
        )
        # Assert
        self.assertTrue(permitted)

    @patch.object(TeamService, "check_team_membership")
    @patch.object(OrganisationService, "is_user_an_org_manager")
    @patch.object(UserService, "is_user_the_project_author")
    @patch.object(UserService, "is_user_an_admin")
    def test_is_user_action_permitted_on_project_returns_true_for_project_team_manager(
        self,
        mock_is_user_admin,
        mock_is_user_author,
        mock_is_user_org_manager,
        mock_check_team_membership,
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        test_org = create_canned_organisation()
        test_project.organisation_id = test_org.id
        mock_is_user_admin.return_value = False
        mock_is_user_author.return_value = False
        mock_is_user_org_manager.return_value = False
        mock_check_team_membership.return_value = True
        # Act
        permitted = ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project.id
        )
        # Assert
        self.assertTrue(permitted)

    @patch.object(TeamService, "check_team_membership")
    @patch.object(OrganisationService, "is_user_an_org_manager")
    @patch.object(UserService, "is_user_the_project_author")
    @patch.object(UserService, "is_user_an_admin")
    def test_is_user_action_permitted_on_project_returns_false_for_user_without_permission(
        self,
        mock_is_user_admin,
        mock_is_user_author,
        mock_is_user_org_manager,
        mock_check_team_membership,
    ):
        # Arrange
        test_project, test_user = create_canned_project()
        test_org = create_canned_organisation()
        test_project.organisation_id = test_org.id
        mock_is_user_admin.return_value = False
        mock_is_user_author.return_value = False
        mock_is_user_org_manager.return_value = False
        mock_check_team_membership.return_value = False
        # Act
        permitted = ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project.id
        )
        # Assert
        self.assertFalse(permitted)

    @patch.object(User, "get_by_id")
    @patch.object(Project, "get")
    def test_update_published_project_with_incomplete_default_locale_raises_error(
        self, mock_project, mock_user
    ):
        # Arrange
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value

        mock_project.return_value = stub_project

        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        locales.append(info)

        dto = ProjectDTO()
        dto.project_id = 1
        dto.default_locale = "en"
        dto.project_info_locales = locales
        dto.project_status = ProjectStatus.PUBLISHED.name

        stub_admin_user = User()
        stub_admin_user.username = "admin"
        stub_admin_user.role = UserRole.ADMIN.value

        mock_user.return_value = stub_admin_user
        # Act / Assert
        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService.update_project(dto, mock_user.id)

    @patch.object(User, "get_by_id")
    @patch.object(Project, "update")
    @patch.object(Project, "get")
    def test_updating_a_private_project_with_no_allowed_users_raises_error(
        self, mock_project, mock_project2, mock_user
    ):
        # Arrange
        mock_project.return_value = Project()

        dto = ProjectDTO()
        dto.private = True
        dto.allowed_usernames = []

        stub_user = User()
        stub_user.username = "admin"
        stub_user.role = UserRole.ADMIN.value

        mock_user.return_value = stub_user

        # Act
        try:
            ProjectAdminService.update_project(dto, mock_user.id)
        # Assert
        except ProjectAdminServiceError:
            self.fail("update_project raised an exception when setting it as private")

    @patch.object(User, "get_by_id")
    @patch.object(Project, "get")
    def test_update_project_with_non_existant_license_raises_error(
        self, mock_project, mock_user
    ):
        # Arrange
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value

        mock_project.return_value = stub_project

        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        info.description = "Test description"
        info.short_description = "Test short description"
        info.instructions = "Test instructions"
        locales.append(info)

        dto = ProjectDTO()
        dto.project_id = 1
        dto.default_locale = "en"
        dto.license_id = 1
        dto.project_info_locales = locales
        dto.project_status = ProjectStatus.PUBLISHED.name

        stub_admin_user = User()
        stub_admin_user.username = "admin"
        stub_admin_user.role = UserRole.ADMIN.value

        mock_user.return_value = stub_admin_user
        # Act / Assert
        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService.update_project(dto, mock_user.id)

    @patch.object(User, "get_by_id")
    @patch.object(Project, "update")
    @patch.object(Project, "get")
    def test_updating_a_project_with_different_roles_raises_error(
        self, mock_project, mock_project2, mock_user
    ):
        # Arrange
        stub_project = Project()
        stub_project.status = ProjectStatus.DRAFT.value

        mock_project.return_value = stub_project

        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        locales.append(info)

        dto = ProjectDTO()
        dto.project_id = 1
        dto.default_locale = "en"
        dto.project_status = ProjectStatus.DRAFT.name
        dto.project_priority = ProjectPriority.LOW.name
        dto.difficulty = ProjectDifficulty.EASY.name
        dto.mapping_types = ["ROADS"]
        dto.mapping_editors = ["ID"]
        dto.validation_editors = ["ID"]
        dto.project_info_locales = locales

        stub_user = User()
        stub_user.username = "mapper"
        stub_user.role = UserRole.MAPPER.value
        mock_user.return_value = stub_user
        # Act/Assert
        with self.assertRaises(ValueError):
            ProjectAdminService.update_project(dto, mock_user.id)

    def test_updating_a_project_with_valid_project_info(self):
        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        info.description = "Test description"
        info.short_description = "Test short description"
        info.instructions = "Test instructions"
        locales.append(info)

        test_project, test_user = create_canned_project()

        dto = ProjectDTO()
        dto.project_id = test_project.id
        dto.default_locale = "en"
        dto.project_status = ProjectStatus.PUBLISHED.name
        dto.project_priority = ProjectPriority.LOW.name
        dto.difficulty = ProjectDifficulty.EASY.name
        dto.mapping_types = ["ROADS"]
        dto.mapping_editors = ["ID"]
        dto.validation_editors = ["ID"]
        dto.project_info_locales = locales
        # Act
        updated_project = ProjectAdminService.update_project(dto, test_user.id)
        # Assert
        self.assertEqual(
            updated_project.difficulty, ProjectDifficulty[dto.difficulty.upper()].value
        )
        self.assertEqual(
            updated_project.status, ProjectStatus[dto.project_status].value
        )
        self.assertEqual(
            updated_project.priority, ProjectPriority[dto.project_priority].value
        )

    @patch.object(MessageService, "send_project_transfer_message")
    def test_project_transfer_to_(self, mock_send_message):
        test_project, test_author = create_canned_project()
        test_organisation = create_canned_organisation()
        test_user = return_canned_user("TEST_USER", 11111)
        test_user.create()
        test_manager = return_canned_user("TEST_MANAGER", 22222)
        test_manager.create()
        test_project.organisation = test_organisation
        test_project.organisation_id = test_organisation.id
        add_manager_to_organisation(test_organisation, test_manager)

        # Test error is raised if initiating user is not permitted to transfer project
        current_app.logger.debug(
            "Testing error is raised if initiating user is not permitted to transfer project"
        )
        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService.transfer_project_to(
                test_project.id, test_user.id, test_manager.username
            )

        # Test error is raised if transferred to user who is not a manager of the organisation
        current_app.logger.debug(
            "Testing error is raised if transferred to user who is not a manager of the organisation"
        )
        with self.assertRaises(ValueError):
            ProjectAdminService.transfer_project_to(
                test_project.id, test_manager.id, test_user.username
            )

        # Test project author can transfer project
        current_app.logger.debug("Testing project author can transfer project")
        ProjectAdminService.transfer_project_to(
            test_project.id, test_author.id, test_manager.username
        )
        mock_send_message.assert_called_with(
            test_project.id, test_manager.username, test_author.username
        )

        # Test admin can transfer project
        current_app.logger.debug("Testing admin can transfer project")
        test_user.role = UserRole.ADMIN.value
        test_project.author = test_author
        ProjectAdminService.transfer_project_to(
            test_project.id, test_user.id, test_manager.username
        )
        mock_send_message.assert_called_with(
            test_project.id, test_manager.username, test_user.username
        )

        # Test org manager can transfer project
        current_app.logger.debug("Testing org manager can transfer project")
        test_project.author = test_author
        ProjectAdminService.transfer_project_to(
            test_project.id, test_manager.id, test_manager.username
        )
        mock_send_message.assert_called_with(
            test_project.id, test_manager.username, test_manager.username
        )
