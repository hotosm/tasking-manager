from backend.models.postgis.statuses import TaskStatus
import pytest
import json
from unittest.mock import AsyncMock

from backend.models.dtos.project_dto import ProjectInfoDTO
from backend.models.postgis.task import Task
from backend.services.project_admin_service import (
    InvalidGeoJson,
    NotFound,
    Project,
    ProjectAdminService,
    ProjectAdminServiceError,
)
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestProjectAdminService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """
        Fixture to initialize database connection and set up test data.
        Ensures DB connection is available before running tests.
        """
        assert db_connection_fixture is not None, "Database connection is not available"

        request.cls.db = db_connection_fixture

    async def test_cant_add_tasks_if_geojson_not_feature_collection(self):
        # Arrange
        invalid_feature = json.dumps(
            {
                "coordinates": [
                    [
                        [
                            [-4.0237, 56.0904],
                            [-3.9111, 56.1715],
                            [-3.8122, 56.098],
                            [-4.0237, 56.0904],
                        ]
                    ]
                ],
                "type": "MultiPolygon",
            }
        )

        # Act / Assert
        with pytest.raises(InvalidGeoJson):
            await ProjectAdminService._attach_tasks_to_project(
                AsyncMock(), invalid_feature, self.db
            )

    async def test_valid_geo_json_attaches_task_to_project(self):
        # Arrange
        valid_feature_collection = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [-4.0237, 56.0904],
                                    [-3.9111, 56.1715],
                                    [-3.8122, 56.098],
                                    [-4.0237, 56.0904],
                                ]
                            ]
                        ],
                    },
                    "properties": {"x": 2402, "y": 1736, "zoom": 12, "isSquare": True},
                }
            ],
        }

        test_project = Project()

        # Act
        await ProjectAdminService._attach_tasks_to_project(
            test_project, valid_feature_collection, self.db
        )
        # Assert
        assert (
            test_project.tasks.count() == 1
        ), "One task should have been attached to project"

    async def test_get_raises_error_if_not_found(self):
        # Act / Assert
        with pytest.raises(NotFound):
            await ProjectAdminService._get_project_by_id(12, self.db)

    async def test_complete_default_locale_is_valid(self):
        # Arrange
        locales = [
            ProjectInfoDTO(
                locale="en",
                name="Test",
                description="Test Desc",
                short_description="Short Desc",
                instructions="Instruct",
            )
        ]

        # Act
        is_valid = ProjectAdminService._validate_default_locale("en", locales)

        # Assert
        assert is_valid, "Complete default locale should be valid"

    async def test_complete_default_locale_raises_error_if_incomplete(self):
        # Arrange
        locales = [
            ProjectInfoDTO(
                locale="en",
                name="Test",
                description="Test Desc",
                short_description="Short Desc",
            )
        ]

        # Act / Assert
        with pytest.raises(ProjectAdminServiceError):
            await ProjectAdminService._validate_default_locale("en", locales)

    async def test_complete_default_locale_raises_error_if_default_locale_not_found(
        self,
    ):
        # Arrange
        locales = [
            ProjectInfoDTO(
                locale="en",
                name="Test",
                description="Test Desc",
                short_description="Short Desc",
            )
        ]

        # Act / Assert
        with pytest.raises(ProjectAdminServiceError):
            await ProjectAdminService._validate_default_locale("it", locales)

    async def test_attempting_to_attach_non_existant_license_raises_error(self):
        # Act / Assert
        with pytest.raises(ProjectAdminServiceError):
            await ProjectAdminService._validate_imagery_licence(1, self.db)

    async def test_reset_all_tasks(self):
        test_project, test_user, project_id = await create_canned_project(self.db)
        # Act
        await ProjectAdminService.reset_all_tasks(project_id, test_user.id, self.db)
        # Assert
        for test_task in test_project.tasks:
            task = await Task.get(test_task.id, project_id, self.db)
            task_history = await Task.get_task_history(
                test_task.id, project_id, self.db
            )
            assert task.task_status == TaskStatus.READY.value
            if task_history:
                assert task_history[0].action_text == TaskStatus.READY.name
                assert task_history[1].action_text == "Task reset"
        query = """
            SELECT id, tasks_mapped, tasks_validated
            FROM projects
            WHERE id = :project_id
        """
        values = {"project_id": project_id}
        row = await self.db.fetch_one(query=query, values=values)

        assert row.tasks_mapped == 0
        assert row.tasks_validated == 0
