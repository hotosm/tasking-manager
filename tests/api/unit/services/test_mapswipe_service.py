import pytest
import json
from backend.services.mapswipe_service import MapswipeService
from backend.exceptions import Conflict

@pytest.mark.anyio
class TestMapswipeService:
    @pytest.fixture(autouse=True)
    def setup_service(self, request):
        request.cls.service = MapswipeService()

    def test_get_origin_parses_url_correctly(self):
        """Valida que se extraiga correctamente el origen de la URL de configuración."""
        origin = self.service._get_origin()
        assert origin.startswith("http")
        assert "mapswipe.org" in origin

    def test_setup_group_dto_parses_valid_json(self):
        """Valida la transformación de JSON crudo a GroupedPartnerStatsDTO."""
        mock_resp = {
            "data": {
                "contributorUserGroup": {
                    "name": "Test Group",
                    "description": "Desc",
                    "userMemberships": {
                        "totalCount": 1,
                        "results": [{
                            "id": "mem1", "isActive": True, "totalSwipes": 10,
                            "totalSwipeTime": 100, "totalMappingProjects": 1,
                            "user": {"firebaseId": "fb1", "username": "user1"}
                        }]
                    }
                },
                "communityUserGroupStats": {
                    "stats": {"totalContributors": 5, "totalSwipes": 50, "totalSwipeTime": 500},
                    "statsLatest": {"totalContributors": 1, "totalSwipes": 10, "totalSwipeTime": 100}
                }
            }
        }
        
        dto = self.service.setup_group_dto("p1", "grp1", json.dumps(mock_resp))
        
        assert dto.name_inside_provider == "Test Group"
        assert dto.total_contributions == 50
        assert len(dto.members) == 1
        assert dto.members[0].username == "user1"

    def test_setup_group_dto_raises_conflict_on_invalid_group_id(self):
        """Valida que se lance una excepción si MapSwipe no encuentra el grupo."""
        mock_error_resp = {"data": {"contributorUserGroup": None}}
        
        with pytest.raises(Conflict, match="INVALID_MAPSWIPE_GROUP_ID"):
            self.service.setup_group_dto("p1", "bad_grp", json.dumps(mock_error_resp))

    def test_setup_filtered_dto_parses_metrics_correctly(self):
        """Valida la transformación de estadísticas filtradas por fecha."""
        mock_resp = {
            "data": {
                "communityUserGroupStats": {
                    "filteredStats": {
                        "areaSwipedByProjectType": [{"projectType": "1", "projectTypeDisplay": "Build", "totalArea": 10.5}],
                        "swipeByDate": [{"taskDate": "2024-01-01", "totalSwipes": 5}],
                        "swipeByProjectGeo": [{"totalContribution": 1, "geojson": {"type": "Point", "coordinates": [0,0]}}],
                        "swipeByProjectType": [], "swipeByOrganizationName": [], "swipeTimeByDate": []
                    }
                }
            }
        }
        
        dto = self.service.setup_filtered_dto("p1", "grp1", "2024-01-01", "2024-01-02", json.dumps(mock_resp))
        
        assert len(dto.area_swiped_by_project_type) == 1
        assert dto.area_swiped_by_project_type[0].total_area == 10.5
        assert dto.contributions_by_date[0].total_contributions == 5

    def test_setup_filtered_dto_raises_conflict_if_no_data(self):
        """Valida error cuando la respuesta de estadísticas filtradas es nula."""
        mock_null_resp = {"data": {"communityUserGroupStats": None}}
        
        with pytest.raises(Conflict, match="INVALID_MAPSWIPE_GROUP_ID"):
            self.service.setup_filtered_dto("p1", "grp1", "2024-01-01", "2024-01-02", json.dumps(mock_null_resp))
