import base64
import pytest
from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import (
    create_canned_user,
    create_canned_message,
)

TEST_SUBJECT_1 = "Test subject 1"
TEST_SUBJECT_2 = "Test subject 2"
TEST_MESSAGE_1 = "This is a test message 1"
TEST_MESSAGE_2 = "This is a test message 2"


@pytest.mark.anyio
class TestNotificationsActionsDeleteMultipleAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Setup:
         - create a test user
         - create two messages
         - set both messages' from_user_id to the test user
         - prepare auth token and endpoint url
        """
        self.db = db_connection_fixture

        self.test_user = await create_canned_user(self.db)

        self.test_message_one = await create_canned_message(
            db=self.db, subject=TEST_SUBJECT_1, message=TEST_MESSAGE_1
        )
        self.test_message_two = await create_canned_message(
            db=self.db, subject=TEST_SUBJECT_2, message=TEST_MESSAGE_2
        )

        # assign sender for both messages
        await self.db.execute(
            "UPDATE messages SET from_user_id = :from_id WHERE id = :id",
            {"from_id": self.test_user.id, "id": int(self.test_message_one.id)},
        )
        await self.db.execute(
            "UPDATE messages SET from_user_id = :from_id WHERE id = :id",
            {"from_id": self.test_user.id, "id": int(self.test_message_two.id)},
        )

        # prepare token (matches your other tests' auth format)
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.test_user_token = base64.b64encode(raw.encode("utf-8")).decode("utf-8")

        self.url = "/api/v2/notifications/delete-multiple/"

    async def test_delete_multiple_messages_returns_403(self, client: AsyncClient):
        """
        Unauthenticated user should receive 403
        """
        payload = {"messageIds": [self.test_message_one.id, self.test_message_two.id]}

        # use .request() so we can pass json= safely
        response = await client.request("DELETE", self.url, json=payload)
        assert response.status_code == 403
        assert response.json() == {"detail": "Not authenticated"}

    async def test_delete_multiple_messages_returns_200(self, client: AsyncClient):
        """
        Authenticated user should be able to delete multiple messages
        """
        payload = {"messageIds": [self.test_message_one.id, self.test_message_two.id]}

        response = await client.request(
            "DELETE",
            self.url,
            headers={"Authorization": f"Token {self.test_user_token}"},
            json=payload,
        )
        assert response.status_code == 200
        body = response.json()
        assert body.get("Success") == "Messages deleted"
