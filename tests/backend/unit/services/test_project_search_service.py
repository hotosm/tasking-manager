from backend.models.dtos.project_dto import ProjectSearchDTO
from backend.models.postgis.statuses import MappingLevel, ProjectStatus
from backend.services.project_search_service import ProjectSearchService
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project


class TestProjectService(BaseTestCase):
    def test_project_search(self):
        # Arrange
        test_project, test_user = create_canned_project()
        test_project.mapper_level = MappingLevel.BEGINNER.value
        test_project.status = ProjectStatus.PUBLISHED.value

        search_dto = ProjectSearchDTO()
        search_dto.preferred_locale = None
        search_dto.mapper_level = "BEGINNER"
        search_dto.mapping_types = None
        search_dto.project_statuses = ["PUBLISHED"]
        search_dto.organisation_name = None
        search_dto.order_by = "priority"
        search_dto.order_by_type = "DESC"
        search_dto.page = 1
        search_dto.text_search = test_project.id
        search_dto.mapping_editors = ["ID"]
        search_dto.validation_editors = ["ID"]
        search_dto.teams = None
        search_dto.interests = None
        search_dto.created_by = test_user.id
        search_dto.mapped_by = None
        search_dto.favorited_by = None
        search_dto.managed_by = None
        search_dto.omit_map_results = False

        search_dto.validate()
        # Act/Assert
        self.assertIsNotNone(
            ProjectSearchService.search_projects(search_dto, test_user)
        )
