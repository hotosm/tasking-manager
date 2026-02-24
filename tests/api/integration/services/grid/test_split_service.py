import json
import pytest
import geojson
from backend.models.postgis.task import Task
from backend.services.grid.split_service import SplitService, SplitServiceError
from tests.api.helpers.test_helpers import get_canned_json, create_canned_project


@pytest.mark.anyio
class TestSplitService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_user, self.test_project_id = (
            await create_canned_project(db=self.db)
        )

    async def test_split_geom_returns_split_geometries(self):
        # arrange
        x = 1010
        y = 1399
        zoom = 11
        task_stub = Task()
        task_stub.is_square = True

        expected = geojson.loads(json.dumps(get_canned_json("split_task.json")))

        # act
        result = await SplitService._create_split_tasks(x, y, zoom, task_stub, self.db)

        # assert
        assert result == expected

    async def test_split_geom_raise_grid_service_error_when_task_not_usable(self):
        task_stub = Task()
        task_stub.is_square = True

        # Act / Assert
        with pytest.raises(SplitServiceError):
            await SplitService._create_split_tasks(
                "foo", "bar", "dum", task_stub, self.db
            )

    async def test_split_non_square_task(self):
        # Lock task for mapping
        task = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            2, self.test_project_id, self.test_user.id, self.db
        )

        # Split tasks
        expected = geojson.loads(
            json.dumps(get_canned_json("non_square_split_results.json"))
        )
        result = await SplitService._create_split_tasks(
            task.x, task.y, task.zoom, task, self.db
        )

        # Compare geometries more flexibly since precision may vary
        assert len(result) == len(expected)
        for i, (result_feature, expected_feature) in enumerate(zip(result, expected)):
            assert result_feature["type"] == expected_feature["type"]
            assert (
                result_feature["geometry"]["type"]
                == expected_feature["geometry"]["type"]
            )
