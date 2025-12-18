import base64
from unittest.mock import AsyncMock, patch

from backend.services.users.user_service import UserService
import pytest
from httpx import AsyncClient

from backend.services.messaging.smtp_service import SMTPService
from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.statuses import UserRole

from pydantic import ValidationError
from tests.api.helpers.test_helpers import (
    create_canned_user,
    return_canned_user,
    create_canned_interest,
)

TEST_EMAIL = "test@test.com"


@pytest.mark.anyio
class TestUsersActionsSetUsersAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)
        self.url = "/api/v2/users/me/actions/set-user/"

        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

    async def test_returns_401_if_no_token(self, client: AsyncClient):
        resp = await client.patch(self.url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_returns_401_if_other_user_requested(self, client: AsyncClient):
        resp = await client.patch(
            self.url, headers={"Authorization": self.user_session_token}, json={"id": 2}
        )
        assert resp.status_code == 401
        body = resp.json()
        assert body["Error"] == "Unable to authenticate"
        assert body["SubCode"] == "UnableToAuth"

    async def test_returns_400_if_invalid_data(self, client: AsyncClient):

        # Act / Assert
        with pytest.raises(ValidationError):
            await client.patch(
                self.url,
                headers={"Authorization": self.user_session_token},
                json={"id": self.test_user.id, "emailAddress": "invalid_email"},
            )

    async def test_returns_404_if_user_not_found(self, client: AsyncClient):
        raw = AuthenticationService.generate_session_token_for_user(999)
        token = f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        resp = await client.patch(
            self.url, headers={"Authorization": token}, json={"id": 999}
        )
        assert resp.status_code == 404

    async def test_returns_200_if_user_updated(self, client: AsyncClient):
        sample_payload = {
            "id": self.test_user.id,
            "name": "ThinkWhere",
            "city": "test_city",
            "country": "AD",
            "twitterId": "test_twitter",
            "facebookId": "test_facebook",
            "linkedinId": "test_linkedin",
            "slackId": "test_slack",
            "gender": "MALE",
            "selfDescriptionGender": None,
        }

        resp = await client.patch(
            self.url,
            headers={"Authorization": self.user_session_token},
            json=sample_payload,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("verificationEmailSent") is False

        user_details = await UserService.get_user_by_id(self.test_user.id, self.db)
        assert user_details.name == sample_payload["name"]
        assert user_details.city == sample_payload["city"]
        assert user_details.country == sample_payload["country"]
        assert user_details.slack_id == sample_payload["slackId"]

    async def test_returns_200_if_user_updated_with_email(self, client: AsyncClient):
        with patch.object(
            SMTPService, "send_verification_email", new_callable=AsyncMock
        ) as mock_send_verification_email:
            mock_send_verification_email.return_value = True

            resp = await client.patch(
                self.url,
                headers={"Authorization": self.user_session_token},
                json={"id": self.test_user.id, "emailAddress": TEST_EMAIL},
            )

            assert resp.status_code == 200
            assert resp.json().get("verificationEmailSent") is True
            mock_send_verification_email.assert_awaited_once()


@pytest.mark.anyio
class TestUsersActionsRegisterEmailAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.url = "/api/v2/users/actions/register/"

    async def test_returns_422_if_no_data(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 422

    async def test_returns_200_if_email_registered(self, client: AsyncClient):
        sample_payload = {"email": TEST_EMAIL}
        resp = await client.post(self.url, json=sample_payload)
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("email") == TEST_EMAIL
        assert body.get("success") is True


@pytest.mark.anyio
class TestUsersActionsSetInterestsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)
        self.url = "/api/v2/users/me/actions/set-interests/"
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

    async def test_returns_403_if_no_token(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_404_if_interests_not_found(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            headers={"Authorization": self.user_session_token},
            json={"interests": [999]},
        )
        assert resp.status_code == 404

    async def test_returns_400_if_invalid_data(self, client: AsyncClient):
        resp = await client.post(
            self.url,
            headers={"Authorization": self.user_session_token},
            json={"key": "invalid"},
        )
        assert resp.status_code == 400

    async def test_returns_200_if_interests_set(self, client: AsyncClient):
        interest_1 = await create_canned_interest(
            self.db, interest_id=122, name="test_interest_1"
        )
        interest_2 = await create_canned_interest(
            self.db, interest_id=123, name="test_interest_2"
        )
        sample_payload = {"interests": [interest_1.id, interest_2.id]}

        resp = await client.post(
            self.url,
            headers={"Authorization": self.user_session_token},
            json=sample_payload,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body.get("interests", [])) == 2
        assert body["interests"][0]["id"] == interest_1.id
        assert body["interests"][1]["id"] == interest_2.id


@pytest.mark.anyio
class TestUsersActionsVerifyEmailAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)
        self.url = "/api/v2/users/me/actions/verify-email/"
        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

    async def test_returns_401_if_no_token(self, client: AsyncClient):
        resp = await client.patch(self.url)
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Not authenticated"}

    async def test_returns_400_if_user_has_not_set_email(self, client: AsyncClient):
        resp = await client.patch(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 400

    async def test_returns_200_if_verification_email_resent(self, client: AsyncClient):
        # set email for user in db
        await self.db.execute(
            "UPDATE users SET email_address = :email WHERE id = :id",
            {"email": TEST_EMAIL, "id": self.test_user.id},
        )

        with patch.object(
            SMTPService, "_send_message", new_callable=AsyncMock
        ) as mock_send_message:
            resp = await client.patch(
                self.url, headers={"Authorization": self.user_session_token}
            )
            assert resp.status_code == 200
            mock_send_message.assert_awaited_once()


@pytest.mark.anyio
class TestUsersActionsSetRoleAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_result = await return_canned_user(self.db)
        self.test_user = await create_canned_user(self.db, user_result)

        admin_result = await return_canned_user(
            self.db, username="test_admin", id=222222
        )
        self.admin_user = await create_canned_user(self.db, admin_result)

        # make admin
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.admin_user.id},
        )

        raw_admin = AuthenticationService.generate_session_token_for_user(
            self.admin_user.id
        )
        raw_user = AuthenticationService.generate_session_token_for_user(
            self.test_user.id
        )
        self.admin_session_token = (
            f"Token {base64.b64encode(raw_admin.encode('utf-8')).decode('utf-8')}"
        )
        self.user_session_token = (
            f"Token {base64.b64encode(raw_user.encode('utf-8')).decode('utf-8')}"
        )

        self.url = f"/api/v2/users/{self.test_user.username}/actions/set-role/{UserRole.ADMIN.name}/"

    async def test_returns_403_if_no_token(self, client: AsyncClient):
        resp = await client.patch(self.url)
        assert resp.status_code == 403

    async def test_returns_403_if_user_not_admin(self, client: AsyncClient):
        resp = await client.patch(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["error"]["message"] == "Admin access required"

    async def test_returns_403_if_unknown_user_role(self, client: AsyncClient):
        resp = await client.patch(
            f"/api/v2/users/{self.test_user.username}/actions/set-role/GOD/",
            headers={"Authorization": self.admin_session_token},
        )
        assert resp.status_code == 403
        assert resp.json().get("SubCode") == "UnknownAddRole"

    async def test_returns_404_if_user_not_found(self, client: AsyncClient):
        resp = await client.patch(
            "/api/v2/users/unknown/actions/set-role/ADMIN/",
            headers={"Authorization": self.admin_session_token},
        )
        assert resp.status_code == 404
        assert resp.json().get("error", {}).get("sub_code") == "USER_NOT_FOUND"

    async def test_returns_200_if_user_role_set(self, client: AsyncClient):
        resp = await client.patch(
            self.url, headers={"Authorization": self.admin_session_token}
        )
        assert resp.status_code == 200
        assert resp.json().get("Success") == "Role Added"

        # verify role changed in db
        row = await self.db.fetch_one(
            "SELECT role FROM users WHERE id = :id", {"id": self.test_user.id}
        )
        assert row["role"] == UserRole.ADMIN.value

    async def test_returns_200_if_user_role_removed(self, client: AsyncClient):
        # set role to ADMIN first
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.test_user.id},
        )

        resp = await client.patch(
            f"/api/v2/users/{self.test_user.username}/actions/set-role/{UserRole.MAPPER.name}/",
            headers={"Authorization": self.admin_session_token},
        )
        assert resp.status_code == 200
        assert resp.json().get("Success") == "Role Added"
        row = await self.db.fetch_one(
            "SELECT role FROM users WHERE id = :id", {"id": self.test_user.id}
        )
        assert row["role"] == UserRole.MAPPER.value
