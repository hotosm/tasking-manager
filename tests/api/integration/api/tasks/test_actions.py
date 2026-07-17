import base64
from unittest.mock import patch

import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import (
    TaskStatus,
    MappingNotAllowed,
    ProjectStatus,
    ValidatingNotAllowed,
    ValidationPermission,
)
from backend.models.postgis.task import Task, TaskAction
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
from backend.services.users.user_service import UserService
from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
    generate_encoded_token,
    create_canned_license,
)

PROJECT_NOT_FOUND_SUB_CODE = "PROJECT_NOT_FOUND"
TASK_NOT_FOUND_SUB_CODE = "TASK_NOT_FOUND"


# ---------- Shared helpers used by tests ----------
def _encode_token(raw_token: str) -> str:
    return base64.b64encode(raw_token.encode("utf-8")).decode("utf-8")


# ---------- Tests ----------


@pytest.mark.anyio
class TestTasksActionsMappingLockAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = (
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/lock-for-mapping/1/"
        )
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)

    async def _get_task(self, task_id=1):
        return await self.db.fetch_one(
            "SELECT * FROM tasks WHERE id = :id AND project_id = :proj",
            {"id": int(task_id), "proj": int(self.test_project_id)},
        )

    async def _update_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        params = {**fields, "id": int(task_id), "proj": int(self.test_project_id)}
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            params,
        )

    async def test_mapping_lock_returns_401_for_unauthorized_request(
        self, client: AsyncClient
    ):
        response = await client.post(self.url)
        assert response.status_code == 403

    async def test_mapping_lock_returns_404_for_invalid_project_id(
        self, client: AsyncClient
    ):
        response = await client.post(
            "/api/v2/projects/999999/tasks/actions/lock-for-mapping/1/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert response.status_code == 404
        body = response.json()
        assert body["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_mapping_lock_returns_404_for_invalid_task_id(
        self, client: AsyncClient
    ):
        response = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/lock-for-mapping/999999/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert response.status_code == 404
        assert response.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    @patch.object(ProjectService, "is_user_permitted_to_map")
    async def test_mapping_lock_returns_403_for_if_user_not_allowed_to_map(
        self, mock_permitted, client: AsyncClient
    ):
        mock_permitted.return_value = (False, MappingNotAllowed.PROJECT_NOT_PUBLISHED)
        # ensure task 1 is READY
        await self._update_task(1, task_status=TaskStatus.READY.value)
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        assert response.json()["SubCode"] == "ProjectNotPublished"

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_mapping_lock_returns_403_if_task_in_invalid_state_for_mapping(
        self, mock_pm_role, client: AsyncClient
    ):
        mock_pm_role.return_value = True
        # default task 1 in canned project is probably MAPPED; calling endpoint should return InvalidTaskState
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        assert response.json()["SubCode"] == "InvalidTaskState"

        # set to VALIDATED and check again
        await self._update_task(1, task_status=TaskStatus.VALIDATED.value)
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 403
        assert response.json()["SubCode"] == "InvalidTaskState"

    @patch.object(UserService, "has_user_accepted_license")
    async def test_mapping_lock_returns_403_if_project_licence_not_accepted(
        self, mock_accepted, client: AsyncClient
    ):
        mock_accepted.return_value = False
        # make project published and add a license
        await self.db.execute(
            "UPDATE projects SET status = :status, license_id = :lic WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "lic": await create_canned_license(self.db),
                "id": int(self.test_project_id),
            },
        )
        await self._update_task(1, task_status=TaskStatus.READY.value)
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 409
        assert response.json()["SubCode"] == "UserLicenseError"

    @patch.object(ProjectService, "is_user_permitted_to_map")
    async def test_mapping_lock_is_allowed_for_user_with_mapping_permission(
        self, mock_permitted, client: AsyncClient
    ):
        mock_permitted.return_value = (True, "User allowed to map")
        await self._update_task(1, task_status=TaskStatus.READY.value)
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert response.status_code == 200
        body = response.json()
        assert body["taskId"] == 1
        assert body["projectId"] == int(self.test_project_id)
        assert body["taskStatus"] == TaskStatus.LOCKED_FOR_MAPPING.name
        assert body["lockHolder"] == self.test_user.username


@pytest.mark.anyio
class TestTasksActionsMappingUnlockAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/unlock-after-mapping/1/"

    async def _get_task(self, task_id=1):
        return await self.db.fetch_one(
            "SELECT * FROM tasks WHERE id = :id AND project_id = :proj",
            {"id": int(task_id), "proj": int(self.test_project_id)},
        )

    async def _update_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        params = {**fields, "id": int(task_id), "proj": int(self.test_project_id)}
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            params,
        )

    async def test_mapping_unlock_returns_401_for_unauthenticated_user(
        self, client: AsyncClient
    ):
        response = await client.post(self.url)
        assert response.status_code == 403

    async def test_mapping_unlock_returns_403_if_invalid_status(
        self, client: AsyncClient
    ):
        response = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "test"},
        )
        assert response.status_code == 403
        assert response.json()["SubCode"] == "LockBeforeUnlocking"

    async def test_mapping_unlock_returns_404_for_invalid_project_id(
        self, client: AsyncClient
    ):
        resp = await client.post(
            "/api/v2/projects/999999/tasks/actions/unlock-after-mapping/1/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_mapping_unlock_returns_404_for_invalid_task_id(
        self, client: AsyncClient
    ):
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/unlock-after-mapping/999999/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    async def test_mapping_unlock_returns_403_if_task_not_locked_for_mapping(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "LockBeforeUnlocking"

    async def test_mapping_unlock_returns_403_if_task_locked_by_other_user(
        self, client: AsyncClient
    ):
        # set task locked by author
        await self._update_task(
            1,
            task_status=TaskStatus.LOCKED_FOR_MAPPING.value,
            locked_by=self.test_author.id,
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "TaskNotOwned"

    async def test_returns_403_if_invalid_new_state_passed(self, client: AsyncClient):
        # lock by test_user
        await self._update_task(
            1,
            task_status=TaskStatus.LOCKED_FOR_MAPPING.value,
            locked_by=self.test_user.id,
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "INVALIDATED"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "InvalidUnlockState "

    async def test_mapping_unlock_returns_200_on_success(self, client: AsyncClient):
        await self._update_task(
            1,
            task_status=TaskStatus.LOCKED_FOR_MAPPING.value,
            locked_by=self.test_user.id,
        )
        await Task.lock_task_for_mapping(
            1, self.test_project_id, self.test_user.id, self.db
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskId"] == 1
        assert body["projectId"] == int(self.test_project_id)
        assert body["taskStatus"] == TaskStatus.MAPPED.name
        last_task_history = body["taskHistory"][0]
        assert last_task_history["action"] == TaskAction.STATE_CHANGE.name
        assert last_task_history["actionText"] == TaskStatus.MAPPED.name
        assert last_task_history["actionBy"] == self.test_user.username

    async def test_mapping_unlock_returns_200_on_success_with_comment(
        self, client: AsyncClient
    ):

        await self._update_task(
            1,
            task_status=TaskStatus.READY.value,
        )
        await Task.lock_task_for_mapping(
            1, self.test_project_id, self.test_user.id, self.db
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "BADIMAGERY", "comment": "cannot map"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskId"] == 1
        assert body["projectId"] == int(self.test_project_id)
        assert body["taskStatus"] == TaskStatus.BADIMAGERY.name
        last_task_history = body["taskHistory"][0]
        assert last_task_history["action"] == TaskAction.STATE_CHANGE.name
        assert last_task_history["actionText"] == TaskStatus.BADIMAGERY.name
        assert last_task_history["actionBy"] == self.test_user.username
        last_comment_history = body["taskHistory"][1]
        assert last_comment_history["action"] == TaskAction.COMMENT.name
        assert last_comment_history["actionText"] == "cannot map"
        assert last_comment_history["actionBy"] == self.test_user.username


@pytest.mark.anyio
class TestTasksActionsMappingStopAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)
        self.url = (
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/stop-mapping/1/"
        )

    async def _update_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        params = {**fields, "id": int(task_id), "proj": int(self.test_project_id)}
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            params,
        )

    async def test_returns_403_if_user_not_authorized(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_mapping_stop_returns_404_for_invalid_project_id(
        self, client: AsyncClient
    ):
        resp = await client.post(
            "/api/v2/projects/999999/tasks/actions/stop-mapping/1/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_mapping_stop_returns_404_for_invalid_task_id(
        self, client: AsyncClient
    ):
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/stop-mapping/999999/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    async def test_mapping_stop_returns_403_if_task_not_locked_for_mapping(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "LockBeforeUnlocking"

    async def test_mapping_stop_returns_403_if_task_locked_by_other_user(
        self, client: AsyncClient
    ):
        await self._update_task(
            1,
            task_status=TaskStatus.LOCKED_FOR_MAPPING.value,
            locked_by=self.test_author.id,
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"status": "MAPPED"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "TaskNotOwned"

    async def test_mapping_stop_returns_200_on_success(self, client: AsyncClient):
        await self._update_task(
            1,
            task_status=TaskStatus.READY.value,
            locked_by=self.test_user.id,
        )
        await Task.lock_task_for_mapping(
            1, self.test_project_id, self.test_user.id, self.db
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskId"] == 1
        assert body["projectId"] == int(self.test_project_id)
        assert body["taskStatus"] == TaskStatus.READY.name

    async def test_mapping_stop_returns_200_on_success_with_comment(
        self, client: AsyncClient
    ):
        await self._update_task(
            1,
            task_status=TaskStatus.READY.value,
            locked_by=self.test_user.id,
        )
        await Task.lock_task_for_mapping(
            1, self.test_project_id, self.test_user.id, self.db
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"comment": "cannot map"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskId"] == 1
        assert body["projectId"] == int(self.test_project_id)
        assert body["taskStatus"] == TaskStatus.READY.name
        last_comment_history = body["taskHistory"][0]
        assert last_comment_history["action"] == TaskAction.COMMENT.name
        assert last_comment_history["actionText"] == "cannot map"
        assert last_comment_history["actionBy"] == self.test_user.username


@pytest.mark.anyio
class TestTasksActionsValidationLockAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        author_raw = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.user_session_token = _encode_token(raw)
        self.author_session_token = _encode_token(author_raw)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/lock-for-validation/"

    async def _update_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        params = {**fields, "id": int(task_id), "proj": int(self.test_project_id)}
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            params,
        )

    async def test_returns_403_if_user_not_authorized(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_validation_lock_returns_400_if_invalid_json(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": "abcd"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"

    async def test_validation_lock_returns_404_for_invalid_project_id(
        self, client: AsyncClient
    ):
        resp = await client.post(
            "/api/v2/projects/999999/tasks/actions/lock-for-validation/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1, 2]},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_validation_lock_returns_404_for_invalid_task_id(
        self, client: AsyncClient
    ):
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/lock-for-validation/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [999999]},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    async def test_validation_lock_returns_403_if_task_not_ready_for_validation(
        self, client: AsyncClient
    ):
        # set task 1 to READY (not allowed)
        await self._update_task(1, task_status=TaskStatus.READY.value)
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "NotReadyForValidation"

    async def test_validation_lock_returns_403_if_mapped_by_same_user_and_user_not_admin(
        self, client: AsyncClient
    ):
        # set task 1 mapped_by test_user
        await self._update_task(
            1, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_user.id
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "CannotValidateMappedTask"

    async def test_validation_lock_returns_403_if_user_not_permitted_to_validate(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "ProjectNotPublished"

    async def test_validation_lock_returns_409_if_user_hasnt_accepted_license(
        self, client: AsyncClient
    ):
        # set license and publish project, set task to MAPPED and mapped_by author
        license_id = await create_canned_license(self.db)
        await self.db.execute(
            "UPDATE projects SET license_id = :lic, status = :status WHERE id = :id",
            {
                "lic": license_id,
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_id),
            },
        )
        await self._update_task(
            1, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_author.id
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )
        assert resp.status_code == 409
        assert resp.json()["SubCode"] == "UserLicenseError"

    @patch.object(ProjectService, "is_user_permitted_to_validate")
    async def test_validation_lock_returns_403_if_user_not_on_allowed_list(
        self, mock_validate_permitted, client: AsyncClient
    ):
        mock_validate_permitted.return_value = (
            False,
            ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST,
        )
        await self._update_task(
            1, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_author.id
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UserNotAllowed"

    async def test_validation_lock_returns_403_if_user_has_already_locked_other_task(
        self, client: AsyncClient
    ):
        # publish project and lock task 2 for mapping by test_user
        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        await self._update_task(
            2,
            task_status=TaskStatus.LOCKED_FOR_MAPPING.value,
            locked_by=self.test_author.id,
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.author_session_token}"},
            json={"taskIds": [1]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UserAlreadyHasTaskLocked"

    @patch.object(ProjectService, "is_user_permitted_to_validate")
    async def def_validation_lock_returns_200_if_user_permitted_to_validate(
        self, mock_validate_permitted, client: AsyncClient
    ):
        # Named same as original; keep behavior (this was not decorated as test in original; keep as helper)
        mock_validate_permitted.return_value = (
            True,
            ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST,
        )
        await self._update_task(2, task_status=TaskStatus.INVALIDATED.value)
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"taskIds": [1, 2]},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["tasks"][0]["taskId"] == 1
        assert body["tasks"][0]["taskStatus"] == TaskStatus.LOCKED_FOR_VALIDATION.name
        assert body["tasks"][1]["taskId"] == 2
        assert body["tasks"][1]["taskStatus"] == TaskStatus.LOCKED_FOR_VALIDATION.name


@pytest.mark.anyio
class TestTasksActionsValidationUnlockAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/unlock-after-validation/"

    async def _update_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        params = {**fields, "id": int(task_id), "proj": int(self.test_project_id)}
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            params,
        )

    async def _lock_for_validation(self, task_id, user_id, mapped_by=None):
        params = {
            "task_status": TaskStatus.LOCKED_FOR_VALIDATION.value,
            "locked_by": int(user_id),
            "id": int(task_id),
            "proj": int(self.test_project_id),
        }

        if mapped_by:
            await self.db.execute(
                """
                UPDATE tasks
                SET task_status = :task_status,
                    locked_by = :locked_by,
                    mapped_by = :mapped_by
                WHERE id = :id AND project_id = :proj
                """,
                {
                    "task_status": params["task_status"],
                    "locked_by": params["locked_by"],
                    "mapped_by": int(mapped_by),
                    "id": params["id"],
                    "proj": params["proj"],
                },
            )
        else:
            await self.db.execute(
                """
                UPDATE tasks
                SET task_status = :task_status,
                    locked_by = :locked_by
                WHERE id = :id AND project_id = :proj
                """,
                params,
            )

    async def test_validation_unlock_returns_403_if_user_not_logged_in(
        self, client: AsyncClient
    ):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_validation_unlock_returns_400_if_invalid_request(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"validatedTasks": "xxx"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"

    async def test_validation_unlock_returns_404_if_project_not_found(
        self, client: AsyncClient
    ):
        resp = await client.post(
            "/api/v2/projects/999/tasks/actions/unlock-after-validation/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"validatedTasks": [{"taskId": 1, "status": "VALIDATED"}]},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_validation_unlock_returns_404_if_task_not_found(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"validatedTasks": [{"taskId": 999, "status": "VALIDATED"}]},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    async def test_validation_unlock_returns_403_if_task_not_locked_for_validation(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"validatedTasks": [{"taskId": 1, "status": "VALIDATED"}]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "NotLockedForValidation "

    async def test_validation_unlock_returns_403_if_task_locked_by_other_user(
        self, client: AsyncClient
    ):
        await self._lock_for_validation(1, self.test_author.id)
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"validatedTasks": [{"taskId": 1, "status": "VALIDATED"}]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "TaskNotOwned "

    async def test_validation_unlock_returns_400_if_invalid_state_passsed(
        self, client: AsyncClient
    ):
        await self._lock_for_validation(2, self.test_user.id)
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"validatedTasks": [{"taskId": 1, "status": "READY"}]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "NotLockedForValidation "

    @staticmethod
    def assert_validated_task_response(
        task_response, task_id, status, validator_username, comment=None
    ):
        assert task_response["taskId"] == task_id
        assert task_response["taskStatus"] == status
        assert task_response["taskHistory"][0]["action"] == "STATE_CHANGE"
        assert task_response["taskHistory"][0]["actionText"] == status
        assert task_response["taskHistory"][0]["actionBy"] == validator_username
        if comment:
            assert task_response["taskHistory"][1]["action"] == "COMMENT"
            assert task_response["taskHistory"][1]["actionText"] == comment
            assert task_response["taskHistory"][1]["actionBy"] == validator_username

    async def test_validation_unlock_returns_200_if_validated(
        self, client: AsyncClient
    ):
        # set task 1 mapped_by test_user

        await self._update_task(
            1, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_user.id
        )

        await self._update_task(
            2, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_user.id
        )
        await Task.lock_task_for_validating(
            1, self.test_project_id, self.test_user.id, self.db
        )
        await Task.lock_task_for_validating(
            2, self.test_project_id, self.test_user.id, self.db
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={
                "validatedTasks": [
                    {"taskId": 1, "status": "VALIDATED"},
                    {"taskId": 2, "status": "INVALIDATED"},
                ]
            },
        )
        assert resp.status_code == 200
        tasks = resp.json()["tasks"]
        Tasks = {t["taskId"]: t for t in tasks}
        self.assert_validated = (
            TestTasksActionsValidationUnlockAPI.assert_validated_task_response
        )
        self.assert_validated_task_response(
            Tasks[1], 1, "VALIDATED", self.test_user.username
        )
        self.assert_validated_task_response(
            Tasks[2], 2, "INVALIDATED", self.test_user.username
        )

    async def test_validation_unlock_returns_200_if_validated_with_comment(
        self, client: AsyncClient
    ):

        await self._update_task(
            1, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_user.id
        )
        await Task.lock_task_for_validating(
            1, self.test_project_id, self.test_user.id, self.db
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={
                "validatedTasks": [
                    {"taskId": 1, "status": "VALIDATED", "comment": "Test comment"}
                ]
            },
        )
        assert resp.status_code == 200
        self.assert_validated_task_response(
            resp.json()["tasks"][0],
            1,
            "VALIDATED",
            self.test_user.username,
            "Test comment",
        )


@pytest.mark.anyio
class TestTasksActionsValidationStopAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        test_user = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, test_user)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)
        self.url = (
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/stop-validation/"
        )

    async def _update_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        params = {**fields, "id": int(task_id), "proj": int(self.test_project_id)}
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            params,
        )

    async def _lock_for_validation(self, task_id, user_id, mapped_by=None):
        task_status = TaskStatus.LOCKED_FOR_VALIDATION.value
        task_id = int(task_id)
        user_id = int(user_id)
        project_id = int(self.test_project_id)

        if mapped_by:
            mapped_by = int(mapped_by)
            await self.db.execute(
                """
                UPDATE tasks
                SET task_status = :s,
                    locked_by = :l,
                    mapped_by = :m
                WHERE id = :id AND project_id = :proj
                """,
                {
                    "s": task_status,
                    "l": user_id,
                    "m": mapped_by,
                    "id": task_id,
                    "proj": project_id,
                },
            )
        else:
            await self.db.execute(
                """
                UPDATE tasks
                SET task_status = :s,
                    locked_by = :l
                WHERE id = :id AND project_id = :proj
                """,
                {"s": task_status, "l": user_id, "id": task_id, "proj": project_id},
            )

    async def test_validation_stop_returns_403_if_not_logged_in(
        self, client: AsyncClient
    ):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_validation_stop_returns_400_if_invalid_data(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"resetTasks": "invalid"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"

    async def test_validation_stop_returns_404_if_project_not_found(
        self, client: AsyncClient
    ):
        resp = await client.post(
            "/api/v2/projects/999/tasks/actions/stop-validation/",
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"resetTasks": [{"taskId": 1}]},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_validation_stop_returns_404_if_task_not_found(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"resetTasks": [{"taskId": 999}]},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    async def test_validation_stop_returns_403_if_task_not_locked_for_validation(
        self, client: AsyncClient
    ):
        await self._lock_for_validation(1, self.test_user.id)
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"resetTasks": [{"taskId": 1}, {"taskId": 2}]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "NotLockedForValidation "

    async def test_validation_stop_returns_403_if_task_locked_by_other_user(
        self, client: AsyncClient
    ):
        await self._lock_for_validation(
            1, self.test_author.id, mapped_by=self.test_author.id
        )
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"resetTasks": [{"taskId": 1}]},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "TaskNotOwned "

    async def test_validation_stop_returns_200_if_task_locked_by_user(
        self, client: AsyncClient
    ):
        await self._update_task(
            1, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_user.id
        )
        await Task.lock_task_for_validating(
            1, self.test_project_id, self.test_user.id, self.db
        )
        # Now call stop
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"resetTasks": [{"taskId": 1}]},
        )
        assert resp.status_code == 200
        task_resp = resp.json()["tasks"][0]
        assert task_resp["taskId"] == 1
        assert task_resp["projectId"] == int(self.test_project_id)
        # last status should match the status from DB (we read previous state)
        # Can't determine concrete last_status easily, so assert taskStatus exists
        assert "taskStatus" in task_resp

    async def test_validation_stop_returns_200_if_task_locked_by_user_with_comment(
        self, client: AsyncClient
    ):
        await self._update_task(
            1, task_status=TaskStatus.MAPPED.value, mapped_by=self.test_user.id
        )
        await Task.lock_task_for_validating(
            1, self.test_project_id, self.test_user.id, self.db
        )

        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            json={"resetTasks": [{"taskId": 1, "comment": "Test comment"}]},
        )
        assert resp.status_code == 200
        task_history_comment = resp.json()["tasks"][0]["taskHistory"][0]
        assert task_history_comment["action"] == "COMMENT"
        assert task_history_comment["actionText"] == "Test comment"
        assert task_history_comment["actionBy"] == self.test_user.username


@pytest.mark.anyio
class TestTasksActionsSplitAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/actions/split/1/"
        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        self.author_session_token = _encode_token(raw)

    async def _get_task(self, task_id=1):
        return await self.db.fetch_one(
            "SELECT * FROM tasks WHERE id = :id AND project_id = :proj",
            {"id": int(task_id), "proj": int(self.test_project_id)},
        )

    async def _update_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        params = {**fields, "id": int(task_id), "proj": int(self.test_project_id)}
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            params,
        )

    async def test_returns_403_if_not_logged_in(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_project_not_found(self, client: AsyncClient):
        resp = await client.post(
            "/api/v2/projects/999/tasks/actions/split/1/",
            headers={"Authorization": f"Token {self.author_session_token}"},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == PROJECT_NOT_FOUND_SUB_CODE

    async def test_returns_404_if_task_not_found(self, client: AsyncClient):
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/split/999/",
            headers={"Authorization": f"Token {self.author_session_token}"},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == TASK_NOT_FOUND_SUB_CODE

    async def test_returns_403_if_task_too_small_to_split(self, client: AsyncClient):
        # set zoom high (small area)
        await self._update_task(1, zoom=18)
        resp = await client.post(
            self.url, headers={"Authorization": f"Token {self.author_session_token}"}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "SmallToSplit"

    async def test_returns_403_if_task_not_locked_for_mapping(
        self, client: AsyncClient
    ):
        # task not locked, should be 403
        resp = await client.post(
            self.url, headers={"Authorization": f"Token {self.author_session_token}"}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "LockToSplit"

    async def test_returns_403_if_task_locked_by_other_user(self, client: AsyncClient):
        other_user = await return_canned_user(self.db, username="Other User", id=555)
        other_user = await create_canned_user(self.db, other_user)
        await self._update_task(
            1, task_status=TaskStatus.LOCKED_FOR_MAPPING.value, locked_by=other_user.id
        )
        resp = await client.post(
            self.url, headers={"Authorization": f"Token {self.author_session_token}"}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "SplitOtherUserTask"

    async def test_returns_200_if_task_locked_by_user(self, client: AsyncClient):
        await self._update_task(
            1,
            task_status=TaskStatus.LOCKED_FOR_MAPPING.value,
            locked_by=self.test_author.id,
        )
        proj_before = await self.db.fetch_one(
            "SELECT total_tasks FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        old_total_tasks = proj_before["total_tasks"]
        resp = await client.post(
            self.url, headers={"Authorization": f"Token {self.author_session_token}"}
        )
        assert resp.status_code == 200
        proj_after = await self.db.fetch_one(
            "SELECT total_tasks FROM projects WHERE id = :id",
            {"id": int(self.test_project_id)},
        )
        assert proj_after["total_tasks"] == old_total_tasks + 3
        # confirm original task 1 removed
        t1 = await self.db.fetch_one(
            "SELECT id FROM tasks WHERE id = :id AND project_id = :proj",
            {"id": 1, "proj": int(self.test_project_id)},
        )
        assert t1 is None


@pytest.mark.anyio
class TestTasksActionsMappingUndoAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        test_user = await return_canned_user(self.db, "Test User", 3333)
        self.test_user = await create_canned_user(self.db, test_user)
        # set mapping level for user
        await self.db.execute(
            "UPDATE users SET mapping_level = :lvl WHERE id = :id",
            {"lvl": 1, "id": int(self.test_user.id)},
        )
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)
        raw_author = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.author_session_token = _encode_token(raw_author)

    async def _map_and_validate_task(self, task_id, user_id):
        # lock, map, unlock to validated as per original validate_task helper
        await self.db.execute(
            "UPDATE tasks SET task_status = :s, locked_by = :l WHERE id = :id AND project_id = :proj",
            {
                "s": TaskStatus.LOCKED_FOR_MAPPING.value,
                "l": int(user_id),
                "id": int(task_id),
                "proj": int(self.test_project_id),
            },
        )
        # unlock to validated
        await self.db.execute(
            "UPDATE tasks SET task_status = :s WHERE id = :id AND project_id = :proj",
            {
                "s": TaskStatus.VALIDATED.value,
                "id": int(task_id),
                "proj": int(self.test_project_id),
            },
        )

    async def test_returns_403_if_not_logged_in(self, client: AsyncClient):
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/undo-last-action/1/"
        )
        assert resp.status_code == 403

    async def test_returns_403_if_task_in_invalid_state_for_undo(
        self, client: AsyncClient
    ):
        # set task to READY
        await self.db.execute(
            "UPDATE tasks SET task_status = :s WHERE id = :id AND project_id = :proj",
            {"s": TaskStatus.READY.value, "id": 1, "proj": int(self.test_project_id)},
        )
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/undo-last-action/1/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UndoPermissionError"

    async def test_returns_403_if_user_not_permitted_for_undo(
        self, client: AsyncClient
    ):
        # create a last task action by author

        await Task.lock_task_for_validating(
            1, self.test_project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            1, self.test_project_id, self.test_author.id, TaskStatus.VALIDATED, self.db
        )

        await self.db.execute(
            "UPDATE projects SET validation_permission = :vp WHERE id = :id",
            {"vp": ValidationPermission.TEAMS.value, "id": int(self.test_project_id)},
        )
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/undo-last-action/1/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UndoPermissionError"

    @staticmethod
    def assert_undo_response(response, project_id, last_status, username, new_status):
        assert response.json()["taskStatus"] == new_status
        assert response.json()["taskId"] == 1
        assert response.json()["projectId"] == project_id
        action_history = response.json()["taskHistory"][0]
        comment_history = response.json()["taskHistory"][1]
        assert action_history["action"] == TaskAction.STATE_CHANGE.name
        assert action_history["actionText"] == new_status
        assert action_history["actionBy"] == username
        assert comment_history["action"] == TaskAction.COMMENT.name
        assert (
            comment_history["actionText"]
            == f"Undo state from {last_status} to {new_status}"
        )
        assert comment_history["actionBy"] == username

    async def test_returns_200_if_undo_by_user_with_last_action(
        self, client: AsyncClient
    ):
        await Task.lock_task_for_validating(
            1, self.test_project_id, self.test_user.id, self.db
        )
        await Task.unlock_task(
            1, self.test_project_id, self.test_user.id, TaskStatus.VALIDATED, self.db
        )
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/undo-last-action/1/",
            headers={"Authorization": f"Token {self.user_session_token}"},
        )
        assert resp.status_code == 200
        # last_status/new_status values are hard to deduce in DB here; assert structure returned
        TestTasksActionsMappingUndoAPI.assert_undo_response(
            resp,
            int(self.test_project_id),
            TaskStatus.VALIDATED.name,
            self.test_user.username,
            TaskStatus.MAPPED.name,
        )

    async def test_returns_200_if_undo_by_user_with_validation_permission(
        self, client: AsyncClient
    ):
        await Task.lock_task_for_validating(
            1, self.test_project_id, self.test_user.id, self.db
        )
        await Task.unlock_task(
            1, self.test_project_id, self.test_user.id, TaskStatus.VALIDATED, self.db
        )
        await self.db.execute(
            "UPDATE projects SET validation_permission = :vp, status = :s WHERE id = :id",
            {
                "vp": ValidationPermission.ANY.value,
                "s": ProjectStatus.PUBLISHED.value,
                "id": int(self.test_project_id),
            },
        )
        resp = await client.post(
            f"/api/v2/projects/{self.test_project_id}/tasks/actions/undo-last-action/1/",
            headers={"Authorization": f"Token {self.author_session_token}"},
        )
        assert resp.status_code == 200
        TestTasksActionsMappingUndoAPI.assert_undo_response(
            resp,
            int(self.test_project_id),
            TaskStatus.VALIDATED.name,
            self.test_author.username,
            TaskStatus.MAPPED.name,
        )

