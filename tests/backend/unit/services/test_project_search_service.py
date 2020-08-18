from backend.models.dtos.project_dto import ProjectSearchDTO
from backend.models.postgis.user import User
from backend.services.project_search_service import ProjectSearchService
from tests.backend.base import BaseTestCase


class TestProjectService(BaseTestCase):
    def test_project_search(self):

        user = User(id=3488526)
        search_dto = ProjectSearchDTO()
        search_dto.preferred_locale = None
        search_dto.mapper_level = "BEGINNER"
        search_dto.mapping_types = None
        search_dto.project_statuses = ["PUBLISHED"]
        search_dto.organisation_name = None
        search_dto.organisation_id = 34
        search_dto.team_id = 1
        search_dto.campaign = "DengueFeverHonduras"
        search_dto.order_by = "priority"
        search_dto.order_by_type = "DESC"
        search_dto.country = "Honduras"
        search_dto.page = 1
        search_dto.text_search = "6158"
        search_dto.mapping_editors = ["ID"]
        search_dto.validation_editors = ["ID"]
        search_dto.teams = None
        search_dto.interests = None
        search_dto.created_by = 378610
        search_dto.mapped_by = None
        search_dto.favorited_by = None
        search_dto.managed_by = None
        search_dto.omit_map_results = False

        search_dto.validate()

        self.assertIsNotNone(ProjectSearchService.search_projects(search_dto, user))
