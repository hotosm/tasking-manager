import base64
from unittest.mock import patch

import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import TaskStatus
from backend.services.project_admin_service import ProjectAdminService
from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)

def _encode_token(raw_token: str) -> str:
    return base64.b64encode(raw_token.encode("utf-8")).decode("utf-8")

@pytest.mark.anyio
class TestTasksActionsMapAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Create project, author and a normal user; store db, url & token(s)
        """
        self.db = db_connection_fixture
        # helpers return (project, author, project_id) in this test-suite convention
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        # ensure some tasks exist in READY state for the test project
        # (the canned project usually creates them; we will rely on their initial state)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/map-all/"

        payload = await return_canned_user(self.db, "test_user_bulk", 5555555 + id(self))
        self.test_user = await create_canned_user(self.db, payload)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)

    async def _get_tasks_by_status(self, status_name):
        status_value = TaskStatus[status_name].value
        rows = await self.db.fetch_all(
            "SELECT id, task_status FROM tasks WHERE project_id = :proj_id AND task_status = :status",
            {"proj_id": int(self.test_project_id), "status": status_value},
        )
        return rows

    async def test_map_all_tasks_returns_403_for_unauthorized_request(
        self, client: AsyncClient
    ):
        # no auth header
        response = await client.post(self.url)
        assert response.status_code == 403

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_map_all_tasks_returns_403_for_non_PM_role_request(
        self, mock_pm_role, client: AsyncClient
    ):
        mock_pm_role.return_value = False
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        body = response.json()
        assert body.get("SubCode") == "UserPermissionError"

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_map_all_tasks_is_allowed_for_user_with_pm_role(
        self, mock_pm_role, client: AsyncClient
    ):
        # collect tasks that are READY before mapping
        init_ready_tasks = await self._get_tasks_by_status("READY")
        mock_pm_role.return_value = True

        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 200

        # verify tasks were updated to MAPPED
        for row in init_ready_tasks:
            task = await self.db.fetch_one(
                "SELECT task_status FROM tasks WHERE id = :id AND project_id = :proj",
                {"id": int(row["id"]), "proj": int(self.test_project_id)},
            )
            assert task["task_status"] == TaskStatus.MAPPED.value

        # verify project counters updated (read from projects table)
        proj = await self.db.fetch_one(
            "SELECT total_tasks, tasks_bad_imagery, tasks_validated, tasks_mapped FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        expected_mapped = (
            proj["total_tasks"] - proj["tasks_bad_imagery"] - proj["tasks_validated"]
        )
        assert proj["tasks_mapped"] == expected_mapped


@pytest.mark.anyio
class TestTasksActionsValidateAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = (
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/validate-all/"
        )
        payload = await return_canned_user(self.db, "test_user_bulk", 5555555 + id(self))
        self.test_user = await create_canned_user(self.db, payload)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)

    async def _get_tasks_by_status(self, status_name):
        val = TaskStatus[status_name].value
        return await self.db.fetch_all(
            "SELECT id, task_status FROM tasks WHERE project_id = :proj_id AND task_status = :status",
            {"proj_id": int(self.test_project_id), "status": val},
        )

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_validate_all_tasks_returns_401_for_unauthorized_request(
        self, mock_pm_role, client: AsyncClient
    ):
        response = await client.post(self.url)
        assert response.status_code in [401, 403]

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_validate_all_tasks_returns_403_for_non_PM_role_request(
        self, mock_pm_role, client: AsyncClient
    ):
        mock_pm_role.return_value = False
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        assert response.json().get("SubCode") == "UserPermissionError"

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_validate_all_tasks_is_allowed_for_user_with_pm_role(
        self, mock_pm_role, client: AsyncClient
    ):
        init_mapped_tasks = await self._get_tasks_by_status("MAPPED")
        mock_pm_role.return_value = True
        proj_before = await self.db.fetch_one(
            "SELECT tasks_validated FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        init_tasks_validated = proj_before["tasks_validated"]

        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 200

        for row in init_mapped_tasks:
            task = await self.db.fetch_one(
                "SELECT task_status FROM tasks WHERE id=:id", {"id": int(row["id"])}
            )
            assert task["task_status"] == TaskStatus.VALIDATED.value

        proj_after = await self.db.fetch_one(
            "SELECT tasks_validated FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        assert proj_after["tasks_validated"] == init_tasks_validated + len(
            init_mapped_tasks
        )


@pytest.mark.anyio
class TestTasksActionsInvalidateAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = (
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/invalidate-all/"
        )
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)

    async def _get_tasks_by_status(self, status_name):
        val = TaskStatus[status_name].value
        return await self.db.fetch_all(
            "SELECT id, task_status FROM tasks WHERE project_id = :proj_id AND task_status = :status",
            {"proj_id": int(self.test_project_id), "status": val},
        )

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_invalidate_all_tasks_returns_401_for_unauthorized_request(
        self, mock_pm_role, client: AsyncClient
    ):
        response = await client.post(self.url)
        assert response.status_code in [401, 403]

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_invalidate_all_tasks_returns_403_for_non_PM_role_request(
        self, mock_pm_role, client: AsyncClient
    ):
        mock_pm_role.return_value = False
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        assert response.json().get("SubCode") == "UserPermissionError"

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_invalidate_all_tasks_is_allowed_for_user_with_pm_role(
        self, mock_pm_role, client: AsyncClient
    ):
        validated_tasks = await self._get_tasks_by_status("VALIDATED")
        mock_pm_role.return_value = True
        proj_before = await self.db.fetch_one(
            "SELECT tasks_validated FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        init_tasks_validated = proj_before["tasks_validated"]

        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 200

        for row in validated_tasks:
            task = await self.db.fetch_one(
                "SELECT task_status FROM tasks WHERE id=:id", {"id": int(row["id"])}
            )
            assert task["task_status"] == TaskStatus.INVALIDATED.value

        proj_after = await self.db.fetch_one(
            "SELECT tasks_validated FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        assert proj_after["tasks_validated"] == 0

        after_invalidated = await self.db.fetch_all(
            "SELECT id FROM tasks WHERE project_id = :proj AND task_status = :status",
            {"proj": int(self.test_project_id), "status": TaskStatus.INVALIDATED.value},
        )
        assert len(after_invalidated) == init_tasks_validated


@pytest.mark.anyio
class TestTasksActionsResetBadImageryAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/reset-all-badimagery/"
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)

    async def _get_tasks_by_status(self, status_name):
        val = TaskStatus[status_name].value
        return await self.db.fetch_all(
            "SELECT id, task_status FROM tasks WHERE project_id = :proj AND task_status = :status",
            {"proj": int(self.test_project_id), "status": val},
        )

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_reset_all_badimagery_tasks_returns_401_for_unauthorized_request(
        self, mock_pm_role, client: AsyncClient
    ):
        response = await client.post(self.url)
        assert response.status_code in [401, 403]

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_reset_all_badimagery_tasks_returns_403_for_non_PM_role_request(
        self, mock_pm_role, client: AsyncClient
    ):
        mock_pm_role.return_value = False
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        assert response.json().get("SubCode") == "UserPermissionError"

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_reset_all_badimagery_tasks_is_allowed_for_user_with_pm_role(
        self, mock_pm_role, client: AsyncClient
    ):
        init_bad_imagery_tasks = await self._get_tasks_by_status("BADIMAGERY")
        mock_pm_role.return_value = True

        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 200

        for row in init_bad_imagery_tasks:
            task = await self.db.fetch_one(
                "SELECT task_status FROM tasks WHERE id=:id", {"id": int(row["id"])}
            )
            assert task["task_status"] == TaskStatus.READY.value

        proj_after = await self.db.fetch_one(
            "SELECT tasks_bad_imagery FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        assert proj_after["tasks_bad_imagery"] == 0


@pytest.mark.anyio
class TestTasksActionsResetAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/reset-all/"
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)

    async def _get_tasks_by_status(self, status_name):
        val = TaskStatus[status_name].value
        return await self.db.fetch_all(
            "SELECT id, task_status FROM tasks WHERE project_id = :proj AND task_status = :status",
            {"proj": int(self.test_project_id), "status": val},
        )

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_reset_all_tasks_returns_401_for_unauthorized_request(
        self, mock_pm_role, client: AsyncClient
    ):
        response = await client.post(self.url)
        assert response.status_code in [401, 403]

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_reset_all_tasks_returns_403_for_non_PM_role_request(
        self, mock_pm_role, client: AsyncClient
    ):
        mock_pm_role.return_value = False
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        assert response.json().get("SubCode") == "UserPermissionError"

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_reset_all_tasks_is_allowed_for_user_with_pm_role(
        self, mock_pm_role, client: AsyncClient
    ):
        init_non_ready_tasks = []
        for status in ["MAPPED", "VALIDATED", "INVALIDATED", "BADIMAGERY"]:
            rows = await self._get_tasks_by_status(status)
            init_non_ready_tasks.extend(rows)

        mock_pm_role.return_value = True
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 200

        for row in init_non_ready_tasks:
            task = await self.db.fetch_one(
                "SELECT task_status FROM tasks WHERE id = :id", {"id": int(row["id"])}
            )
            assert task["task_status"] == TaskStatus.READY.value

        ready_tasks = await self.db.fetch_all(
            "SELECT id FROM tasks WHERE project_id = :proj AND task_status = :status",
            {"proj": int(self.test_project_id), "status": TaskStatus.READY.value},
        )
        assert (
            len(ready_tasks)
            == (
                await self.db.fetch_one(
                    "SELECT total_tasks FROM projects WHERE id = :id",
                    {"id": int(self.test_project_id)},
                )
            )["total_tasks"]
        )
        proj = await self.db.fetch_one(
            "SELECT tasks_mapped, tasks_validated, tasks_bad_imagery FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        assert proj["tasks_mapped"] == 0
        assert proj["tasks_validated"] == 0
        assert proj["tasks_bad_imagery"] == 0


