import base64
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from backend.exceptions import NotFound, get_message_from_sub_code
from backend.models.postgis.statuses import ProjectStatus, UserRole
from backend.services.messaging.chat_service import ChatService, ChatMessageDTO
from backend.services.messaging.message_service import MessageService
from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.utils import timestamp
from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)

TEST_MESSAGE = "Test comment"
PROJECT_NOT_FOUND_SUB_CODE = "PROJECT_NOT_FOUND"
TASK_NOT_FOUND_SUB_CODE = "TASK_NOT_FOUND"
MESSAGE_NOT_FOUND_SUB_CODE = "MESSAGE_NOT_FOUND"
PROJECT_NOT_FOUND_MESSAGE = get_message_from_sub_code(PROJECT_NOT_FOUND_SUB_CODE)
TASK_NOT_FOUND_MESSAGE = get_message_from_sub_code(TASK_NOT_FOUND_SUB_CODE)
MESSAGE_NOT_FOUND_MESSAGE = get_message_from_sub_code(MESSAGE_NOT_FOUND_SUB_CODE)


class DummyBackgroundTasks:
    def __init__(self):
        self.tasks = []

    def add_task(self, func, *args, **kwargs):
        # record the callable and its args so tests can assert against it
        self.tasks.append((func, args, kwargs))


@pytest.mark.anyio
class TestCommentsProjectsAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create project (helper may return (project, author, id) or (project, author) or project only)
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        # tokens and endpoints
        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        b64 = base64.b64encode(raw.encode("utf-8")).decode("utf-8")
        self.test_author_token = f"Token {b64}"

        self.endpoint_url = f"/api/v2/projects/{self.test_project_id}/comments/"
        self.non_existent_url = "/api/v2/projects/99/comments/"

    async def test_post_comment_to_project_chat_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(self.endpoint_url, json={"message": TEST_MESSAGE})
        body = resp.json()
        assert resp.status_code == 403
        assert body == {"detail": "Not authenticated"}

    async def test_post_comment_to_project_chat_by_blocked_user_fails(
        self, client: AsyncClient
    ):
        # create blocked (read-only) user
        blocked = await return_canned_user(self.db, username="test_user", id=33333)
        blocked = await create_canned_user(self.db, blocked)
        # set role to read-only in DB
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.READ_ONLY.value, "id": blocked.id},
        )

        raw = AuthenticationService.generate_session_token_for_user(blocked.id)
        token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": f"Token {token}"},
            json={"message": TEST_MESSAGE},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "User is on read only mode"
        assert body["SubCode"] == "ReadOnly"

    async def test_invalid_request_to_post_comment_to_project_chat_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"comment": TEST_MESSAGE},
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["Error"] == "Unable to add chat message"
        assert body["SubCode"] == "InvalidData"

    async def test_post_comment_to_chat_of_non_existent_project_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.non_existent_url,
            headers={"Authorization": self.test_author_token},
            json={"message": TEST_MESSAGE},
        )
        assert resp.status_code == 404
        body = resp.json()
        assert body["error"]["message"] == "Project not found"

    @patch.object(MessageService, "send_message_after_chat")
    async def test_post_comment_to_project_chat_passes(
        self, mock_send_message, client: AsyncClient
    ):
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"message": TEST_MESSAGE},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["chat"]) == 1
        chat_details = body["chat"][0]
        # original expects exact formatted HTML; be explicit
        assert chat_details["message"] == "<p>Test comment</p>"
        mock_send_message.assert_called_once()

    async def test_get_chat_messages_of_non_existent_project_fails(
        self, client: AsyncClient
    ):
        resp = await client.get(self.non_existent_url)
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == PROJECT_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == PROJECT_NOT_FOUND_SUB_CODE

    async def test_get_project_chat_messages_passes(self, client: AsyncClient):
        resp = await client.get(self.endpoint_url)
        assert resp.status_code == 200
        assert resp.json() == {"chat": [], "pagination": None}


@pytest.mark.anyio
class TestCommentsProjectsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": self.test_project_id},
        )

        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        self.test_author_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )
        # create a normal user for negative tests
        self.test_user = await return_canned_user(
            self.db, username="test_user", id=10000
        )
        self.test_user = await create_canned_user(self.db, self.test_user)
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.test_user_token = (
            f"Token {base64.b64encode(raw_user.encode('utf-8')).decode('utf-8')}"
        )

        # create a comment for the project and keep its id
        created_comment = await self._create_project_chat(self.test_author)
        # unify representation: dict with 'id' or object-like with .id
        if isinstance(created_comment, dict):
            self.test_comment = created_comment
        else:
            # try to convert to dict-like
            self.test_comment = {"id": getattr(created_comment, "id", None)}
        self.endpoint_url = f"/api/v2/projects/{self.test_project_id}/comments/{self.test_comment['id']}/"
        self.non_existent_url = f"/api/v2/projects/{self.test_project_id}/comments/100/"

    async def _create_project_chat(self, user):
        bg = DummyBackgroundTasks()

        chat_dto = ChatMessageDTO(
            message="Test Message",
            user_id=user.id,
            project_id=self.test_project_id,
            username=user.username,
            timestamp=timestamp(),
        )

        result = await ChatService.post_message(
            chat_dto, self.test_project_id, user.id, self.db, background_tasks=bg
        )
        if isinstance(result, dict):
            chat = result.get("chat", [])
            return chat[0]
        return result.chat[0]

    async def test_delete_comment_returns_401_if_user_not_logged_in(
        self, client: AsyncClient
    ):
        resp = await client.delete(self.endpoint_url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_delete_non_existent_comment_fails(self, client: AsyncClient):
        resp = await client.delete(
            self.non_existent_url, headers={"Authorization": self.test_author_token}
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == MESSAGE_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == MESSAGE_NOT_FOUND_SUB_CODE

    async def test_returns_403_if_user_not_allowed_to_delete_comment(
        self, client: AsyncClient
    ):
        resp = await client.delete(
            self.endpoint_url, headers={"Authorization": self.test_user_token}
        )
        body = resp.json()
        assert resp.status_code == 403
        assert body["Error"] == " User not allowed to delete message"
        assert body["SubCode"] == "DeletePermissionError"

    async def test_comment_can_be_deleted_by_author(self, client: AsyncClient):
        # create a comment by test_user and then delete as that user
        test_comment = await self._create_project_chat(self.test_user)
        comment_id = (
            test_comment.get("id")
            if isinstance(test_comment, dict)
            else getattr(test_comment, "id", None)
        )
        endpoint = f"/api/v2/projects/{self.test_project_id}/comments/{comment_id}/"

        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        token = f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        resp = await client.delete(endpoint, headers={"Authorization": token})
        assert resp.status_code == 200
        body = resp.json()
        assert body["Success"] == "Comment deleted"

        with pytest.raises(NotFound):
            await ChatService.get_project_chat_by_id(
                self.test_project_id, comment_id, self.db
            )

    async def test_pm_can_delete_any_comment(self, client: AsyncClient):
        # create a comment by test_user then delete with PM (test_author)
        test_comment = await self._create_project_chat(self.test_user)
        comment_id = (
            test_comment.get("id")
            if isinstance(test_comment, dict)
            else getattr(test_comment, "id", None)
        )
        endpoint = f"/api/v2/projects/{self.test_project_id}/comments/{comment_id}/"
        resp = await client.delete(
            endpoint, headers={"Authorization": self.test_author_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["Success"] == "Comment deleted"

        with pytest.raises(NotFound):
            await ChatService.get_project_chat_by_id(
                self.test_project_id, comment_id, self.db
            )


@pytest.mark.anyio
class TestCommentsTasksRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        self.test_author_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

        self.endpoint_url = f"/api/v2/projects/{self.test_project_id}/comments/tasks/1/"
        self.non_existent_url = "/api/v2/projects/99/comments/tasks/1/"

    async def test_post_comment_to_task_chat_by_unauthenticated_user_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(self.endpoint_url, json={"comment": TEST_MESSAGE})
        assert resp.status_code == 403
        body = resp.json()
        assert body == {"detail": "Not authenticated"}

    async def test_post_comment_to_task_chat_by_blocked_user_fails(
        self, client: AsyncClient
    ):
        blocked = await return_canned_user(self.db, username="test_user", id=33333)
        blocked = await create_canned_user(self.db, blocked)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.READ_ONLY.value, "id": blocked.id},
        )
        raw = AuthenticationService.generate_session_token_for_user(blocked.id)
        token = f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": token},
            json={"comment": TEST_MESSAGE},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["Error"] == "User is on read only mode"
        assert body["SubCode"] == "ReadOnly"

    async def test_post_comment_to_task_chat_using_an_invalid_request_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"message": TEST_MESSAGE},
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["Error"] == "Unable to add comment"
        assert body["SubCode"] == "InvalidData"

    async def test_post_comment_to_task_chat_of_non_existent_project_fails(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.non_existent_url,
            headers={"Authorization": self.test_author_token},
            json={"comment": TEST_MESSAGE},
        )
        assert resp.status_code == 404
        body = resp.json()
        error = body.get("error", {})
        assert error.get("message") == PROJECT_NOT_FOUND_MESSAGE
        assert error.get("sub_code") == PROJECT_NOT_FOUND_SUB_CODE

    async def test_post_comment_to_task_chat_passes(self, client: AsyncClient):
        resp = await client.post(
            self.endpoint_url,
            headers={"Authorization": self.test_author_token},
            json={"comment": TEST_MESSAGE},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskId"] == 1
