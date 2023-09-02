import json
from unittest.mock import MagicMock, patch
from backend.services.project_admin_service import (
    ProjectAdminService,
    InvalidGeoJson,
    Project,
    ProjectAdminServiceError,
    NotFound,
    LicenseService,
)
from backend.models.dtos.project_dto import ProjectInfoDTO
from backend.models.postgis.task import Task
from tests.backend.base import BaseTestCase


class TestProjectAdminService(BaseTestCase):
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

    def test_complete_default_locale_raises_error_if_incomplete(self):
        # Arrange
        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        info.description = "Test Desc"
        info.short_description = "Short Desc"
        locales.append(info)

        # Act
        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService._validate_default_locale("en", locales)

    def test_complete_default_locale_raises_error_if_default_locale_not_found(self):
        # Arrange
        locales = []
        info = ProjectInfoDTO()
        info.locale = "en"
        info.name = "Test"
        info.description = "Test Desc"
        info.short_description = "Short Desc"
        locales.append(info)

        # Act
        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService._validate_default_locale("it", locales)

    @patch.object(LicenseService, "get_license_as_dto")
    def test_attempting_to_attach_non_existant_license_raise_error(self, license_mock):
        # Arrange
        license_mock.side_effect = NotFound()

        with self.assertRaises(ProjectAdminServiceError):
            ProjectAdminService._validate_imagery_licence(1)

    @patch.object(ProjectAdminService, "_get_project_by_id")
    @patch("flask_sqlalchemy.model._QueryProperty.__get__")
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
