import base64
import pytest

from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.task import Task, TaskStatus
from backend.models.postgis.statuses import ProjectStatus

from tests.api.helpers.test_helpers import create_canned_project


def make_token_for_user(user_id: int) -> str:
    raw = AuthenticationService.generate_session_token_for_user(user_id)
    return f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"


@pytest.mark.anyio
class TestUsersTasksAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.user_session_token = make_token_for_user(self.test_author.id)
        self.url = f"/api/v2/users/{self.test_author.id}/tasks/"

    async def test_returns_401_if_no_token(self, client: AsyncClient):
        """Test that the API returns a 401/403 if no token is provided"""
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def change_task_status(self, task_id, status, project_id):
        """Helper to change the status of a task (async)"""
        await Task.get(task_id, project_id, self.db)
        if status == TaskStatus.MAPPED:
            await Task.lock_task_for_mapping(
                task_id, project_id, self.test_author.id, self.db
            )
        elif status == TaskStatus.VALIDATED:
            await Task.lock_task_for_validating(
                task_id, project_id, self.test_author.id, self.db
            )
        await Task.unlock_task(
            task_id, project_id, self.test_author.id, status, self.db
        )

    async def test_returns_200_on_success(self, client: AsyncClient):
        """Test that the API returns a 200 on success"""
        # Arrange
        await self.change_task_status(1, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(2, TaskStatus.VALIDATED, self.test_project_id)

        # Act
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"project_id": self.test_project_id},
        )

        # Assert
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 2
        assert body["tasks"][0]["taskId"] == 2

    async def test_returns_paginated_results(self, client: AsyncClient):
        """Test that the API returns paginated results"""
        # Arrange
        await self.change_task_status(1, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(2, TaskStatus.VALIDATED, self.test_project_id)

        # Act
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"project_id": self.test_project_id, "page_size": 1},
        )

        # Assert
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 1
        assert body["pagination"]["total"] == 2
        assert body["pagination"]["page"] == 1
        assert body["pagination"]["perPage"] == 1
        assert body["pagination"]["hasNext"] is True

    async def test_filters_by_project_if_project_id_passed(self, client: AsyncClient):
        """Test that the API filters by project if project_id is passed"""
        # Arrange
        test_project2, test_author2, test_project2_id = await create_canned_project(
            self.db, name="Test 2"
        )
        await self.change_task_status(1, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(2, TaskStatus.VALIDATED, self.test_project_id)
        await self.change_task_status(1, TaskStatus.MAPPED, test_project2_id)

        # Act
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"project_id": test_project2_id},
        )

        # Assert
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 1
        assert body["tasks"][0]["taskId"] == 1
        assert body["tasks"][0]["projectId"] == test_project2_id
        assert body["tasks"][0]["taskStatus"] == TaskStatus.MAPPED.name

    async def test_filters_by_status_if_status_passed(self, client: AsyncClient):
        """Test that the API filters by status if status is passed"""
        # Arrange
        await self.change_task_status(1, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(2, TaskStatus.VALIDATED, self.test_project_id)

        # Act
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={
                "project_id": self.test_project_id,
                "status": TaskStatus.MAPPED.name,
            },
        )

        # Assert
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 1
        assert body["tasks"][0]["taskId"] == 1
        assert body["tasks"][0]["projectId"] == self.test_project_id
        assert body["tasks"][0]["taskStatus"] == TaskStatus.MAPPED.name

    async def test_filters_by_project_status_if_project_status_passed(
        self, client: AsyncClient
    ):
        """Test that the API filters by project status if passed"""
        # Arrange
        test_project2, test_author2, test_project2_id = await create_canned_project(
            self.db, name="Test 2"
        )

        # set project 2 status to PUBLISHED
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": test_project2_id},
        )

        await self.change_task_status(1, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(1, TaskStatus.MAPPED, test_project2_id)

        # Act
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"project_status": ProjectStatus.PUBLISHED.name},
        )

        # Assert
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 1
        assert body["tasks"][0]["taskId"] == 1
        assert body["tasks"][0]["projectId"] == test_project2_id

    async def test_sorts_results_by_project_id_in_defined_order(
        self, client: AsyncClient
    ):
        """Test that the API sorts results by project id in defined order"""
        # Arrange
        test_project2, test_author2, test_project2_id = await create_canned_project(
            self.db, name="Test 2"
        )

        await self.change_task_status(1, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(2, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(1, TaskStatus.MAPPED, test_project2_id)

        # Act (ascending project_id)
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"sort_by": "project_id"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 3
        assert body["tasks"][0]["projectId"] == self.test_project_id
        assert body["tasks"][1]["projectId"] == self.test_project_id
        assert body["tasks"][2]["projectId"] == test_project2_id

        # Act (descending project_id)
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"sort_by": "-project_id"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 3
        assert body["tasks"][0]["projectId"] == test_project2_id
        assert body["tasks"][1]["projectId"] == self.test_project_id
        assert body["tasks"][2]["projectId"] == self.test_project_id

    async def test_sorts_results_by_action_date_in_defined_order(
        self, client: AsyncClient
    ):
        """Test that the API sorts results by action date in defined order"""
        # Arrange
        await self.change_task_status(1, TaskStatus.MAPPED, self.test_project_id)
        await self.change_task_status(2, TaskStatus.MAPPED, self.test_project_id)

        # Act (ascending action_date)
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"sort_by": "action_date"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 2
        assert body["tasks"][0]["taskId"] == 1
        assert body["tasks"][1]["taskId"] == 2

        # Act (descending action_date)
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"sort_by": "-action_date"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 2
        assert body["tasks"][0]["taskId"] == 2
        assert body["tasks"][1]["taskId"] == 1
