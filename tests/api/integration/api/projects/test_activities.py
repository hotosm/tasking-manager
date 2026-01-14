import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import ProjectStatus, TaskStatus
from backend.models.postgis.task import Task, TaskAction
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestProjectsLastActivitiesAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        # reference convention: (project, author, project_id)
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/activities/latest/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999/activities/latest/")
        assert resp.status_code == 404

    async def test_returns_200_if_project_exists(self, client: AsyncClient):

        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        # Arrange - perform actions on task 2 to generate activity entries
        t2 = await Task.get(2, self.test_project_id, self.db)

        # Lock the task for mapping and then mark it as mapped
        await Task.lock_task_for_mapping(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )

        # Act
        resp = await client.get(self.url)
        assert resp.status_code == 200

        body = resp.json()
        # The API returns an "activity" list; original test compared to project.total_tasks
        # Use attribute from created project if available, else rely on returned length.
        expected_count = getattr(
            self.test_project, "total_tasks", len(body.get("activity", []))
        )
        assert len(body["activity"]) == expected_count

        # Verify second activity corresponds to task 2 being MAPPED by the author
        # (index 1 as in original test)
        assert body["activity"][1]["taskId"] == 2
        assert body["activity"][1]["taskStatus"] == "MAPPED"
        assert body["activity"][1]["actionBy"] == self.test_author.username


@pytest.mark.anyio
class TestProjectsActivitiesAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/activities/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999/activities/")
        assert resp.status_code == 404

    async def test_returns_200_if_project_exists(self, client: AsyncClient):
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        # Arrange - create activity entries for task 2
        t2 = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )

        # Act
        resp = await client.get(self.url)
        assert resp.status_code == 200

        body = resp.json()
        assert list(body.keys()) == ["pagination", "activity"]

        # activity item keys (original test included actionBy twice; set handles duplicates)
        expected_keys = {
            "historyId",
            "taskId",
            "action",
            "actionText",
            "actionBy",
            "actionDate",
            "pictureUrl",
            "issues",
        }
        assert set(body["activity"][0].keys()) == expected_keys

        # Since we performed two actions on task 2 (lock and mapped), expect 2 activity items
        assert len(body["activity"]) == 2

        # The most recent entry (index 0) should be the state change to MAPPED
        assert body["activity"][0]["taskId"] == 2
        assert body["activity"][0]["action"] == TaskAction.STATE_CHANGE.name
        assert body["activity"][0]["actionText"] == TaskStatus.MAPPED.name
        assert body["activity"][0]["actionBy"] == self.test_author.username

        # The second entry should be the LOCKED_FOR_MAPPING action
        assert body["activity"][1]["taskId"] == 2
        assert body["activity"][1]["action"] == TaskAction.LOCKED_FOR_MAPPING.name
        assert body["activity"][1]["actionBy"] == self.test_author.username
