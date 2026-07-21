import base64
from unittest.mock import patch

import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.task import Task
from backend.services.project_admin_service import ProjectAdminService
from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)

PROJECT_NOT_FOUND_SUB_CODE = "PROJECT_NOT_FOUND"
TASK_NOT_FOUND_SUB_CODE = "TASK_NOT_FOUND"

def generate_encoded_token(user_id):
    raw = AuthenticationService.generate_session_token_for_user(user_id)
    return base64.b64encode(raw.encode("utf-8")).decode("utf-8")

@pytest.mark.anyio
class TestTasksActionsExtendAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        test_user = await return_canned_user(self.db, "test_user", 1111111 + id(self))
        self.test_user = await create_canned_user(self.db, test_user)

        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.author_access_token = generate_encoded_token(self.test_author.id)

        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/extend/"

    async def test_returns_403_if_user_not_logged_in(self, client: AsyncClient):
        response = await client.request("POST", self.url)
        assert response.status_code == 403

    async def test_returns_400_if_invalid_data(self, client: AsyncClient):
        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": "abcd"},
        )
        assert response.status_code == 400
        assert response.json()["SubCode"] == "InvalidData"

    async def test_returns_404_if_project_not_found(self, client: AsyncClient):
        response = await client.request(
            "POST",
            "/api/v2/projects/999/tasks/actions/extend/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )
        assert response.status_code == 404
        assert response.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_returns_404_if_task_not_found(self, client: AsyncClient):
        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [999]},
        )
        assert response.status_code == 404
        assert response.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    async def test_returns_403_if_task_not_locked(self, client: AsyncClient):
        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )
        assert response.status_code == 403
        assert response.json()["SubCode"] == "TaskStatusNotLocked"

    async def test_returns_403_if_task_is_not_locked_by_requesting_user(
        self, client: AsyncClient
    ):
        task = await Task.get(1, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            task.id, task.project_id, self.test_author.id, self.db
        )

        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )

        assert response.status_code == 403
        assert response.json()["SubCode"] == "LockedByAnotherUser"

    async def test_returns_200_if_task_locked_by_requesting_user(
        self, client: AsyncClient
    ):
        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        await Task.lock_task_for_mapping(
            t1.id, t1.project_id, self.test_user.id, self.db
        )
        await Task.lock_task_for_mapping(
            t2.id, t2.project_id, self.test_user.id, self.db
        )

        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1, 2]},
        )

        assert response.status_code == 200
        assert response.json()["Success"] == "Successfully extended task expiry"


@pytest.mark.anyio
@pytest.mark.anyio
class TestTasksActionsRevertUserTasksAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        test_user = await return_canned_user(self.db, "test_user", 1111111 + id(self))
        self.test_user = await create_canned_user(self.db, test_user)

        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.author_access_token = generate_encoded_token(self.test_author.id)

        self.url = (
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/reset-by-user/"
        )

    async def test_returns_403_if_user_not_logged_in(self, client: AsyncClient):
        response = await client.request("POST", self.url)
        assert response.status_code == 403

    async def test_returns_400_if_user_not_found(self, client: AsyncClient):
        response = await client.request(
            "POST",
            "/api/v2/projects/999/tasks/actions/reset-by-user/",
            headers={"Authorization": f"Token {self.author_access_token}"},
            params={"username": "invalid_user", "action": "VALIDATED"},
        )

        assert response.status_code == 400

    async def test_returns_400_if_action_not_valid(self, client: AsyncClient):
        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.author_access_token}"},
            params={"username": self.test_user.username, "action": "MAPPED"},
        )
        assert response.status_code == 400
        assert response.json()["SubCode"] == "InvalidData"
        assert response.json()["Error"] == "Unable to revert tasks"

    async def test_returns_404_if_project_not_found(self, client: AsyncClient):
        response = await client.request(
            "POST",
            "/api/v2/projects/999/tasks/actions/reset-by-user/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"username": "test_user", "action": "VALIDATED"},
        )
        assert response.status_code == 404
        assert response.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_returns_403_if_user_has_no_pm_permission(self, client: AsyncClient):
        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"username": "test_user", "action": "VALIDATED"},
        )
        assert response.status_code == 403
        assert response.json()["SubCode"] == "UserActionNotPermitted"

    async def set_task_status(self, task, status, user_id):
        await Task.lock_task_for_mapping(task.id, task.project_id, user_id, self.db)

        if status == "BADIMAGERY":
            await Task.unlock_task(
                task.id, task.project_id, user_id, TaskStatus.BADIMAGERY, self.db
            )

        elif status == "VALIDATED":
            await Task.unlock_task(
                task.id, task.project_id, user_id, TaskStatus.MAPPED, self.db
            )
            await Task.lock_task_for_validating(
                task.id, task.project_id, user_id, self.db
            )
            await Task.unlock_task(
                task.id, task.project_id, user_id, TaskStatus.VALIDATED, self.db
            )

    async def test_reverts_user_validated_tasks(self, client: AsyncClient):

        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        await self.set_task_status(t1, "VALIDATED", self.test_user.id)
        await self.set_task_status(t2, "VALIDATED", self.test_author.id)

        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.author_access_token}"},
            params={"username": self.test_user.username, "action": "VALIDATED"},
        )

        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        assert response.status_code == 200
        assert response.json()["Success"] == "Successfully reverted tasks"
        assert t1.task_status == TaskStatus.MAPPED.value
        assert t2.task_status == TaskStatus.VALIDATED.value

    async def test_reverts_user_bad_imagery_tasks(self, client: AsyncClient):
        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        await self.set_task_status(t1, "BADIMAGERY", self.test_user.id)
        await self.set_task_status(t2, "BADIMAGERY", self.test_author.id)

        response = await client.request(
            "POST",
            self.url,
            headers={"Authorization": f"Token {self.author_access_token}"},
            params={"username": self.test_user.username, "action": "BADIMAGERY"},
        )

        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        assert response.status_code == 200
        assert response.json()["Success"] == "Successfully reverted tasks"
        assert t1.task_status == TaskStatus.READY.value
        assert t2.task_status == TaskStatus.BADIMAGERY.value
