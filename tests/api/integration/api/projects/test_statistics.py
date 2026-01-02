# tests/api/integration/test_project_statistics_refactored.py
import asyncio

import pytest
from httpx import AsyncClient

from backend.services.project_admin_service import ProjectAdminService
from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.task import Task

from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestProjectStatisticsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        # reference convention: (project, author, project_id)
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/statistics/"

    async def test_returns_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/99999/statistics/")
        assert resp.status_code == 404

    async def test_returns_200_if_project_found(self, client: AsyncClient):
        # Reset tasks to READY
        await ProjectAdminService.reset_all_tasks(
            self.test_project_id, self.test_author.id, self.db
        )

        # pick a task and perform a mapping action that lasts ~3s
        task = await Task.get(1, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            task.id, task.project_id, self.test_author.id, self.db
        )

        # use asyncio.sleep so we don't block the event loop
        await asyncio.sleep(3)

        await Task.unlock_task(
            task.id, task.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()

        assert body["totalTasks"] == 4
        # allow slight timing tolerance
        assert body["totalMappingTime"] == pytest.approx(3.0, rel=0.2)
        assert body["totalTimeSpent"] == pytest.approx(3.0, rel=0.2)
        assert body["averageMappingTime"] == pytest.approx(3.0, rel=0.2)
        assert body["timeToFinishMapping"] == pytest.approx(12.0, rel=0.2)
        assert body["timeToFinishValidating"] == pytest.approx(0.0, abs=1e-6)


@pytest.mark.anyio
class TestProjectsStatisticsQueriesUsernameAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/statistics/queries/{self.test_author.username}/"

    async def test_returns_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.get(
            f"/api/v2/projects/99999/statistics/queries/{self.test_author.username}/"
        )
        assert resp.status_code == 404

    async def test_returns_404_if_username_not_found(self, client: AsyncClient):
        resp = await client.get(
            f"/api/v2/projects/{self.test_project_id}/statistics/queries/username/"
        )
        assert resp.status_code == 404

    async def test_returns_200_if_project_found(self, client: AsyncClient):
        t = await Task.get(1, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            t.id, t.project_id, self.test_author.id, self.db
        )

        await asyncio.sleep(3)

        await Task.unlock_task(
            t.id, t.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()

        assert body["timeSpentMapping"] == pytest.approx(3.0, rel=0.2)
        assert body["timeSpentValidating"] == pytest.approx(0.0, abs=1e-6)
        assert body["totalTimeSpent"] == pytest.approx(3.0, rel=0.2)
