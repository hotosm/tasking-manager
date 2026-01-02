import base64
from datetime import datetime, timedelta
import logging

import pytest
from httpx import AsyncClient

from backend.models.postgis.message import MessageType
from backend.services.users.authentication_service import AuthenticationService
from backend.exceptions import get_message_from_sub_code

# async helpers — adjust import path if needed
from tests.api.helpers.test_helpers import (
    create_canned_user,
    return_canned_user,
    create_canned_message,
    create_canned_notification,
    create_canned_project,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

NOT_FOUND_SUB_CODE = "MESSAGE_NOT_FOUND"
NOT_FOUND_MESSAGE = get_message_from_sub_code(NOT_FOUND_SUB_CODE)


@pytest.mark.anyio
class TestNotificationsRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Setup per-test:
         - create a sender and receiver user
         - create a message and assign sender/receiver
         - precompute encoded tokens used in tests
        """
        self.db = db_connection_fixture

        # create message, sender and receiver
        self.test_sender = await create_canned_user(self.db)
        self.test_receiver = await return_canned_user(self.db, "Test user", 11111)
        # ensure receiver exists in DB
        self.test_receiver = await create_canned_user(self.db, self.test_receiver)

        # create message and assign sender/receiver
        self.test_message = await create_canned_message(
            db=self.db, subject="Test subject", message="This is a test message"
        )

        # persist relationships explicitly to be robust against helper behaviour
        await self.db.execute(
            "UPDATE messages SET from_user_id = :from_id, to_user_id = :to_id WHERE id = :id",
            {
                "from_id": self.test_sender.id,
                "to_id": self.test_receiver.id,
                "id": int(self.test_message.id),
            },
        )

        # tokens (raw then base64-encoded to match existing auth scheme)
        raw_sender = AuthenticationService.generate_session_token_for_user(
            self.test_sender.id
        )
        raw_receiver = AuthenticationService.generate_session_token_for_user(
            self.test_receiver.id
        )
        self.test_sender_token = base64.b64encode(raw_sender.encode("utf-8")).decode(
            "utf-8"
        )
        self.test_receiver_token = base64.b64encode(
            raw_receiver.encode("utf-8")
        ).decode("utf-8")

        self.url = f"/api/v2/notifications/{self.test_message.id}/"
        self.non_existent_url = "/api/v2/notifications/9999999/"

    async def test_get_message_returns_403(self, client: AsyncClient):
        response = await client.get(self.url)

        assert response.status_code == 403
        assert response.json() == {"detail": "Not authenticated"}

    async def test_get_message_cant_access_other_user_message(
        self, client: AsyncClient
    ):
        response = await client.get(
            self.url, headers={"Authorization": f"Token {self.test_sender_token}"}
        )
        assert response.status_code == 403
        body = response.json()
        assert body.get("SubCode") == "AccessOtherUserMessage"

    async def test_get_message_returns_404(self, client: AsyncClient):
        response = await client.get(
            self.non_existent_url,
            headers={"Authorization": f"Token {self.test_sender_token}"},
        )
        assert response.status_code == 404
        body = response.json()
        error = body.get("error", {})
        assert error.get("message") == NOT_FOUND_MESSAGE
        assert error.get("sub_code") == NOT_FOUND_SUB_CODE

    async def test_get_message_returns_200(self, client: AsyncClient):
        response = await client.get(
            self.url, headers={"Authorization": f"Token {self.test_receiver_token}"}
        )
        assert response.status_code == 200
        body = response.json()
        assert body["subject"] == "Test subject"
        assert body["message"] == "This is a test message"
        assert body["fromUsername"] == self.test_sender.username

    async def test_delete_message_returns_403(self, client: AsyncClient):
        response = await client.delete(self.url)
        assert response.status_code == 403
        assert response.json() == {"detail": "Not authenticated"}

    async def test_delete_message_cant_delete_other_user_message(
        self, client: AsyncClient
    ):
        response = await client.delete(
            self.url, headers={"Authorization": f"Token {self.test_sender_token}"}
        )
        assert response.status_code == 403
        body = response.json()
        assert body.get("SubCode") == "AccessOtherUserMessage"

    async def test_delete_message_returns_404(self, client: AsyncClient):
        response = await client.delete(
            self.non_existent_url,
            headers={"Authorization": f"Token {self.test_sender_token}"},
        )
        assert response.status_code == 404
        body = response.json()
        error = body.get("error", {})
        assert error.get("message") == NOT_FOUND_MESSAGE
        assert error.get("sub_code") == NOT_FOUND_SUB_CODE

    async def test_delete_message_returns_200(self, client: AsyncClient):
        response = await client.delete(
            self.url, headers={"Authorization": f"Token {self.test_receiver_token}"}
        )
        assert response.status_code == 200
        body = response.json()
        assert body.get("Success") == "Message deleted"


@pytest.mark.anyio
class TestNotificationsAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_user = await create_canned_user(self.db)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.test_user_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")

        test_user_1 = await return_canned_user(self.db, "Test 1", 333)
        self.test_user_1 = await create_canned_user(self.db, test_user_1)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user_1.id)
        self.test_user_1_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")

        test_user_2 = await return_canned_user(self.db, "Test 2", 444)
        self.test_user_2 = await create_canned_user(self.db, test_user_2)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user_2.id)
        self.test_user_2_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")

        self.url = "/api/v2/notifications/"

    async def test_get_message_notifications_returns_403(self, client: AsyncClient):
        response = await client.get(self.url)
        assert response.status_code == 403
        assert response.json() == {"detail": "Not authenticated"}

    async def test_get_messages_no_query_params_returns_200(self, client: AsyncClient):
        # initially no messages
        response = await client.get(
            self.url, headers={"Authorization": f"Token {self.test_user_token}"}
        )
        assert response.status_code == 200
        body = response.json()
        assert body.get("userMessages") == []

        # add a broadcast message and ensure it's assigned to the user
        test_message = await create_canned_message(
            db=self.db,
            subject="Test subject",
            message="This is a test message",
            message_type=MessageType.BROADCAST.value,
        )
        await self.db.execute(
            "UPDATE messages SET to_user_id = :to_id WHERE id = :id",
            {"to_id": self.test_user.id, "id": int(test_message.id)},
        )

        response = await client.get(
            self.url, headers={"Authorization": f"Token {self.test_user_token}"}
        )
        assert response.status_code == 200
        body = response.json()
        pagination = body.get("pagination", {})
        assert pagination.get("page") == 1
        assert pagination.get("pages") == 1
        assert pagination.get("perPage") == 10
        assert len(body.get("userMessages", [])) == 1
        user_messages = body["userMessages"][0]
        assert user_messages["subject"] == "Test subject"
        assert user_messages["message"] == "This is a test message"
        assert user_messages["messageType"] == MessageType.BROADCAST.name

    async def test_get_messages_with_query_params_returns_200(
        self, client: AsyncClient
    ):
        # create broadcast message and assign to test_user
        test_message = await create_canned_message(
            db=self.db,
            subject="Test subject",
            message="This is a test message",
            message_type=MessageType.BROADCAST.value,
        )
        await self.db.execute(
            "UPDATE messages SET to_user_id = :to_id, date = :date WHERE id = :id",
            {
                "to_id": self.test_user.id,
                "date": datetime.utcnow(),
                "id": int(test_message.id),
            },
        )

        # ?from= (user not sender)
        response = await client.get(
            f"{self.url}?from={self.test_user.username}",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 0

        # set user as sender
        await self.db.execute(
            "UPDATE messages SET from_user_id = :from_id WHERE id = :id",
            {"from_id": self.test_user.id, "id": int(test_message.id)},
        )
        response = await client.get(
            f"{self.url}?from={self.test_user.username}",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 1

        # ?project=
        proj, test_user, proj_id = await create_canned_project(self.db)
        # no messages expected
        response = await client.get(
            f"{self.url}?project={proj_id}",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 0

        # associate message with project
        await self.db.execute(
            "UPDATE messages SET project_id = :proj_id WHERE id = :id",
            {"proj_id": int(proj_id), "id": int(test_message.id)},
        )
        response = await client.get(
            f"{self.url}?project={proj_id}",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 1

        # ?taskId=
        response = await client.get(
            f"{self.url}?taskId=1",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 0

        # associate task id
        await self.db.execute(
            "UPDATE messages SET task_id = :task_id WHERE id = :id",
            {"task_id": 1, "id": int(test_message.id)},
        )
        response = await client.get(
            f"{self.url}?taskId=1",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 1

        # ?project=&taskId=
        response = await client.get(
            f"{self.url}?project={proj_id}&taskId=1111",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 0

        response = await client.get(
            f"{self.url}?project={proj_id}&taskId=1",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 1

        # ?messageType=
        response = await client.get(
            f"{self.url}?messageType=1",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 0

        response = await client.get(
            f"{self.url}?messageType=2",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 1

        response = await client.get(
            f"{self.url}?messageType=1,2,3,4,5",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 1

        # ?status
        await self.db.execute(
            "UPDATE messages SET read = false WHERE id = :id",
            {"id": int(test_message.id)},
        )
        response = await client.get(
            f"{self.url}?status=unread",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 1

        response = await client.get(
            f"{self.url}?status=read",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        assert len(response.json().get("userMessages", [])) == 0

        # add older message
        older = await create_canned_message(
            db=self.db,
            subject="Older Test Subject",
            message="This is an older test message",
            message_type=MessageType.MENTION_NOTIFICATION.value,
        )
        older_date = datetime.utcnow() - timedelta(days=6)
        await self.db.execute(
            "UPDATE messages SET date = :date, to_user_id = :to_id WHERE id = :id",
            {"date": older_date, "to_id": self.test_user.id, "id": int(older.id)},
        )

        # ?sortBy=date
        response = await client.get(
            f"{self.url}?sortBy=date",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        user_messages = response.json().get("userMessages", [])
        assert len(user_messages) == 2
        assert user_messages[0]["subject"] == "Test subject"
        assert user_messages[0]["message"] == "This is a test message"
        assert user_messages[0]["messageType"] == MessageType.BROADCAST.name
        assert user_messages[1]["subject"] == "Older Test Subject"
        assert user_messages[1]["message"] == "This is an older test message"
        assert user_messages[1]["messageType"] == MessageType.MENTION_NOTIFICATION.name

        # ?sortDirection=desc
        response = await client.get(
            f"{self.url}?sortDirection=desc",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        user_messages = response.json().get("userMessages", [])
        assert len(user_messages) == 2
        assert user_messages[0]["sentDate"] > user_messages[1]["sentDate"]
        assert user_messages[0]["subject"] == "Test subject"
        assert user_messages[1]["subject"] == "Older Test Subject"

        # ?sortDirection=asc
        response = await client.get(
            f"{self.url}?sortDirection=asc",
            headers={"Authorization": f"Token {self.test_user_token}"},
        )
        assert response.status_code == 200
        user_messages = response.json().get("userMessages", [])
        assert len(user_messages) == 2
        assert user_messages[0]["sentDate"] < user_messages[1]["sentDate"]
        assert user_messages[0]["subject"] == "Older Test Subject"
        assert user_messages[1]["subject"] == "Test subject"


@pytest.mark.anyio
class TestNotificationsQueriesCountUnreadAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_user = await create_canned_user(self.db)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.test_user_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")
        self.url = "/api/v2/notifications/queries/own/count-unread/"

        self.test_message = await create_canned_message(
            db=self.db, subject="Test subject", message="This is a test message"
        )
        await self.db.execute(
            "UPDATE messages SET to_user_id = :to_id WHERE id = :id",
            {"to_id": self.test_user.id, "id": int(self.test_message.id)},
        )

    async def test_get_unread_count_returns_403(self, client: AsyncClient):
        response = await client.get(self.url)
        assert response.status_code == 403
        assert response.json() == {"detail": "Not authenticated"}

    async def test_get_unread_count_returns_200(self, client: AsyncClient):
        response = await client.get(
            self.url, headers={"Authorization": f"Token {self.test_user_token}"}
        )
        assert response.status_code == 200
        assert response.json() == {"newMessages": True, "unread": 1}


@pytest.mark.anyio
class TestNotificationsQueriesPostUnreadAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_user = await create_canned_user(self.db)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.test_user_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")
        # create a notification row
        await create_canned_notification(
            db=self.db, user_id=self.test_user.id, unread_count=1, date=datetime.today()
        )
        self.url = "/api/v2/notifications/queries/own/post-unread/"

    async def test_post_unread_count_returns_403(self, client: AsyncClient):
        response = await client.post(self.url)
        assert response.status_code == 403
        assert response.json() == {"detail": "Not authenticated"}

    async def test_post_unread_count_returns_200(self, client: AsyncClient):
        response = await client.post(
            self.url, headers={"Authorization": f"Token {self.test_user_token}"}
        )
        assert response.status_code == 200
        assert response.json() == 1
