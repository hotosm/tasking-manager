import pytest
import geojson

from backend.models.dtos.project_dto import DraftProjectDTO
from backend.models.postgis.project import (
    Task,
    ProjectDTO,
    ProjectStatus,
    ProjectPriority,
    Project,
)
from backend.models.postgis.project_info import ProjectInfoDTO

from tests.api.helpers.test_helpers import (
    create_canned_project,
    return_canned_draft_project_json,
    update_project_with_info,
)

from tests.api.helpers.test_helpers import TEST_PROJECT_NAME
import json


@pytest.mark.anyio
class TestProject:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

    async def test_project_can_be_persisted_to_db(self):
        project, user, project_id = await create_canned_project(self.db)
        assert (
            project_id is not None
        ), "ID should be set if project successfully persisted"

    async def test_task_can_generate_valid_feature_collection(self):
        project, user, project_id = await create_canned_project(self.db)

        fc_one = await Task.get_tasks_as_geojson_feature_collection(
            self.db, project_id, "1"
        )
        assert isinstance(fc_one, geojson.FeatureCollection)
        assert len(fc_one.features) == 1

        fc_all = await Task.get_tasks_as_geojson_feature_collection(
            self.db, project_id, None
        )
        assert isinstance(fc_all, geojson.FeatureCollection)
        assert len(fc_all.features) == project.total_tasks

    async def test_project_can_be_generated_as_dto(self):
        project, user, project_id = await create_canned_project(self.db)

        project_dto = await Project.as_dto_for_mapping(
            project_id, self.db, None, "en", True
        )

        aoi_raw = project_dto.area_of_interest
        if isinstance(aoi_raw, dict):
            aoi = geojson.loads(json.dumps(aoi_raw))
        else:
            aoi = aoi_raw

        tasks_raw = project_dto.tasks
        if isinstance(tasks_raw, dict):
            tasks = geojson.loads(json.dumps(tasks_raw))
        else:
            tasks = tasks_raw

        assert isinstance(aoi, geojson.MultiPolygon)
        assert isinstance(tasks, geojson.FeatureCollection)
        assert project_dto.project_id == project_id

    async def test_update_project_adds_project_info(self):
        project, user, project_id = await create_canned_project(self.db)
        project.id = project_id

        project = await update_project_with_info(project, self.db)
        dto = await Project.as_dto_for_mapping(project_id, self.db, None, "en", True)
        assert dto.project_status == ProjectStatus.PUBLISHED.name
        assert dto.project_priority == ProjectPriority.MEDIUM.name
        assert dto.default_locale == "en"
        assert dto.project_info.name == "Thinkwhere Test"

    async def test_project_update_updates_changed_fields(self):
        project, user, project_id = await create_canned_project(self.db)
        project.id = project_id
        # Ensure project has base info to update (async)
        project = await update_project_with_info(project, self.db)

        locales = []
        test_info = ProjectInfoDTO(locale="it")
        test_info.name = "Italian test project"
        test_info.description = "Test italian description"
        test_info.short_description = "Test italian short description"
        test_info.instructions = "Test italian instructions"
        locales.append(test_info)

        test_dto = ProjectDTO(
            project_id=project.id,
            project_status=ProjectStatus.PUBLISHED.name,
            project_priority=ProjectPriority.MEDIUM.name,
            default_locale="it",
            difficulty="EASY",
            mapping_permission="ANY",
            mapping_permission_level_id=0,
            validation_permission="ANY",
            validation_permission_level_id=0,
            private=False,
            task_creation_mode="GRID",
            mapping_editors=["JOSM", "ID", "RAPID"],
            validation_editors=["JOSM", "ID"],
            project_info_locales=locales,
            mapping_types=["ROADS", "BUILDINGS"],
            changeset_comment="hot-project",
        )
        await project.update(test_dto, self.db)

        # Get DTO for locale "it"
        dto = await Project.as_dto_for_mapping(project.id, self.db, None, "it", True)

        assert project.default_locale == test_info.locale
        assert dto.project_info.name == test_info.name
        assert dto.mapping_types == test_dto.mapping_types
        assert dto.validation_editors == test_dto.validation_editors
        assert dto.mapping_editors == test_dto.mapping_editors

    async def test_set_project_aoi(self):
        draft_json = return_canned_draft_project_json()
        draft_project_dto = DraftProjectDTO(**draft_json)
        draft_project = Project()
        await draft_project.set_project_aoi(draft_project_dto, self.db)

        assert draft_project.geometry is not None
        assert draft_project.centroid is not None

    async def test_as_dto_for_mapping(self):
        project, author, project_id = await create_canned_project(self.db)
        test_project_dto = await Project.as_dto_for_mapping(
            project_id,
            self.db,
            authenticated_user_id=author.id,
            locale="en",
            abbrev=True,
        )
        assert project.status == ProjectStatus[test_project_dto.project_status].value
        assert test_project_dto.project_info.name == TEST_PROJECT_NAME
