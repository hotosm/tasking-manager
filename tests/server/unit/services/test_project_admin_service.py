import json
import unittest
from unittest.mock import MagicMock, patch
from server.services.project_admin_service import (
    ProjectAdminService,
    InvalidGeoJson,
    Project,
    ProjectAdminServiceError,
    ProjectDTO,
    ProjectStatus,
    NotFound,
    LicenseService,
)

from server.models.postgis.statuses import ProjectPriority, MappingLevel
from server.models.dtos.project_dto import ProjectInfoDTO
from server.models.postgis.task import Task
from server.models.postgis.user import User, UserRole
from server import create_app


class TestProjectAdminService(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

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

    @patch.object(Project, "get")
    def test_get_raises_error_if_not_found(self, mock_project):
        # Arrange
        mock_project.return_value = None

        # Act / Assert
        with self.assertRaises(NotFound):
            ProjectAdminService._get_project_by_id(12)

    @patch.object(User, "get_by_id")
    @patch.object(Project, "get")
    def test_published_project_with_incomplete_default_locale_raises_error(
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
    @patch.object(Project, "get")
    def test_updating_a_private_project_with_no_allowed_users_causes_an_error(
        self, mock_project, mock_user
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

        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService.update_project(dto, mock_user.id)

    @patch.object(User, "get_by_id")
    @patch.object(Project, "update")
    @patch.object(Project, "get")
    def test_updating_a_project_with_different_roles(
        self, mock_project, mock_project2, mock_user
    ):
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
        dto.mapper_level = MappingLevel.BEGINNER.name
        dto.mapping_types = ["ROADS"]
        dto.mapping_editors = ["ID"]
        dto.validation_editors = ["ID"]
        dto.project_info_locales = locales

        stub_user = User()
        stub_user.username = "mapper"
        stub_user.role = UserRole.MAPPER.value

        mock_user.return_value = stub_user

        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService.update_project(dto, mock_user.id)

        stub_user.username = "pm"
        stub_user.role = UserRole.PROJECT_MANAGER.value
        mock_user.return_value = stub_user

        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService.update_project(dto, mock_user.id)

        stub_project.author_id = mock_user.id

        stub_user.username = "admin"
        stub_user.role = UserRole.ADMIN.value
        mock_user.return_value = stub_user

        try:
            ProjectAdminService.update_project(dto, mock_user.id)
        except ProjectAdminServiceError:
            self.fail("update_project raised an exception with admin role")

        stub_user.username = "pm"
        stub_user.role = UserRole.PROJECT_MANAGER.value
        mock_user.return_value = stub_user

        try:
            ProjectAdminService.update_project(dto, mock_user.id)
        except ProjectAdminServiceError:
            self.fail("update_project raised an exception with pm role")

    def test_no_project_info_for_default_locale_raises_error(self):
        # Arrange
        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        locales.append(info)

        # Act / Assert
        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService._validate_default_locale("it", locales)

    def test_complete_default_locale_raises_is_valid(self):
        # Arrange
        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        info.description = "Test Desc"
        info.short_description = "Short Desc"
        info.instructions = "Instruct"
        locales.append(info)

        # Act
        is_valid = ProjectAdminService._validate_default_locale("en", locales)

        # Assert
        self.assertTrue(is_valid, "Complete default locale should be valid")

    @patch.object(LicenseService, "get_license_as_dto")
    def test_attempting_to_attach_non_existant_license_raise_error(self, license_mock):
        # Arrange
        license_mock.side_effect = NotFound()

        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService._validate_imagery_licence(1)

    @patch.object(ProjectAdminService, "_get_project_by_id")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    @patch.object(Task, "set_task_history")
    def test_reset_all_tasks(self, mock_set_task_history, mock_query, mock_get_project):
        user_id = 123
        test_project = MagicMock(spec=Project)
        test_project.id = 456
        test_project.tasks_mapped = 2
        test_project.tasks_validated = 2
        test_tasks = [MagicMock(spec=Task), MagicMock(spec=Task), MagicMock(spec=Task)]

        mock_query.return_value.filter.return_value.all.return_value = test_tasks
        mock_get_project.return_value = test_project

        ProjectAdminService.reset_all_tasks(test_project.id, user_id)

        for test_task in test_tasks:
            test_task.set_task_history.assert_called()
            test_task.reset_task.assert_called_with(user_id)

        mock_get_project.assert_called_with(test_project.id)
        self.assertEqual(test_project.tasks_mapped, 0)
        self.assertEqual(test_project.tasks_validated, 0)
        test_project.save.assert_called()
