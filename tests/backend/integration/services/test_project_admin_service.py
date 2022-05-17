from unittest.mock import patch, MagicMock
import json
from backend.models.postgis.project import Project
from backend.models.postgis.utils import NotFound

from tests.backend.base import BaseTestCase
from backend.models.dtos.organisation_dto import ListOrganisationsDTO
from backend.services.project_admin_service import (
    ProjectAdminService,
    ProjectAdminServiceError,
    InvalidGeoJson,
)
from backend.models.dtos.project_dto import DraftProjectDTO
from backend.services.organisation_service import OrganisationService
from backend.services.users.user_service import UserService
from tests.backend.helpers.test_helpers import (
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

    @patch.object(OrganisationService, "get_organisation_by_id")
    @patch.object(UserService, "get_user_by_id")
    @patch.object(UserService, "is_user_an_admin")
    def test_create_draft_project_raises_error_if_org_not_found(
        self, mock_admin_test, mock_user_get, mock_org_get
    ):
        # Arrange
        mock_user_get.return_value = return_canned_user()
        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        draft_project_dto.user_id = 777777
        mock_admin_test.return_value = True
        mock_org_get.return_value = None
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
