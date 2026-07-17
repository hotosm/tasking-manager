import json
import pytest
from backend.services.project_search_service import ProjectSearchService
from backend.services.users.user_service import UserService
from backend.models.postgis.project import ProjectInfo, Project
from backend.models.dtos.project_dto import ProjectSearchBBoxDTO
from backend.models.postgis.user import User
from tests.backend.helpers.test_helpers import get_canned_json
from unittest.mock import patch, MagicMock, AsyncMock
from shapely.geometry import Polygon, box
import shapely.wkt
from datetime import datetime
from types import SimpleNamespace

from backend.models.dtos.project_dto import ProjectSearchDTO
from backend.models.postgis.statuses import (
    ProjectDifficulty,
    ProjectPriority,
    ProjectStatus,
    UserRole,
)

class RecordingSearchDB:
    """DB falso para probar filtros sin depender de datos complejos."""

    def __init__(self):
        self.fetch_all_calls = []
        self.fetch_val_calls = []
        self.fetch_one_calls = []

    async def fetch_all(self, query=None, values=None, **kwargs):
        query = query or kwargs.get("query")
        values = values or kwargs.get("values")
        self.fetch_all_calls.append((query, values))

        if "FROM user_interests" in query:
            return [{"interest_id": 1}]

        if "FROM project_favorites" in query:
            return [{"project_id": 10}]

        if "JOIN partners" in query:
            return [{"name": "Coverage Partner"}]

        return []

    async def fetch_val(self, query=None, values=None, **kwargs):
        query = query or kwargs.get("query")
        values = values or kwargs.get("values")
        self.fetch_val_calls.append((query, values))
        return 0

    async def fetch_one(self, query=None, values=None, **kwargs):
        query = query or kwargs.get("query")
        values = values or kwargs.get("values")
        self.fetch_one_calls.append((query, values))
        return {"name": "Coverage CSV Project"}

    def joined_queries(self):
        queries = [call[0] for call in self.fetch_all_calls]
        queries += [call[0] for call in self.fetch_val_calls]
        queries += [call[0] for call in self.fetch_one_calls]
        return "\n".join(query for query in queries if query)

@pytest.mark.anyio
class TestProjectSearchService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

    @patch.object(ProjectSearchService, "_make_4326_polygon_from_bbox")
    @patch.object(ProjectSearchService, "validate_bbox_area")
    @patch.object(UserService, "get_user_by_username", new_callable=AsyncMock)
    @patch.object(
        ProjectSearchService, "_get_intersecting_projects", new_callable=AsyncMock
    )
    @patch.object(ProjectInfo, "get_dto_for_locale", new_callable=AsyncMock)
    async def test_get_intersecting_projects(
        self,
        get_dto_for_locale,
        _get_intersecting_projects,
        get_user_by_username,
        validate_bbox_area,
        _make_4326_polygon_from_bbox,
    ):
        # arrange _make_4326_polygon_from_bbox mock
        _make_4326_polygon_from_bbox.return_value = Polygon(
            [
                (34.68826225820438, -12.59912449955007),
                (34.68826225820438, -11.57858317689196),
                (32.50198296132938, -11.57858317689196),
                (32.50198296132938, -12.59912449955007),
                (34.68826225820438, -12.59912449955007),
            ]
        )
        # arrange validate_bbox_area mock
        validate_bbox_area.return_value = True
        # arrange get_user_by_username mock
        get_user_by_username.return_value = User(id=3488526)
        # arrange _get_intersecting_projects mock
        polygon = json.dumps(get_canned_json("search_bbox_feature.json"))
        project = Project(id=2274, status=0, default_locale="en", geometry=polygon)
        projects = [project]
        _get_intersecting_projects.return_value = projects
        # arrange get_dto_for_locale mock
        get_dto_for_locale.return_value = ProjectInfo(name="PEPFAR Kenya: Homa Bay")
        # arrange dto
        dto = ProjectSearchBBoxDTO(
            bbox=list(map(float, "34.404,-1.034,34.717,-0.624".split(","))),
            preferred_locale="en",
            input_srid=4326,
            project_author=3488526,
        )
        # arrange expected result
        expected = get_canned_json("search_bbox_result.json")
        # act
        result = await ProjectSearchService.get_projects_geojson(dto, db=self.db)

        # assert
        def assert_dict_approx_equal(d1, d2, abs_tol=1e-6):
            if isinstance(d1, dict) and isinstance(d2, dict):
                assert d1.keys() == d2.keys()
                for k in d1:
                    assert_dict_approx_equal(d1[k], d2[k], abs_tol=abs_tol)
            elif isinstance(d1, list) and isinstance(d2, list):
                assert len(d1) == len(d2)
                for a, b in zip(d1, d2):
                    assert_dict_approx_equal(a, b, abs_tol=abs_tol)
            elif isinstance(d1, float) and isinstance(d2, float):
                assert d1 == pytest.approx(d2, abs=abs_tol)
            else:
                assert d1 == d2

        assert_dict_approx_equal(result, expected)

    @patch("geoalchemy2.shape.to_shape")
    @patch("geoalchemy2.shape.from_shape")
    async def test_make_polygon_from_3857_bbox(self, mock_from_shape, mock_to_shape):
        # arrange
        bbox = [
            3618104.193026841,
            -1413969.7644834695,
            3861479.691086842,
            -1297785.4814900015,
        ]
        srid = 3857
        expected = (
            32.50198296132938,
            -12.59912449955007,
            34.68826225820438,
            -11.578583176891955,
        )
        # Mock from_shape to return a mock with wkt
        mock_geometry = MagicMock()
        mock_geometry.wkt = shapely.wkt.dumps(box(bbox[0], bbox[1], bbox[2], bbox[3]))
        mock_from_shape.return_value = mock_geometry
        # Mock the db.fetch_one
        with patch.object(self.db, "fetch_one") as mock_fetch_one:
            mock_geom = MagicMock()
            mock_to_shape.return_value = Polygon(
                [
                    (expected[0], expected[1]),
                    (expected[0], expected[3]),
                    (expected[2], expected[3]),
                    (expected[2], expected[1]),
                    (expected[0], expected[1]),
                ]
            )
            mock_fetch_one.return_value = {"geom_4326": mock_geom}
            # act
            polygon = await ProjectSearchService._make_4326_polygon_from_bbox(
                bbox,
                srid,
                db=self.db,
            )
            # assert
            for expected_val, actual_val in zip(expected, polygon.bounds):
                assert actual_val == pytest.approx(expected_val, abs=1e-10)

    async def test_get_area_from_3857_bbox(self):
        # polygon = await ProjectSearchService._make_4326_polygon_from_bbox(
        #     [3618104.193026841, -1413969.7644834695, 3861479.691086842, -1297785.4814900015], 3857, db=self.db)
        polygon = Polygon(
            [
                (34.68826225820438, -12.59912449955007),
                (34.68826225820438, -11.57858317689196),
                (32.50198296132938, -11.57858317689196),
                (32.50198296132938, -12.59912449955007),
                (34.68826225820438, -12.59912449955007),
            ]
        )
        # act
        area = await ProjectSearchService._get_area_sqm(polygon, db=self.db)
        # assert
        assert area == pytest.approx(28276407740.2797, abs=1e-3)
    
    @patch.object(Project, "get_project_total_contributions", new_callable=AsyncMock)
    @patch.object(UserService, "get_user_by_id", new_callable=AsyncMock)
    @patch.object(ProjectSearchService, "_filter_projects", new_callable=AsyncMock)
    async def test_search_projects_as_csv_returns_admin_csv_with_partner_names(
        self,
        mock_filter_projects,
        mock_get_user_by_id,
        mock_get_total_contributions,
    ):
        # Cubre la conversión de resultados a CSV y el agregado de partners para admin.
        fake_db = RecordingSearchDB()
        admin_user = SimpleNamespace(id=1, role=UserRole.ADMIN.value)

        mock_get_user_by_id.return_value = admin_user
        mock_get_total_contributions.return_value = 7
        mock_filter_projects.return_value = [
            {
                "id": 99,
                "priority": ProjectPriority.HIGH.value,
                "difficulty": ProjectDifficulty.EASY.value,
                "default_locale": "en",
                "status": ProjectStatus.PUBLISHED.value,
                "sandbox": False,
                "database": "osm",
                "last_updated": datetime(2026, 7, 9, 10, 0, 0),
                "due_date": None,
                "total_tasks": 10,
                "tasks_mapped": 5,
                "tasks_validated": 2,
                "tasks_bad_imagery": 0,
                "author_name": "Project Author",
                "author_username": "project_author",
                "organisation_name": "Coverage Org",
                "percent_mapped": 70,
                "percent_validated": 20,
                "total_area": 123.4567,
                "country": ["Peru"],
                "creation_date": datetime(2026, 7, 1, 10, 0, 0),
            }
        ]

        search_dto = ProjectSearchDTO(
            preferred_locale="es",
            page=1,
            download_as_csv=True,
        )

        csv_result = await ProjectSearchService.search_projects_as_csv(
            search_dto,
            user=admin_user.id,
            db=fake_db,
            as_csv=True,
        )

        assert "projectId" in csv_result
        assert "name" in csv_result
        assert "partnerNames" in csv_result
        assert "Coverage CSV Project" in csv_result
        assert "Coverage Partner" in csv_result
        assert "HIGH" in csv_result
        assert "EASY" in csv_result
        assert "PUBLISHED" in csv_result

    @patch.object(UserService, "get_projects_mapped", new_callable=AsyncMock)
    @patch.object(ProjectSearchService, "filter_projects_to_map", new_callable=AsyncMock)
    async def test_filter_projects_applies_multiple_search_filters(
        self,
        mock_filter_projects_to_map,
        mock_get_projects_mapped,
    ):
        # Activa muchas ramas del filtrado avanzado en una sola prueba.
        fake_db = RecordingSearchDB()
        admin_user = SimpleNamespace(id=1, role=UserRole.ADMIN.value)

        mock_get_projects_mapped.return_value = [10, 11]
        mock_filter_projects_to_map.return_value = [10]

        search_dto = ProjectSearchDTO(
            preferred_locale="en",
            text_search="coverage project",
            project_statuses=["PUBLISHED", "DRAFT"],
            based_on_user_interests=1,
            created_by=1,
            mapped_by=1,
            favorited_by=1,
            difficulty="EASY",
            action="map",
            imagery="custom",
            organisation_name="Coverage Org",
            organisation_id=1,
            team_id=1,
            campaign="Coverage Campaign",
            mapping_types=["ROADS"],
            mapping_types_exact=True,
            country="Peru",
            last_updated_gte="2026-01-01",
            last_updated_lte="2026-12-31",
            created_gte="2026-01-01",
            created_lte="2026-12-31",
            sandbox=True,
            database="osm",
            partner_id=1,
            partnership_from="2026-01-01",
            partnership_to="2026-12-31",
            order_by="percent_mapped",
            order_by_type="DESC",
            page=1,
            omit_map_results=True,
        )

        result = await ProjectSearchService._filter_projects(
            search_dto,
            admin_user,
            fake_db,
        )

        queries = fake_db.joined_queries()

        assert result[2].total == 0
        assert "text_searchable" in queries
        assert "project_interests" in queries
        assert "p.author_id = :created_by" in queries
        assert "p.id = ANY(:mapped_projects)" in queries
        assert "p.id  = ANY(:favorited_projects)" in queries
        assert "p.difficulty = :difficulty" in queries
        assert "p.imagery LIKE :imagery" in queries
        assert "o.name = :organisation_name" in queries
        assert "o.id = :organisation_id" in queries
        assert "project_teams" in queries
        assert "campaign_projects" in queries
        assert "p.mapping_types @>" in queries
        assert "LOWER(:country)" in queries
        assert "p.last_updated >=" in queries
        assert "p.created >=" in queries
        assert "p.sandbox = :sandbox" in queries
        assert "p.database = :database" in queries
        assert "project_partnerships" in queries
        assert "percent_mapped" in queries or "tasks_mapped" in queries

    @patch.object(
        ProjectSearchService,
        "filter_projects_to_validate",
        new_callable=AsyncMock,
    )
    async def test_filter_projects_applies_validate_action_and_percent_validated_order(
        self,
        mock_filter_projects_to_validate,
    ):
        # Cubre la rama alternativa de validación y orden por porcentaje validado.
        fake_db = RecordingSearchDB()
        admin_user = SimpleNamespace(id=1, role=UserRole.ADMIN.value)

        mock_filter_projects_to_validate.return_value = [20, 21]

        search_dto = ProjectSearchDTO(
            preferred_locale="en",
            project_statuses=["PUBLISHED"],
            action="validate",
            order_by="percent_validated",
            order_by_type="ASC",
            page=1,
            omit_map_results=False,
        )

        result = await ProjectSearchService._filter_projects(
            search_dto,
            admin_user,
            fake_db,
            as_csv=True,
        )

        queries = fake_db.joined_queries()

        assert result == []
        assert "p.id = ANY(:validation_project_ids)" in queries
        assert "tasks_validated" in queries
        assert "ORDER BY" in queries
